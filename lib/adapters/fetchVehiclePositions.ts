import { transit_realtime } from "gtfs-realtime-bindings";

const VEHICLE_POSITIONS_URL =
  "https://bdx.mecatran.com/utw/ws/gtfsfeed/vehicles/bordeaux?apiKey=opendata-bordeaux-metropole-flux-gtfs-rt";

export type VehiclePosition = {
  id: string;
  lat: number;
  lng: number;
  bearing?: number;
  routeId?: string;
  label?: string;
};

export async function fetchVehiclePositions(): Promise<VehiclePosition[]> {
  const res = await fetch(VEHICLE_POSITIONS_URL, {
    headers: { Accept: "application/x-protobuf" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`GTFS-RT VehiclePositions indisponible (HTTP ${res.status}).`);
  }

  const buffer = new Uint8Array(await res.arrayBuffer());
  const feed = transit_realtime.FeedMessage.decode(buffer);
  const positions: VehiclePosition[] = [];

  for (const entity of feed.entity) {
    const vehicle = entity.vehicle;
    const lat = vehicle?.position?.latitude;
    const lng = vehicle?.position?.longitude;
    if (typeof lat !== "number" || typeof lng !== "number") continue;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    const bearing = vehicle?.position?.bearing;
    positions.push({
      id: vehicle?.vehicle?.id || entity.id,
      lat,
      lng,
      bearing: typeof bearing === "number" ? bearing : undefined,
      routeId: vehicle?.trip?.routeId || undefined,
      label: vehicle?.vehicle?.label || undefined,
    });
  }

  return positions;
}
