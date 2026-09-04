"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, { Map as MapLibreMap, Marker, Popup } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Coord, Itinerary, Mode, TransitStopDisplay } from "@/types/mobility";

const BORDEAUX_CENTER: [number, number] = [-0.5709, 44.841];
const DEFAULT_ZOOM = 12;

type BikeStationMarker = {
  stationId: string;
  name: string;
  lat: number;
  lng: number;
  bikesAvailable: number;
  docksAvailable: number;
  isRenting: boolean;
};

const MODE_COLORS: Record<Mode, string> = {
  foot: "#059669",
  bike: "#059669",
  tram: "#0284C7",
  bus: "#0284C7",
  car: "#6B7280",
  scooter: "#059669",
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function makeSquareIcon(fill: string): ImageData {
  const size = 16;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return new ImageData(size, size);
  }
  ctx.fillStyle = fill;
  ctx.fillRect(1, 1, size - 2, size - 2);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, size - 2, size - 2);
  return ctx.getImageData(0, 0, size, size);
}

function ensureBikeStationIcons(map: MapLibreMap) {
  if (!map.hasImage("bike-station")) {
    map.addImage("bike-station", makeSquareIcon("#059669"));
  }
  if (!map.hasImage("bike-station-closed")) {
    map.addImage("bike-station-closed", makeSquareIcon("#9CA3AF"));
  }
}

function parseBikeStations(raw: unknown): BikeStationMarker[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const s = item as {
      stationId?: unknown;
      name?: unknown;
      lat?: unknown;
      lng?: unknown;
      bikesAvailable?: unknown;
      docksAvailable?: unknown;
      isRenting?: unknown;
    };
    if (
      typeof s.stationId !== "string" ||
      typeof s.name !== "string" ||
      typeof s.lat !== "number" ||
      typeof s.lng !== "number" ||
      !Number.isFinite(s.lat) ||
      !Number.isFinite(s.lng)
    ) {
      return [];
    }
    return [
      {
        stationId: s.stationId,
        name: s.name,
        lat: s.lat,
        lng: s.lng,
        bikesAvailable:
          typeof s.bikesAvailable === "number" ? s.bikesAvailable : 0,
        docksAvailable:
          typeof s.docksAvailable === "number" ? s.docksAvailable : 0,
        isRenting: Boolean(s.isRenting),
      },
    ];
  });
}

