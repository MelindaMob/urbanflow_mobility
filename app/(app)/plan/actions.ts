"use server";

import type {
  Coord,
  GeocodedPlace,
  Itinerary,
  Mode,
  TransitStopDisplay,
} from "@/types/mobility";
import { ORSAdapter } from "@/lib/adapters/ORSAdapter";
import { TBMAdapter } from "@/lib/adapters/TBMAdapter";
import { TripService } from "@/lib/services/TripService";
import { createClient } from "@/lib/supabase/server";
import { geocodeSchema, planTripSchema } from "@/lib/validation";

export async function geocodeAddress(
  query: string
): Promise<{ places: GeocodedPlace[]; error?: string }> {
  const parsed = geocodeSchema.safeParse({ query });
  if (!parsed.success) {
    return { places: [] };
  }

  const apiKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
  if (!apiKey) {
    return { places: [], error: "Configuration serveur manquante." };
  }

  try {
    const encoded = encodeURIComponent(parsed.data.query);
    const url = new URL(`https://api.maptiler.com/geocoding/${encoded}.json`);
    url.searchParams.set("key", apiKey);
    url.searchParams.set("language", "fr");
    url.searchParams.set("limit", "8");
    url.searchParams.set("types", "address,place,poi");
    // Bias Bordeaux Métropole (adresses + établissements)
    url.searchParams.set("proximity", "-0.5792,44.8378");
    url.searchParams.set("bbox", "-0.85,44.70,-0.35,45.05");

    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 }, // évite de re-consommer le quota ORS pour la même requête tapée 2x en 1 min
    });

    if (!response.ok) {
      return { places: [], error: "Erreur du service de géocodage." };
    }

    const data = await response.json();

    // MapTiler (format Mapbox-compatible) : place_name + center [lng, lat]
    const houseMatch = parsed.data.query.match(/^(\d+)\s+/);
    const houseNumber = houseMatch?.[1];

    const places: GeocodedPlace[] = (data.features || []).map(
      (f: {
        place_name?: string;
        text?: string;
        center?: [number, number];
        geometry?: { coordinates: [number, number] };
      }) => {
        let label = f.place_name || f.text || parsed.data.query;
        // Si l'utilisateur a tapé un numéro et que le résultat ne le contient pas, on le préfixe
        if (
          houseNumber &&
          !label.trim().startsWith(houseNumber) &&
          /boulevard|avenue|rue|bd|av\.|all[eé]e|place|chemin/i.test(label)
        ) {
          label = `${houseNumber} ${label}`;
        }
        const coords = f.center ?? f.geometry?.coordinates;
        return {
          label,
          coord: {
            lng: coords?.[0] ?? 0,
            lat: coords?.[1] ?? 0,
          },
        };
      }
    ).filter((p: GeocodedPlace) => p.coord.lat !== 0 || p.coord.lng !== 0);

    return { places };
  } catch {
    return { places: [], error: "Impossible de contacter le service." };
  }
}

export async function planTrip(
  origin: Coord,
  destination: Coord
): Promise<{ itineraries: Itinerary[]; error?: string; warning?: string }> {
  const parsed = planTripSchema.safeParse({ origin, destination });
  if (!parsed.success) {
    return { itineraries: [], error: "Coordonnées invalides." };
  }

  const apiKey = process.env.OPENROUTESERVICE_KEY;
  if (!apiKey) {
    return { itineraries: [], error: "Configuration serveur manquante." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let acceptedModes: Mode[] = ["foot", "bike", "tram", "bus"];
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("accepted_modes, reduced_mobility")
      .eq("user_id", user.id)
      .single();
    if (profile) {
      acceptedModes = profile.accepted_modes as Mode[];
      if (profile.reduced_mobility) {
        acceptedModes = acceptedModes.filter((m) => m !== "bike" && m !== "scooter");
      }
    }
  }

  const wantsTransit =
    acceptedModes.includes("tram") || acceptedModes.includes("bus");

  const { stops: transitStops, lines: transitLines, errors: tbmErrors } =
    await TBMAdapter.fetchTransitData();

  const service = new TripService([new ORSAdapter(apiKey), new TBMAdapter()]);
  const itineraries = await service.computeItineraries({
    origin: parsed.data.origin,
    destination: parsed.data.destination,
    acceptedModes,
    transitStops,
    transitLines,
  });

  const hasTransitItinerary = itineraries.some((it) =>
    it.segments.some((s) => s.mode === "tram" || s.mode === "bus")
  );

  let warning: string | undefined;
  if (tbmErrors.length > 0) {
    warning = tbmErrors.join(" ");
  } else if (
    wantsTransit &&
    acceptedModes.includes("foot") &&
    !hasTransitItinerary &&
    transitStops.length > 0 &&
    transitLines.length > 0
  ) {
    warning =
      "Aucun trajet en transport en commun trouvé pour cet itinéraire (correspondance ou lignes non couvertes).";
  }

  if (itineraries.length === 0) {
    const tbmHint =
      tbmErrors.length > 0
        ? ` ${tbmErrors.join(" ")}`
        : "";
    return {
      itineraries: [],
      error: `Aucun itinéraire trouvé. Élargissez vos modes acceptés dans votre profil.${tbmHint}`,
    };
  }

  return { itineraries, warning };
}

export async function getTransitStops(): Promise<TransitStopDisplay[]> {
  const { data } = await TBMAdapter.fetchStops();
  // On ne renvoie au client que ce qui sert à l'affichage — le champ
  // `lines` ne sert qu'au calcul serveur (findBestTransitOption) et
  // alourdirait inutilement la réponse pour ~3900 arrêts (éco-conception, C5).
  return data.map(({ id, name, coord }) => ({ id, name, coord }));
}

export async function saveTrip(
  origin: GeocodedPlace,
  destination: GeocodedPlace,
  itinerary: Itinerary
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Vous devez être connecté pour sauvegarder un trajet." };
  }

  // Insérer le trajet parent
  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .insert({
      user_id: user.id,
      origin_label: origin.label,
      origin_geom: `POINT(${origin.coord.lng} ${origin.coord.lat})`,
      destination_label: destination.label,
      destination_geom: `POINT(${destination.coord.lng} ${destination.coord.lat})`,
      total_distance_m: itinerary.totalDistanceM,
      total_duration_s: itinerary.totalDurationS,
      total_co2_g: itinerary.totalCo2G,
    })
    .select("id")
    .single();

  if (tripError || !trip) {
    console.error("Erreur insertion trip:", tripError);
    return { error: "Impossible de sauvegarder le trajet." };
  }

  // Insérer les segments
  const segmentsToInsert = itinerary.segments.map((seg, idx) => ({
    trip_id: trip.id,
    segment_order: idx,
    mode: seg.mode,
    distance_m: seg.distanceM,
    duration_s: seg.durationS,
    co2_g: seg.co2G,
    geometry: `LINESTRING(${seg.geometry.coordinates
      .map(([lng, lat]) => `${lng} ${lat}`)
      .join(", ")})`,
  }));

  const { error: segmentsError } = await supabase
    .from("trip_segments")
    .insert(segmentsToInsert);

  if (segmentsError) {
    console.error("Erreur insertion segments:", segmentsError);
    return { error: "Le trajet a été partiellement sauvegardé." };
  }

  return { success: true };
}
