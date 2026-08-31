import type { Coord, Itinerary, Segment, Mode, TransitStop, TransitLine } from "@/types/mobility";
import type { IRoutingProvider } from "@/lib/adapters/IRoutingProvider";
import { TBMAdapter } from "@/lib/adapters/TBMAdapter";

export type ComputeItinerariesInput = {
  origin: Coord;
  destination: Coord;
  acceptedModes: Mode[];
  transitStops: TransitStop[];
  transitLines: TransitLine[];
};

export class TripService {
  private providers: IRoutingProvider[];

  constructor(providers: IRoutingProvider[]) {
    this.providers = providers;
  }

  async computeItineraries(input: ComputeItinerariesInput): Promise<Itinerary[]> {
    const { origin, destination, acceptedModes, transitStops, transitLines } = input;
    const itineraries: Itinerary[] = [];

    if (acceptedModes.includes("foot")) {
      const seg = await this.compute(origin, destination, "foot");
      if (seg) itineraries.push(this.wrap("foot-only", [seg]));
    }

    if (acceptedModes.includes("bike")) {
      const seg = await this.compute(origin, destination, "bike");
      if (seg) itineraries.push(this.wrap("bike-only", [seg]));
    }

    if (
      (acceptedModes.includes("tram") || acceptedModes.includes("bus")) &&
      acceptedModes.includes("foot") &&
      transitStops.length > 0 &&
      transitLines.length > 0
    ) {
      const option = TBMAdapter.findBestTransitOption(
        origin,
        destination,
        transitStops,
        transitLines
      );

      if (option) {
        const mode: "tram" | "bus" = option.line.name.startsWith("Tram") ? "tram" : "bus";

        const [walkStart, walkEnd] = await Promise.all([
          this.compute(origin, option.originStop.coord, "foot"),
          this.compute(option.destStop.coord, destination, "foot"),
        ]);

        const transitSeg = TBMAdapter.computeTransitSegment(
          option.originStop,
          option.destStop,
          option.line,
          mode
        );

        if (walkStart && walkEnd) {
          itineraries.push(
            this.wrap(`multimodal-${mode}`, [walkStart, transitSeg, walkEnd])
          );
        }
      }
    }

    itineraries.sort((a, b) => a.totalDurationS - b.totalDurationS);
    return itineraries;
  }

  private async compute(from: Coord, to: Coord, mode: Mode): Promise<Segment | null> {
    const provider = this.providers.find((p) => p.supportedModes.includes(mode));
    if (!provider) return null;
    return provider.computeSegment(from, to, mode);
  }

  private wrap(id: string, segments: Segment[]): Itinerary {
    return {
      id,
      segments,
      totalDistanceM: segments.reduce((s, seg) => s + seg.distanceM, 0),
      totalDurationS: segments.reduce((s, seg) => s + seg.durationS, 0),
      totalCo2G: segments.reduce((s, seg) => s + seg.co2G, 0),
    };
  }
}