type MapViewProps = {
  origin?: Coord | null;
  destination?: Coord | null;
  userLocation?: Coord | null;
  itinerary?: Itinerary | null;
  transitStops?: TransitStopDisplay[];
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
  const [vehicles, setVehicles] = useState<
    { id: string; lat: number; lng: number }[]
  >([]);
  const [bikeStations, setBikeStations] = useState<BikeStationMarker[]>([]);
  const bikePopupRef = useRef<Popup | null>(null);

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

  // Positions véhicules TBM (GTFS-RT), rafraîchies toutes les 12 s
  useEffect(() => {
    let cancelled = false;

    const loadVehicles = async () => {
      try {
        const res = await fetch("/api/vehicle-positions");
        const data = (await res.json()) as {
          positions?: unknown;
        };
        if (cancelled) return;
        if (!res.ok || !Array.isArray(data.positions)) {
          setVehicles([]);
          return;
        }
        const next = data.positions.flatMap((item) => {
          if (!item || typeof item !== "object") return [];
          const p = item as { id?: unknown; lat?: unknown; lng?: unknown };
          if (
            typeof p.id !== "string" ||
            typeof p.lat !== "number" ||
            typeof p.lng !== "number" ||
            !Number.isFinite(p.lat) ||
            !Number.isFinite(p.lng)
          ) {
            return [];
          }
          return [{ id: p.id, lat: p.lat, lng: p.lng }];
        });
        setVehicles(next);
      } catch {
        if (!cancelled) setVehicles([]);
      }
    };

    loadVehicles();
    const intervalId = setInterval(loadVehicles, 12_000);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  // Affichage des véhicules TBM
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const sourceId = "tbm-vehicles";
    const layerId = "tbm-vehicles-layer";

    const collection = {
      type: "FeatureCollection" as const,
      features: vehicles.map((vehicle) => ({
        type: "Feature" as const,
        properties: { id: vehicle.id },
        geometry: {
          type: "Point" as const,
          coordinates: [vehicle.lng, vehicle.lat],
        },
      })),
    };

    const existing = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;
    if (existing) {
      existing.setData(collection);
      return;
    }

    map.addSource(sourceId, {
      type: "geojson",
      data: collection,
    });

    map.addLayer({
      id: layerId,
      type: "circle",
      source: sourceId,
      minzoom: 11,
      paint: {
        "circle-radius": 8,
        "circle-color": "#EA580C",
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 1.5,
        "circle-opacity": 0.9,
      },
    });
  }, [vehicles, mapReady]);

  // Stations Le Vélo (GBFS), rafraîchies toutes les 60 s
  useEffect(() => {
    let cancelled = false;

    const loadStations = async () => {
      try {
        const res = await fetch("/api/bike-stations");
        const data = (await res.json()) as { stations?: unknown };
        if (cancelled) return;
        if (!res.ok || !Array.isArray(data.stations)) {
          setBikeStations([]);
          return;
        }
        setBikeStations(parseBikeStations(data.stations));
      } catch {
        if (!cancelled) setBikeStations([]);
      }
    };

    loadStations();
    const intervalId = setInterval(loadStations, 60_000);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  // Affichage des stations vélos
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const sourceId = "bike-stations";
    const layerId = "bike-stations-layer";

    const collection = {
      type: "FeatureCollection" as const,
      features: bikeStations.map((station) => ({
        type: "Feature" as const,
        properties: {
          name: station.name,
          bikesAvailable: station.bikesAvailable,
          docksAvailable: station.docksAvailable,
          isRenting: station.isRenting ? 1 : 0,
        },
        geometry: {
          type: "Point" as const,
          coordinates: [station.lng, station.lat],
        },
      })),
    };

    const existing = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;
    if (existing) {
      existing.setData(collection);
    } else {
      ensureBikeStationIcons(map);
      map.addSource(sourceId, {
        type: "geojson",
        data: collection,
      });
      map.addLayer({
        id: layerId,
        type: "symbol",
        source: sourceId,
        minzoom: 11,
        layout: {
          "icon-image": [
            "case",
            ["==", ["get", "isRenting"], 1],
            "bike-station",
            "bike-station-closed",
          ],
          "icon-size": 1,
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
        },
      });
    }

    const showPopup = (e: maplibregl.MapLayerMouseEvent) => {
      const feature = e.features?.[0];
      if (!feature || feature.geometry.type !== "Point") return;
      const coords = feature.geometry.coordinates as [number, number];
      const name = escapeHtml(String(feature.properties?.name ?? "Station"));
      const bikes = Number(feature.properties?.bikesAvailable ?? 0);
      const docks = Number(feature.properties?.docksAvailable ?? 0);
      const renting = Number(feature.properties?.isRenting ?? 0) === 1;

      bikePopupRef.current?.remove();
      bikePopupRef.current = new maplibregl.Popup({
        closeButton: true,
        closeOnClick: true,
        offset: 10,
      })
        .setLngLat(coords)
        .setHTML(
          `<div style="font:12px/1.4 system-ui,sans-serif;min-width:140px">
            <p style="font-weight:600;margin:0 0 4px">${name}</p>
            <p style="margin:0">Vélos disponibles : ${bikes}</p>
            <p style="margin:0">Bornes libres : ${docks}</p>
            ${renting ? "" : `<p style="margin:4px 0 0;color:#6B7280">Location indisponible</p>`}
          </div>`
        )
        .addTo(map);
    };

    const onEnter = (e: maplibregl.MapLayerMouseEvent) => {
      map.getCanvas().style.cursor = "pointer";
      showPopup(e);
    };
    const onLeave = () => {
      map.getCanvas().style.cursor = "";
    };

    map.on("click", layerId, showPopup);
    map.on("mouseenter", layerId, onEnter);
    map.on("mouseleave", layerId, onLeave);

    return () => {
      if (map.getLayer(layerId)) {
        map.off("click", layerId, showPopup);
        map.off("mouseenter", layerId, onEnter);
        map.off("mouseleave", layerId, onLeave);
      }
      map.getCanvas().style.cursor = "";
      bikePopupRef.current?.remove();
      bikePopupRef.current = null;
    };
  }, [bikeStations, mapReady]);

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
