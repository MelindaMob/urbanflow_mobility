import type { Coord, Mode, Segment } from "@/types/mobility";

export interface IRoutingProvider {
  readonly supportedModes: readonly Mode[];
  computeSegment(
    from: Coord,
    to: Coord,
    mode: Mode
  ): Promise<Segment | null>;
}
