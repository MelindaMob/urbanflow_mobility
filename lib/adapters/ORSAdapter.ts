import type { Coord, Mode, Segment } from "@/types/mobility";
import type { IRoutingProvider } from "./IRoutingProvider";

// Mapping des modes UrbanFlow vers les profils ORS
const ORS_PROFILE: Partial<Record<Mode, string>> = {
  foot: "foot-walking",
  bike: "cycling-regular",
  car: "driving-car",
};

// Facteurs d'émission ADEME (g CO₂/km)
// Idéalement chargés depuis la BDD, mais dupliqués ici pour éviter un query par appel
const CO2_FACTORS: Record<Mode, number> = {
  foot: 0,
  bike: 0,
  tram: 4,
  bus: 95,
  car: 200,
  scooter: 32,
};

export class ORSAdapter implements IRoutingProvider {
  readonly supportedModes = ["foot", "bike", "car"] as const;

  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async computeSegment(
    from: Coord,
    to: Coord,
    mode: Mode
  ): Promise<Segment | null> {
    const profile = ORS_PROFILE[mode];
    if (!profile) return null;

    try {
      const response = await fetch(
        `https://api.openrouteservice.org/v2/directions/${profile}/geojson`,
        {
          method: "POST",
          headers: {
            Accept: "application/json, application/geo+json",
            "Content-Type": "application/json",
            Authorization: this.apiKey,
          },
          body: JSON.stringify({
            coordinates: [
              [from.lng, from.lat],
              [to.lng, to.lat],
            ],
          }),
        }
      );

      if (!response.ok) {
        console.error("ORS error:", response.status, await response.text());
        return null;
      }

      const data = await response.json();
      const feature = data.features?.[0];
      if (!feature) return null;

      const summary = feature.properties?.summary;
      if (!summary) return null;

      const distanceM = Math.round(summary.distance);
      const durationS = Math.round(summary.duration);
      const co2G = Math.round((distanceM / 1000) * CO2_FACTORS[mode]);

      return {
        mode,
        distanceM,
        durationS,
        co2G,
        geometry: {
          type: "LineString",
          coordinates: feature.geometry.coordinates,
        },
      };
    } catch (err) {
      console.error("ORS fetch failed:", err);
      return null;
    }
  }
}
