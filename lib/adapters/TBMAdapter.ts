import type { Coord, Mode, Segment, TransitLine, TransitStop } from "@/types/mobility";
import type { IRoutingProvider } from "./IRoutingProvider";
import { haversineDistance } from "@/lib/geo";

const TRAM_SPEED_KMH = 20;
const BUS_SPEED_KMH = 18;
const CO2_TRAM = 4;
const CO2_BUS = 95;
const TBM_API_KEY = "opendata-bordeaux-metropole-flux-gtfs-rt";
const TBM_BASE = "https://bdx.mecatran.com/utw/ws/siri/2.0/bordeaux";
const TRANSFER_PENALTY_M = 400;
const NEAR_STOP_LIMIT = 8;
const HUB_CANDIDATE_LIMIT = 25;

function readSiriText(field: unknown): string | undefined {
  if (!field) return undefined;
  if (typeof field === "string") return field;
  if (Array.isArray(field)) return readSiriText(field[0]);
  if (typeof field === "object" && "value" in field) {
    const value = (field as { value: unknown }).value;
    return typeof value === "string" ? value : undefined;
  }
  return undefined;
}

function readSiriLineRefs(lines: unknown): string[] {
  if (!lines) return [];
  if (Array.isArray(lines)) {
    return lines
      .map((item) => readSiriText(item))
      .filter((ref): ref is string => Boolean(ref));
  }
  if (typeof lines === "object" && lines !== null && "LineRef" in lines) {
    return readSiriLineRefs((lines as { LineRef: unknown }).LineRef);
  }
  return [];
}

function readSiriCoord(location: unknown): Coord | null {
  if (!location || typeof location !== "object") return null;
  const loc = location as {
    latitude?: number;
    longitude?: number;
    Latitude?: number;
    Longitude?: number;
  };
  const lat = loc.latitude ?? loc.Latitude;
  const lng = loc.longitude ?? loc.Longitude;
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  return { lat, lng };
}

export type FetchResult<T> = {
  data: T;
  error?: string;
};

export type TransitJourney =
  | {
      kind: "direct";
      originStop: TransitStop;
      destStop: TransitStop;
      line: TransitLine;
    }
  | {
      kind: "transfer";
      originStop: TransitStop;
      hubStop: TransitStop;
      destStop: TransitStop;
      line1: TransitLine;
      line2: TransitLine;
    };

export class TBMAdapter implements IRoutingProvider {
  readonly supportedModes = ["tram", "bus"] as const;

  async computeSegment(
    _from: Coord,
    _to: Coord,
    mode: Mode
  ): Promise<Segment | null> {
    if (mode !== "tram" && mode !== "bus") return null;
    return null;
  }

  static lineMode(line: TransitLine): "tram" | "bus" {
    // route_type est le champ standard GTFS (0 = tram/light rail, 3 = bus).
    // Fiable quand la donnée vient de l'import GTFS (cf. fetchTransitDataFromDb).
    if (line.routeType === 0) return "tram";
    if (line.routeType === 3) return "bus";
    // Fallback historique pour compatibilité avec les données SIRI live
    // (fetchTransitData), qui n'ont pas de routeType.
    return line.name.startsWith("Tram") ? "tram" : "bus";
  }

