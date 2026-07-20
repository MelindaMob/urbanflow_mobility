"use client";

import type { Itinerary, Mode } from "@/types/mobility";

const MODE_META: Record<Mode, { icon: string; label: string; color: string }> = {
  foot: { icon: "🚶", label: "Marche", color: "text-mobility-green" },
  bike: { icon: "🚲", label: "Vélo", color: "text-mobility-green" },
  tram: { icon: "🚊", label: "Tram", color: "text-flow-blue" },
  bus: { icon: "🚌", label: "Bus", color: "text-flow-blue" },
  car: { icon: "🚗", label: "Voiture", color: "text-neutral-600" },
  scooter: { icon: "🛴", label: "Trottinette", color: "text-mobility-green" },
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
      className={`w-full text-left rounded-xl p-4 transition-all ${
        isSelected
          ? "bg-white border-2 border-mobility-green shadow-md"
          : "bg-white border border-neutral-200 hover:border-neutral-300 hover:shadow-sm"
      }`}
    >
      {isRecommended && (
        <div className="inline-flex items-center gap-1 bg-mobility-green text-white text-xs font-semibold px-2.5 py-1 rounded-full mb-3">
          <span>★</span>
          <span>Recommandé</span>
        </div>
      )}

      <div className="flex items-baseline justify-between mb-3">
        <div className="text-2xl font-bold">
          {formatDuration(itinerary.totalDurationS)}
        </div>
        <div className="text-xs text-neutral-500">
          {formatDistance(itinerary.totalDistanceM)}
        </div>
      </div>

      <div className="flex items-center flex-wrap gap-1.5 text-sm mb-3">
        {itinerary.segments.map((seg, idx) => {
          const meta = MODE_META[seg.mode];
          return (
            <span key={idx} className="flex items-center gap-1">
              <span title={meta.label} className="text-base">
                {meta.icon}
              </span>
              <span className={`text-xs font-medium ${meta.color}`}>
                {formatDuration(seg.durationS)}
                {seg.meta?.lineCode ? ` · ${seg.meta.lineCode}` : ""}
              </span>
              {idx < itinerary.segments.length - 1 && (
                <span className="text-neutral-300 mx-0.5">›</span>
              )}
            </span>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-mobility-green"></span>
          <span className="text-neutral-600 font-medium">
            {itinerary.totalCo2G === 0
              ? "0 CO₂"
              : `${formatCo2(itinerary.totalCo2G)} CO₂`}
          </span>
        </div>
        {itinerary.totalCo2G === 0 && (
          <span className="text-xs text-mobility-green font-semibold">
            100 % bas-carbone
          </span>
        )}
      </div>
    </button>
  );
}
