"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, { Map as MapLibreMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Coord, Itinerary, Mode, TransitStop } from "@/types/mobility";

const BORDEAUX_CENTER: [number, number] = [-0.5709, 44.841];
const DEFAULT_ZOOM = 12;

const MODE_COLORS: Record<Mode, string> = {
  foot: "#059669",
  bike: "#059669",
  tram: "#0284C7",
  bus: "#0284C7",
  car: "#6B7280",
  scooter: "#059669",
};

type MapViewProps = {
  origin?: Coord | null;
  destination?: Coord | null;
  userLocation?: Coord | null;
  itinerary?: Itinerary | null;
  transitStops?: TransitStop[];
};

export default function MapView({
  origin,
  destination,
  userLocation,
  itinerary,
  transitStops,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const originMarkerRef = useRef<Marker | null>(null);
  const destinationMarkerRef = useRef<Marker | null>(null);
  const userMarkerRef = useRef<Marker | null>(null);
  const routeSourceIdsRef = useRef<string[]>([]);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const apiKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
    if (!apiKey) return;

    const container = containerRef.current;

    const map = new maplibregl.Map({
      container,
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${apiKey}`,
      center: BORDEAUX_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: { compact: true },
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
      }),
      "top-right"
    );

    const resizeMap = () => {
      map.resize();
    };

    // Recalcule dès que le conteneur change de taille (fix Flexbox)
    const resizeObserver = new ResizeObserver(() => {
      resizeMap();
    });
    resizeObserver.observe(container);

    map.on("load", () => {
      resizeMap();
      // Petit délai pour laisser le layout flex se stabiliser
      requestAnimationFrame(() => {
        resizeMap();
        setMapReady(true);
      });
    });

    window.addEventListener("resize", resizeMap);

    mapRef.current = map;

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", resizeMap);
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  // Marqueur origine — uniquement quand la carte est prête
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    if (originMarkerRef.current) {
      originMarkerRef.current.remove();
      originMarkerRef.current = null;
    }

    if (origin) {
      originMarkerRef.current = new maplibregl.Marker({ color: "#059669" })
        .setLngLat([origin.lng, origin.lat])
        .addTo(map);
    }
  }, [origin, mapReady]);

  // Marqueur destination
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.remove();
      destinationMarkerRef.current = null;
    }

    if (destination) {
      destinationMarkerRef.current = new maplibregl.Marker({ color: "#EA580C" })
        .setLngLat([destination.lng, destination.lat])
        .addTo(map);
    }
  }, [destination, mapReady]);

  // Marqueur utilisateur
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userLocation) {
      const el = document.createElement("div");
      el.style.cssText =
        "width:16px;height:16px;border-radius:50%;background:#0284C7;border:3px solid white;box-shadow:0 0 0 4px rgba(2,132,199,0.25)";
      userMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map);
    }
  }, [userLocation, mapReady]);

  // Affichage des arrêts TBM
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !transitStops || transitStops.length === 0) return;

    const sourceId = "tbm-stops";
    const layerId = "tbm-stops-layer";

    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);

    map.addSource(sourceId, {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: transitStops.map((stop) => ({
          type: "Feature",
          properties: { name: stop.name },
          geometry: {
            type: "Point",
            coordinates: [stop.coord.lng, stop.coord.lat],
          },
        })),
      },
    });

    map.addLayer({
      id: layerId,
      type: "circle",
      source: sourceId,
      minzoom: 12,
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 12, 2, 16, 6],
        "circle-color": "#0284C7",
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 1.5,
        "circle-opacity": 0.8,
      },
    });
  }, [transitStops, mapReady]);

  // Tracé de l'itinéraire
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    map.resize();

    routeSourceIdsRef.current.forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
    });
    routeSourceIdsRef.current = [];

    if (!itinerary) return;

    itinerary.segments.forEach((segment, idx) => {
      const id = `route-segment-${idx}`;
      map.addSource(id, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: segment.geometry,
        },
      });
      map.addLayer({
        id,
        type: "line",
        source: id,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": MODE_COLORS[segment.mode],
          "line-width": 5,
          "line-opacity": 0.85,
          "line-dasharray":
            segment.mode === "foot" || segment.mode === "bike"
              ? [2, 1.5]
              : [1, 0],
        },
      });
      routeSourceIdsRef.current.push(id);
    });

    const bounds = new maplibregl.LngLatBounds();
    itinerary.segments.forEach((seg) => {
      seg.geometry.coordinates.forEach((c) =>
        bounds.extend(c as [number, number])
      );
    });
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, {
        padding: { top: 80, bottom: 80, left: 80, right: 80 },
        maxZoom: 15,
      });
    }
  }, [itinerary, mapReady]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full"
      role="region"
      aria-label="Carte interactive de l'itinéraire"
    />
  );
}
