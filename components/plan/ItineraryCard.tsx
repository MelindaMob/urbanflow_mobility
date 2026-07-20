"use client";

import type { Itinerary, Mode } from "@/types/mobility";

const MODE_META: Record<Mode, { label: string; color: string; dot: string }> = {
  foot: { label: "Marche", color: "text-mobility-green", dot: "bg-mobility-green" },
  bike: { label: "Vélo", color: "text-mobility-green", dot: "bg-mobility-green" },
  tram: { label: "Tram", color: "text-flow-blue", dot: "bg-flow-blue" },
  bus: { label: "Bus", color: "text-flow-blue", dot: "bg-flow-blue" },
  car: { label: "Voiture", color: "text-neutral-600", dot: "bg-neutral-500" },
  scooter: { label: "Trott.", color: "text-mobility-green", dot: "bg-mobility-green" },
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
      className={`w-full text-left rounded-xl p-4 transition-all group ${
        isSelected
          ? "bg-white border-2 border-anthracite shadow-sm"
          : "bg-white border border-neutral-200 hover:border-neutral-300"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold tracking-tight">
              {formatDuration(itinerary.totalDurationS)}
            </div>
            <div className="text-xs text-neutral-400 tabular-nums">
              · {formatDistance(itinerary.totalDistanceM)}
            </div>
          </div>
        </div>
        {isRecommended && (
          <div className="inline-flex items-center gap-1 border border-mobility-green text-mobility-green text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded">
            Optimal
          </div>
        )}
      </div>

      <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs mb-3">
        {itinerary.segments.map((seg, idx) => {
          const meta = MODE_META[seg.mode];
          return (
            <span key={idx} className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
              <span className={`font-medium ${meta.color}`}>{meta.label}</span>
              <span className="text-neutral-500 tabular-nums">
                {formatDuration(seg.durationS)}
              </span>
              {idx < itinerary.segments.length - 1 && (
                <span className="text-neutral-300 ml-1">/</span>
              )}
            </span>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
        <div className="text-xs text-neutral-500">
          <span className="tabular-nums">
            {itinerary.totalCo2G === 0 ? "0" : formatCo2(itinerary.totalCo2G)}
          </span>
          <span className="ml-1">CO₂</span>
        </div>
        {itinerary.totalCo2G === 0 && (
          <span className="text-[10px] uppercase tracking-wider text-mobility-green font-semibold">
            Bas carbone
          </span>
        )}
      </div>
    </button>
  );
}
