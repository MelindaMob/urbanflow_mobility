"use client";

import { useEffect, useRef } from "react";
import maplibregl, { Map as MapLibreMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Coord } from "@/types/mobility";

// Centre de Bordeaux (Place de la Bourse)
const BORDEAUX_CENTER: [number, number] = [-0.5709, 44.841];
const DEFAULT_ZOOM = 12;

type MapViewProps = {
  origin?: Coord | null;
  destination?: Coord | null;
  userLocation?: Coord | null;
};

export default function MapView({
  origin,
  destination,
  userLocation,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const originMarkerRef = useRef<Marker | null>(null);
  const destinationMarkerRef = useRef<Marker | null>(null);
  const userMarkerRef = useRef<Marker | null>(null);

  // Initialisation de la carte (une seule fois)
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const apiKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
    if (!apiKey) {
      console.error("NEXT_PUBLIC_MAPTILER_KEY manquant");
      return;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${apiKey}`,
      center: BORDEAUX_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: { compact: true },
    });

    // Contrôle de navigation (zoom in/out, boussole)
    map.addControl(new maplibregl.NavigationControl(), "top-right");

    // Contrôle de géolocalisation natif
    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: false,
      }),
      "top-right"
    );

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Marqueur origine (vert)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (originMarkerRef.current) {
      originMarkerRef.current.remove();
      originMarkerRef.current = null;
    }

    if (origin) {
      originMarkerRef.current = new maplibregl.Marker({
        color: "#059669", // mobility-green
      })
        .setLngLat([origin.lng, origin.lat])
        .addTo(map);
    }
  }, [origin]);

  // Marqueur destination (orange)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.remove();
      destinationMarkerRef.current = null;
    }

    if (destination) {
      destinationMarkerRef.current = new maplibregl.Marker({
        color: "#EA580C", // action-orange
      })
        .setLngLat([destination.lng, destination.lat])
        .addTo(map);
    }
  }, [destination]);

  // Marqueur position utilisateur (bleu)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userLocation) {
      // Marqueur custom rond bleu
      const el = document.createElement("div");
      el.style.width = "16px";
      el.style.height = "16px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor = "#0284C7"; // flow-blue
      el.style.border = "3px solid white";
      el.style.boxShadow = "0 0 0 4px rgba(2, 132, 199, 0.25)";

      userMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map);
    }
  }, [userLocation]);

  // Auto-centrage sur origine + destination si les deux sont définies
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !origin || !destination) return;

    const bounds = new maplibregl.LngLatBounds()
      .extend([origin.lng, origin.lat])
      .extend([destination.lng, destination.lat]);

    map.fitBounds(bounds, {
      padding: { top: 80, bottom: 80, left: 80, right: 80 },
      maxZoom: 15,
    });
  }, [origin, destination]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      role="region"
      aria-label="Carte interactive"
    />
  );
}
