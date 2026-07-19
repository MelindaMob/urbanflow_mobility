"use server";

import type {
  Coord,
  GeocodedPlace,
  Itinerary,
  Mode,
  TransitStop,
} from "@/types/mobility";
import { ORSAdapter } from "@/lib/adapters/ORSAdapter";
import { TBMAdapter } from "@/lib/adapters/TBMAdapter";
import { TripService } from "@/lib/services/TripService";
import { createClient } from "@/lib/supabase/server";

// Bounding box de Bordeaux Métropole (rectangle géographique)
// Format : [minLng, minLat, maxLng, maxLat]
const BORDEAUX_BBOX = [-0.75, 44.75, -0.42, 44.98];

export async function geocodeAddress(
  query: string
): Promise<{ places: GeocodedPlace[]; error?: string }> {
  if (!query || query.trim().length < 3) {
    return { places: [] };
  }

  const apiKey = process.env.OPENROUTESERVICE_KEY;
  if (!apiKey) {
    return { places: [], error: "Configuration serveur manquante." };
  }

  try {
    const url = new URL(
      "https://api.openrouteservice.org/geocode/autocomplete"
    );
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("text", query);
    url.searchParams.set("boundary.rect.min_lon", BORDEAUX_BBOX[0].toString());
    url.searchParams.set("boundary.rect.min_lat", BORDEAUX_BBOX[1].toString());
    url.searchParams.set("boundary.rect.max_lon", BORDEAUX_BBOX[2].toString());
    url.searchParams.set("boundary.rect.max_lat", BORDEAUX_BBOX[3].toString());
    url.searchParams.set("size", "5"); // 5 suggestions max

    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return { places: [], error: "Erreur du service de géocodage." };
    }

    const data = await response.json();

    // Le format ORS retourne des "features" GeoJSON
    const places: GeocodedPlace[] = (data.features || []).map(
      (f: {
        properties: { label: string };
        geometry: { coordinates: [number, number] };
      }) => ({
        label: f.properties.label,
        coord: {
          lng: f.geometry.coordinates[0],
          lat: f.geometry.coordinates[1],
        },
      })
    );

    return { places };
  } catch {
    return { places: [], error: "Impossible de contacter le service." };
  }
}

export async function planTrip(
  origin: Coord,
  destination: Coord
): Promise<{ itineraries: Itinerary[]; error?: string }> {
  const apiKey = process.env.OPENROUTESERVICE_KEY;
  if (!apiKey) {
    return { itineraries: [], error: "Configuration serveur manquante." };
  }

  // Récupérer les préférences du user connecté
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
      // RG-05 : mobilité réduite exclut vélo et trottinette
      if (profile.reduced_mobility) {
        acceptedModes = acceptedModes.filter(
          (m) => m !== "bike" && m !== "scooter"
        );
      }
    }
  }

  // Composition des services
  const service = new TripService([new ORSAdapter(apiKey), new TBMAdapter()]);
  const itineraries = await service.computeItineraries({
    origin,
    destination,
    acceptedModes,
  });

  if (itineraries.length === 0) {
    return {
      itineraries: [],
      error:
        "Aucun itinéraire trouvé. Élargissez vos modes acceptés dans votre profil.",
    };
  }

  return { itineraries };
}

export async function getTransitStops(): Promise<TransitStop[]> {
  return TBMAdapter.fetchStops();
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
