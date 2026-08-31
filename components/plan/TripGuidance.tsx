"use client";

import { useEffect, useRef, useState } from "react";
import type { Coord, Itinerary, Mode } from "@/types/mobility";
import { haversineDistance } from "@/lib/geo";

const MODE_LABEL: Record<Mode, string> = {
  foot: "Marchez",
  bike: "Roulez à vélo",
  tram: "Prenez le tram",
  bus: "Prenez le bus",
  car: "Roulez",
  scooter: "Roulez en trottinette",
};

const ARRIVAL_THRESHOLD_M = 35;
const DESTINATION_THRESHOLD_M = 40;

type TripGuidanceProps = {
  itinerary: Itinerary;
  onPositionUpdate: (coord: Coord) => void;
  onExit: () => void;
  onArrived: () => void;
};

export default function TripGuidance({
  itinerary,
  onPositionUpdate,
  onExit,
  onArrived,
}: TripGuidanceProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [remainingM, setRemainingM] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const onPositionUpdateRef = useRef(onPositionUpdate);
  const onArrivedRef = useRef(onArrived);

  onPositionUpdateRef.current = onPositionUpdate;
  onArrivedRef.current = onArrived;

  const currentSegment = itinerary.segments[stepIndex];
  const isLastStep = stepIndex === itinerary.segments.length - 1;

  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError("La géolocalisation n'est pas disponible sur cet appareil.");
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const coord: Coord = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setGpsError(null);
        onPositionUpdateRef.current(coord);

        setStepIndex((currentIdx) => {
          const segment = itinerary.segments[currentIdx];
          if (!segment) return currentIdx;
          const coords = segment.geometry.coordinates;
          const end = coords[coords.length - 1];
          const endCoord: Coord = { lng: end[0], lat: end[1] };
          const dist = haversineDistance(coord, endCoord);
          setRemainingM(Math.round(dist));

          const isFinal = currentIdx === itinerary.segments.length - 1;
          const threshold = isFinal ? DESTINATION_THRESHOLD_M : ARRIVAL_THRESHOLD_M;

          if (dist <= threshold) {
            if (isFinal) {
              onArrivedRef.current();
              return currentIdx;
            }
            return currentIdx + 1;
          }
          return currentIdx;
        });
      },
      (error) => {
        setGpsError(
          error.code === error.PERMISSION_DENIED
            ? "Autorisez la géolocalisation pour suivre votre trajet en direct."
            : "Signal GPS momentanément indisponible."
        );
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [itinerary]);

  if (!currentSegment) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 bg-white border-t border-neutral-200 rounded-t-2xl shadow-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
          Étape {stepIndex + 1} / {itinerary.segments.length}
        </span>
        <button
          type="button"
          onClick={onExit}
          className="text-xs text-neutral-400 hover:text-neutral-600"
        >
          Quitter le guidage
        </button>
      </div>

      <p className="text-lg font-semibold mb-1">
        {MODE_LABEL[currentSegment.mode]}
        {currentSegment.meta?.lineCode ? ` — ${currentSegment.meta.lineCode}` : ""}
      </p>

      {currentSegment.meta?.fromStopName && (
        <p className="text-sm text-neutral-500 mb-2">
          {currentSegment.meta.fromStopName} → {currentSegment.meta.toStopName}
        </p>
      )}

      <p className="text-sm text-neutral-600">
        {remainingM !== null
          ? `${remainingM >= 1000 ? (remainingM / 1000).toFixed(1) + " km" : remainingM + " m"} restants sur cette étape`
          : "Localisation en cours..."}
      </p>

      {gpsError && (
        <p
          role="alert"
          className="mt-2 text-xs text-action-orange bg-orange-50 p-2 rounded"
        >
          {gpsError}
        </p>
      )}

      {isLastStep && (
        <p className="mt-2 text-xs text-neutral-400">
          Dernière étape — arrivée à destination.
        </p>
      )}
    </div>
  );
}
