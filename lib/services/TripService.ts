import type { Coord, Itinerary, Segment, Mode } from "@/types/mobility";
import type { IRoutingProvider } from "@/lib/adapters/IRoutingProvider";

export type ComputeItinerariesInput = {
  origin: Coord;
  destination: Coord;
  acceptedModes: Mode[];
};

export class TripService {
  private providers: IRoutingProvider[];

  constructor(providers: IRoutingProvider[]) {
    this.providers = providers;
  }

  async computeItineraries(
    input: ComputeItinerariesInput
  ): Promise<Itinerary[]> {
    const { origin, destination, acceptedModes } = input;

    // Stratégie de composition : on génère 3 itinéraires typiques
    // 1. Tout à pied (si accepté)
    // 2. Tout à vélo (si accepté)
    // 3. Multimodal : marche jusqu'au point médian + tram + marche

    const itineraries: Itinerary[] = [];

    // === Itinéraire 1 : tout à pied ===
    if (acceptedModes.includes("foot")) {
      const seg = await this.compute(origin, destination, "foot");
      if (seg) itineraries.push(this.wrap("foot-only", [seg]));
    }

    // === Itinéraire 2 : tout à vélo ===
    if (acceptedModes.includes("bike")) {
      const seg = await this.compute(origin, destination, "bike");
      if (seg) itineraries.push(this.wrap("bike-only", [seg]));
    }

    // === Itinéraire 3 : multimodal marche + tram + marche ===
    if (acceptedModes.includes("tram") && acceptedModes.includes("foot")) {
      // Points intermédiaires : à ~1/4 et 3/4 de la distance
      const midStart: Coord = {
        lat: origin.lat + (destination.lat - origin.lat) * 0.25,
        lng: origin.lng + (destination.lng - origin.lng) * 0.25,
      };
      const midEnd: Coord = {
        lat: origin.lat + (destination.lat - origin.lat) * 0.75,
        lng: origin.lng + (destination.lng - origin.lng) * 0.75,
      };

      // Appels parallèles = argument perf du dossier (bloc "par" du diagramme séquence)
      const [walkStart, tram, walkEnd] = await Promise.all([
        this.compute(origin, midStart, "foot"),
        this.compute(midStart, midEnd, "tram"),
        this.compute(midEnd, destination, "foot"),
      ]);

      if (walkStart && tram && walkEnd) {
        itineraries.push(
          this.wrap("multimodal-tram", [walkStart, tram, walkEnd])
        );
      }
    }

    // Tri par défaut : durée croissante
    itineraries.sort((a, b) => a.totalDurationS - b.totalDurationS);

    return itineraries;
  }

  private async compute(
    from: Coord,
    to: Coord,
    mode: Mode
  ): Promise<Segment | null> {
    // Trouve le premier provider qui gère ce mode
    const provider = this.providers.find((p) =>
      p.supportedModes.includes(mode)
    );
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