  static computeTransitSegment(
    originStop: TransitStop,
    destStop: TransitStop,
    line: TransitLine,
    mode: "tram" | "bus"
  ): Segment {
    const distanceM = Math.round(
      haversineDistance(originStop.coord, destStop.coord) * 1.3
    );
    const speed = mode === "tram" ? TRAM_SPEED_KMH : BUS_SPEED_KMH;
    const co2Factor = mode === "tram" ? CO2_TRAM : CO2_BUS;
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

  static findNearestStops(
    stops: TransitStop[],
    coord: Coord,
    limit = NEAR_STOP_LIMIT
  ): TransitStop[] {
    return [...stops]
      .map((stop) => ({ stop, dist: haversineDistance(coord, stop.coord) }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, limit)
      .map((x) => x.stop);
  }

  private static findLegToStop(
    fromCoord: Coord,
    toStop: TransitStop,
    stops: TransitStop[],
    lines: TransitLine[]
  ): { fromStop: TransitStop; line: TransitLine } | null {
    const nearFrom = this.findNearestStops(stops, fromCoord, NEAR_STOP_LIMIT);
    let best: { fromStop: TransitStop; line: TransitLine } | null = null;
    let bestScore = Infinity;

    for (const fromStop of nearFrom) {
      const commonRef = fromStop.lines.find((ref) => toStop.lines.includes(ref));
      if (!commonRef) continue;
      const line = lines.find((l) => l.ref === commonRef);
      if (!line) continue;

      const score = haversineDistance(fromCoord, fromStop.coord);
      if (score < bestScore) {
        bestScore = score;
        best = { fromStop, line };
      }
    }

    return best;
  }

  private static findLegFromStop(
    fromStop: TransitStop,
    toCoord: Coord,
    stops: TransitStop[],
    lines: TransitLine[]
  ): { toStop: TransitStop; line: TransitLine } | null {
    const nearTo = this.findNearestStops(stops, toCoord, NEAR_STOP_LIMIT);
    let best: { toStop: TransitStop; line: TransitLine } | null = null;
    let bestScore = Infinity;

    for (const toStop of nearTo) {
      if (toStop.id === fromStop.id) continue;
      const commonRef = fromStop.lines.find((ref) => toStop.lines.includes(ref));
      if (!commonRef) continue;
      const line = lines.find((l) => l.ref === commonRef);
      if (!line) continue;

      const score = haversineDistance(toCoord, toStop.coord);
      if (score < bestScore) {
        bestScore = score;
        best = { toStop, line };
      }
    }

    return best;
  }

  private static findDirectJourney(
    origin: Coord,
    destination: Coord,
    stops: TransitStop[],
    lines: TransitLine[]
  ): { journey: TransitJourney; score: number } | null {
    const nearOrigin = this.findNearestStops(stops, origin, NEAR_STOP_LIMIT);
    const nearDest = this.findNearestStops(stops, destination, NEAR_STOP_LIMIT);

    let best: { journey: TransitJourney; score: number } | null = null;

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

        if (!best || score < best.score) {
          best = {
            score,
            journey: {
              kind: "direct",
              originStop,
              destStop,
              line,
            },
          };
        }
      }
    }

    return best;
  }

  /**
   * Trajet TBM direct ou avec une correspondance (2 lignes).
   */
  static findBestTransitJourney(
    origin: Coord,
    destination: Coord,
    stops: TransitStop[],
    lines: TransitLine[]
  ): TransitJourney | null {
    let best = this.findDirectJourney(origin, destination, stops, lines);

    const mid: Coord = {
      lat: (origin.lat + destination.lat) / 2,
      lng: (origin.lng + destination.lng) / 2,
    };
    const hubCandidates = this.findNearestStops(stops, mid, HUB_CANDIDATE_LIMIT);

    for (const hub of hubCandidates) {
      const leg1 = this.findLegToStop(origin, hub, stops, lines);
      if (!leg1) continue;
      const leg2 = this.findLegFromStop(hub, destination, stops, lines);
      if (!leg2) continue;
      if (leg1.line.ref === leg2.line.ref) continue;

      const score =
        haversineDistance(origin, leg1.fromStop.coord) +
        haversineDistance(destination, leg2.toStop.coord) +
        TRANSFER_PENALTY_M;

      if (!best || score < best.score) {
        best = {
          score,
          journey: {
            kind: "transfer",
            originStop: leg1.fromStop,
            hubStop: hub,
            destStop: leg2.toStop,
            line1: leg1.line,
            line2: leg2.line,
          },
        };
      }
    }

    return best?.journey ?? null;
  }

