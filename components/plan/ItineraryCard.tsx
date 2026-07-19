"use client";

import type { Itinerary, Mode } from "@/types/mobility";

const MODE_ICONS: Record<Mode, string> = {
  foot: "🚶",
  bike: "🚲",
  tram: "🚊",
  bus: "🚌",
  car: "🚗",
  scooter: "🛴",
};

const MODE_LABELS: Record<Mode, string> = {
  foot: "Marche",
  bike: "Vélo",
  tram: "Tram",
  bus: "Bus",
  car: "Voiture",
  scooter: "Trottinette",
};

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h} h ${m.toString().padStart(2, "0")}`;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatCo2(grams: number): string {
  if (grams < 1000) return `${grams} g`;
  return `${(grams / 1000).toFixed(2)} kg`;
}

type ItineraryCardProps = {
  itinerary: Itinerary;
  isSelected: boolean;
  onSelect: () => void;
  isRecommended?: boolean;
};

export default function ItineraryCard({
  itinerary,
  isSelected,
  onSelect,
  isRecommended,
}: ItineraryCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      className={`w-full text-left border rounded-lg p-4 transition ${
        isSelected
          ? "border-mobility-green bg-green-50 ring-2 ring-mobility-green"
          : "border-neutral-200 bg-white hover:border-neutral-300"
      }`}
    >
      {isRecommended && (
        <div className="inline-block bg-mobility-green text-white text-xs font-semibold px-2 py-0.5 rounded-full mb-2">
          ★ Recommandé
        </div>
      )}

      {/* Suite des modes */}
      <div className="flex items-center flex-wrap gap-1 text-sm mb-2">
        {itinerary.segments.map((seg, idx) => (
          <span key={idx} className="flex items-center gap-1">
            <span title={MODE_LABELS[seg.mode]}>{MODE_ICONS[seg.mode]}</span>
            <span className="text-neutral-600">
              {formatDuration(seg.durationS)}
              {seg.meta?.lineCode ? ` · ${seg.meta.lineCode}` : ""}
            </span>
            {idx < itinerary.segments.length - 1 && (
              <span className="text-neutral-400 mx-0.5">→</span>
            )}
          </span>
        ))}
      </div>

      {/* Totaux */}
      <div className="flex items-center justify-between text-sm">
        <div className="font-semibold">
          {formatDuration(itinerary.totalDurationS)}
        </div>
        <div className="flex items-center gap-3 text-neutral-500 text-xs">
          <span>{formatDistance(itinerary.totalDistanceM)}</span>
          <span className="text-mobility-green font-medium">
            {itinerary.totalCo2G === 0
              ? "0 CO₂"
              : `${formatCo2(itinerary.totalCo2G)} CO₂`}
          </span>
        </div>
      </div>
    </button>
  );
}
