import type { Coord, Mode, Segment, TransitLine, TransitStop } from "@/types/mobility";
import type { IRoutingProvider } from "./IRoutingProvider";

const TRAM_SPEED_KMH = 20;
const CO2_TRAM = 4;

const TBM_API_KEY = "opendata-bordeaux-metropole-flux-gtfs-rt";
const TBM_BASE = "https://bdx.mecatran.com/utw/ws/siri/2.0/bordeaux";

function haversineDistance(a: Coord, b: Coord): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export class TBMAdapter implements IRoutingProvider {
  readonly supportedModes = ["tram", "bus"] as const;

  async computeSegment(
    from: Coord,
    to: Coord,
    mode: Mode
  ): Promise<Segment | null> {
    if (mode !== "tram" && mode !== "bus") return null;

    const distanceM = Math.round(haversineDistance(from, to) * 1.3);
    const durationS =
      Math.round((distanceM / 1000 / TRAM_SPEED_KMH) * 3600) + 120;
    const co2G = Math.round((distanceM / 1000) * CO2_TRAM);

    return {
      mode,
      distanceM,
      durationS,
      co2G,
      geometry: {
        type: "LineString",
        coordinates: [
          [from.lng, from.lat],
          [to.lng, to.lat],
        ],
      },
      meta: {
        lineCode: mode === "tram" ? "Tram" : "Bus",
        lineName: "Ligne TBM",
      },
    };
  }

  /**
   * Récupère toutes les lignes du réseau TBM via SIRI-Lite lines-discovery
   */
  static async fetchLines(): Promise<TransitLine[]> {
    try {
      const url = `${TBM_BASE}/lines-discovery.json?AccountKey=${TBM_API_KEY}`;
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        next: { revalidate: 86400 }, // cache 24h
      });
      if (!res.ok) return [];

      const data = await res.json();
      const raw = data?.Siri?.LinesDelivery?.AnnotatedLineRef ?? [];

      // Filtre : on ne garde que les tram (A/B/C/D/E/F) et les bus principaux (Lianes)
      return raw
        .filter((l: { LineName?: { value: string }[] }) => {
          const name = l.LineName?.[0]?.value ?? "";
          return name.startsWith("Tram ") || name.startsWith("Lianes ");
        })
        .map(
          (l: {
            LineRef: { value: string };
            LineCode?: { value: string };
            LineName: { value: string }[];
          }) => ({
            ref: l.LineRef.value,
            code: l.LineCode?.value ?? "",
            name: l.LineName[0].value,
          })
        );
    } catch (err) {
      console.error("TBM fetchLines failed:", err);
      return [];
    }
  }

  /**
   * Récupère tous les arrêts du réseau TBM via SIRI-Lite stoppoints-discovery
   */
  static async fetchStops(): Promise<TransitStop[]> {
    try {
      const url = `${TBM_BASE}/stoppoints-discovery.json?AccountKey=${TBM_API_KEY}`;
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        next: { revalidate: 86400 },
      });
      if (!res.ok) return [];

      const data = await res.json();
      const raw = data?.Siri?.StopPointsDelivery?.AnnotatedStopPointRef ?? [];

      return raw
        .map(
          (s: {
            StopPointRef: { value: string };
            StopName?: { value: string }[];
            Location?: { Longitude: number; Latitude: number };
            Lines?: { LineRef: { value: string }[] };
          }): TransitStop | null => {
            if (!s.Location) return null;
            return {
              id: s.StopPointRef.value,
              name: s.StopName?.[0]?.value ?? "Arrêt",
              coord: {
                lat: s.Location.Latitude,
                lng: s.Location.Longitude,
              },
              lines: (s.Lines?.LineRef ?? []).map((l) => l.value),
            };
          }
        )
        .filter((s: TransitStop | null): s is TransitStop => s !== null);
    } catch (err) {
      console.error("TBM fetchStops failed:", err);
      return [];
    }
  }
}
