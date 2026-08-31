import type { Coord, Itinerary, Segment, Mode, TransitStop, TransitLine } from "@/types/mobility";
import type { IRoutingProvider } from "@/lib/adapters/IRoutingProvider";
import { TBMAdapter, type TransitJourney } from "@/lib/adapters/TBMAdapter";

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
      const journey = TBMAdapter.findBestTransitJourney(
        origin,
        destination,
        transitStops,
        transitLines
      );

      if (journey) {
        const transitItinerary = await this.buildTransitItinerary(
          origin,
          destination,
          journey,
          acceptedModes
        );
        if (transitItinerary) itineraries.push(transitItinerary);
      }
    }

    itineraries.sort((a, b) => a.totalDurationS - b.totalDurationS);
    return itineraries;
  }

  private async buildTransitItinerary(
    origin: Coord,
    destination: Coord,
    journey: TransitJourney,
    acceptedModes: Mode[]
  ): Promise<Itinerary | null> {
    if (journey.kind === "direct") {
      const mode = TBMAdapter.lineMode(journey.line);
      if (!acceptedModes.includes(mode)) return null;

      const [walkStart, walkEnd] = await Promise.all([
        this.compute(origin, journey.originStop.coord, "foot"),
        this.compute(journey.destStop.coord, destination, "foot"),
      ]);

      const transitSeg = TBMAdapter.computeTransitSegment(
        journey.originStop,
        journey.destStop,
        journey.line,
        mode
      );

      if (!walkStart || !walkEnd) return null;
      return this.wrap(`multimodal-${mode}`, [walkStart, transitSeg, walkEnd]);
    }

    const mode1 = TBMAdapter.lineMode(journey.line1);
    const mode2 = TBMAdapter.lineMode(journey.line2);
    if (!acceptedModes.includes(mode1) || !acceptedModes.includes(mode2)) {
      return null;
    }

    const [walkStart, walkEnd] = await Promise.all([
      this.compute(origin, journey.originStop.coord, "foot"),
      this.compute(journey.destStop.coord, destination, "foot"),
    ]);

    const transit1 = TBMAdapter.computeTransitSegment(
      journey.originStop,
      journey.hubStop,
      journey.line1,
      mode1
    );
    const transit2 = TBMAdapter.computeTransitSegment(
      journey.hubStop,
      journey.destStop,
      journey.line2,
      mode2
    );
    transit2.durationS += 300;

    if (!walkStart || !walkEnd) return null;
    return this.wrap("multimodal-transfer", [
      walkStart,
      transit1,
      transit2,
      walkEnd,
    ]);
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