  /** @deprecated Utiliser findBestTransitJourney */
  static findBestTransitOption(
    origin: Coord,
    destination: Coord,
    stops: TransitStop[],
    lines: TransitLine[]
  ) {
    const journey = this.findBestTransitJourney(origin, destination, stops, lines);
    if (!journey || journey.kind !== "direct") return null;
    return {
      originStop: journey.originStop,
      destStop: journey.destStop,
      line: journey.line,
    };
  }

  static async fetchTransitData(): Promise<{
    stops: TransitStop[];
    lines: TransitLine[];
    errors: string[];
  }> {
    const [stopsResult, linesResult] = await Promise.all([
      this.fetchStops(),
      this.fetchLines(),
    ]);
    const errors = [stopsResult.error, linesResult.error].filter(
      (e): e is string => Boolean(e)
    );
    return {
      stops: stopsResult.data,
      lines: linesResult.data,
      errors,
    };
  }

  static async fetchLines(): Promise<FetchResult<TransitLine[]>> {
    try {
      const url = `${TBM_BASE}/lines-discovery.json?AccountKey=${TBM_API_KEY}`;
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        next: { revalidate: 86400 },
      });
      if (!res.ok) {
        return {
          data: [],
          error: `Données TBM indisponibles (lignes, HTTP ${res.status}).`,
        };
      }
      const data = await res.json();
      const raw = data?.Siri?.LinesDelivery?.AnnotatedLineRef ?? [];
      const lines = raw
        .map(
          (l: {
            LineRef?: { value: string };
            LineCode?: { value: string };
            LineName?: { value: string }[] | { value: string };
          }): TransitLine | null => {
            const ref = l.LineRef?.value;
            const name = readSiriText(l.LineName);
            if (!ref || !name) return null;
            return {
              ref,
              code: readSiriText(l.LineCode) ?? "",
              name,
            };
          }
        )
        .filter((l: TransitLine | null): l is TransitLine => l !== null);

      if (lines.length === 0) {
        return { data: [], error: "Aucune ligne TBM reçue." };
      }
      return { data: lines };
    } catch (err) {
      console.error("TBM fetchLines failed:", err);
      return {
        data: [],
        error: "Impossible de contacter l'API TBM (lignes).",
      };
    }
  }

  static async fetchStops(): Promise<FetchResult<TransitStop[]>> {
    try {
      const url = `${TBM_BASE}/stoppoints-discovery.json?AccountKey=${TBM_API_KEY}`;
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        next: { revalidate: 86400 },
      });
      if (!res.ok) {
        return {
          data: [],
          error: `Données TBM indisponibles (arrêts, HTTP ${res.status}).`,
        };
      }
      const data = await res.json();
      const raw = data?.Siri?.StopPointsDelivery?.AnnotatedStopPointRef ?? [];
      const stops = raw
        .map(
          (s: {
            StopPointRef: { value: string };
            StopName?: { value: string }[] | { value: string };
            Location?: {
              longitude?: number;
              latitude?: number;
              Longitude?: number;
              Latitude?: number;
            };
            Lines?: { value: string }[] | { LineRef: { value: string }[] };
          }): TransitStop | null => {
            const coord = readSiriCoord(s.Location);
            if (!coord) return null;
            const lineRefs = readSiriLineRefs(s.Lines);
            if (lineRefs.length === 0) return null;
            return {
              id: s.StopPointRef.value,
              name: readSiriText(s.StopName) ?? "Arrêt",
              coord,
              lines: lineRefs,
            };
          }
        )
        .filter((s: TransitStop | null): s is TransitStop => s !== null);

      if (stops.length === 0) {
        return { data: [], error: "Aucun arrêt TBM reçu." };
      }
      return { data: stops };
    } catch (err) {
      console.error("TBM fetchStops failed:", err);
      return {
        data: [],
        error: "Impossible de contacter l'API TBM (arrêts).",
      };
    }
  }
}
