import type { Coord, Mode, Segment, TransitLine, TransitStop } from "@/types/mobility";
import type { IRoutingProvider } from "./IRoutingProvider";
import { haversineDistance } from "@/lib/geo";

const TRAM_SPEED_KMH = 20;
const BUS_SPEED_KMH = 18;
const CO2_TRAM = 4;
const CO2_BUS = 95;
const TBM_API_KEY = "opendata-bordeaux-metropole-flux-gtfs-rt";
const TBM_BASE = "https://bdx.mecatran.com/utw/ws/siri/2.0/bordeaux";

export type TransitOption = {
  originStop: TransitStop;
  destStop: TransitStop;
  line: TransitLine;
};

export class TBMAdapter implements IRoutingProvider {
  readonly supportedModes = ["tram", "bus"] as const;

  // Conservé pour respecter l'interface IRoutingProvider, mais plus utilisé
  // en pratique : le vrai calcul passe par computeTransitSegment() ci-dessous,
  // qui a besoin des vrais arrêts/lignes (voir TripService).
  async computeSegment(
    _from: Coord,
    _to: Coord,
    mode: Mode
  ): Promise<Segment | null> {
    if (mode !== "tram" && mode !== "bus") return null;
    return null;
  }

  /**
   * Construit un segment de transport réel entre deux arrêts TBM,
   * sur une ligne identifiée.
   */
  static computeTransitSegment(
    originStop: TransitStop,
    destStop: TransitStop,
    line: TransitLine,
    mode: "tram" | "bus"
  ): Segment {
    const distanceM = Math.round(haversineDistance(originStop.coord, destStop.coord) * 1.3);
    const speed = mode === "tram" ? TRAM_SPEED_KMH : BUS_SPEED_KMH;
    const co2Factor = mode === "tram" ? CO2_TRAM : CO2_BUS;
    // + temps d'attente moyen à l'arrêt (3 min)
    const durationS = Math.round((distanceM / 1000 / speed) * 3600) + 180;
    const co2G = Math.round((distanceM / 1000) * co2Factor);

    return {
      mode,
      distanceM,
      durationS,
      co2G,
      geometry: {
        type: "LineString",
        coordinates: [
          [originStop.coord.lng, originStop.coord.lat],
          [destStop.coord.lng, destStop.coord.lat],
        ],
      },
      meta: {
        lineCode: line.code,
        lineName: line.name,
        fromStopName: originStop.name,
        toStopName: destStop.name,
      },
    };
  }

  /**
   * Trouve les N arrêts les plus proches d'un point.
   */
  static findNearestStops(
    stops: TransitStop[],
    coord: Coord,
    limit = 6
  ): TransitStop[] {
    return [...stops]
      .map((stop) => ({ stop, dist: haversineDistance(coord, stop.coord) }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, limit)
      .map((x) => x.stop);
  }

  /**
   * Cherche la meilleure combinaison arrêt de départ / arrêt d'arrivée / ligne
   * commune, parmi les arrêts proches de l'origine et de la destination.
   */
  static findBestTransitOption(
    origin: Coord,
    destination: Coord,
    stops: TransitStop[],
    lines: TransitLine[]
  ): TransitOption | null {
    const nearOrigin = this.findNearestStops(stops, origin, 6);
    const nearDest = this.findNearestStops(stops, destination, 6);

    let best: TransitOption | null = null;
    let bestScore = Infinity;

    for (const originStop of nearOrigin) {
      for (const destStop of nearDest) {
        if (originStop.id === destStop.id) continue;
        const commonRef = originStop.lines.find((ref) =>
          destStop.lines.includes(ref)
        );
        if (!commonRef) continue;
        const line = lines.find((l) => l.ref === commonRef);
        if (!line) continue;

        const score =
          haversineDistance(origin, originStop.coord) +
          haversineDistance(destination, destStop.coord);

        if (score < bestScore) {
          bestScore = score;
          best = { originStop, destStop, line };
        }
      }
    }

    return best;
  }

  static async fetchLines(): Promise<TransitLine[]> {
    try {
      const url = `${TBM_BASE}/lines-discovery.json?AccountKey=${TBM_API_KEY}`;
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        next: { revalidate: 86400 },
      });
      if (!res.ok) return [];
      const data = await res.json();
      const raw = data?.Siri?.LinesDelivery?.AnnotatedLineRef ?? [];
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
