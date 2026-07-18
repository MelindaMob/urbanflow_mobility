"use server";

import type { GeocodedPlace } from "@/types/mobility";

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
