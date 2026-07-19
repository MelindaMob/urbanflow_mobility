"use server";

import { createClient } from "@/lib/supabase/server";

export type CarbonStats = {
  totalTripsCount: number;
  totalCo2G: number;
  totalDistanceKm: number;
  byMode: {
    mode: string;
    co2G: number;
    distanceKm: number;
    tripCount: number;
  }[];
  co2VsCar: number; // % de gain par rapport à si tout avait été en voiture
  last30DaysCo2: number;
};

const CO2_CAR = 200; // g/km

export async function getCarbonStats(): Promise<CarbonStats | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Tous les trajets de l'utilisateur
  const { data: trips } = await supabase
    .from("trips")
    .select("total_co2_g, total_distance_m, created_at");

  if (!trips) return null;

  // Segments par mode (agrégation)
  const { data: segments } = await supabase
    .from("trip_segments")
    .select("mode, co2_g, distance_m, trip_id");

  const totalCo2G = trips.reduce((s, t) => s + t.total_co2_g, 0);
  const totalDistanceKm =
    trips.reduce((s, t) => s + t.total_distance_m, 0) / 1000;

  // Agrégation par mode
  const byModeMap = new Map<
    string,
    { co2G: number; distanceKm: number; trips: Set<string> }
  >();
  (segments ?? []).forEach((seg) => {
    if (!byModeMap.has(seg.mode)) {
      byModeMap.set(seg.mode, { co2G: 0, distanceKm: 0, trips: new Set() });
    }
    const bucket = byModeMap.get(seg.mode)!;
    bucket.co2G += seg.co2_g;
    bucket.distanceKm += seg.distance_m / 1000;
    bucket.trips.add(seg.trip_id);
  });

  const byMode = Array.from(byModeMap.entries())
    .map(([mode, data]) => ({
      mode,
      co2G: Math.round(data.co2G),
      distanceKm: Math.round(data.distanceKm * 10) / 10,
      tripCount: data.trips.size,
    }))
    .sort((a, b) => b.distanceKm - a.distanceKm);

  // Comparaison vs 100% voiture
  const co2IfAllCar = totalDistanceKm * CO2_CAR;
  const co2VsCar =
    co2IfAllCar === 0
      ? 0
      : Math.round(((co2IfAllCar - totalCo2G) / co2IfAllCar) * 100);

  // CO2 des 30 derniers jours
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const last30DaysCo2 = trips
    .filter((t) => new Date(t.created_at) >= thirtyDaysAgo)
    .reduce((s, t) => s + t.total_co2_g, 0);

  return {
    totalTripsCount: trips.length,
    totalCo2G: Math.round(totalCo2G),
    totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
    byMode,
    co2VsCar,
    last30DaysCo2: Math.round(last30DaysCo2),
  };
}
