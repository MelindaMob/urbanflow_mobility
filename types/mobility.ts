export type Coord = {
  lat: number;
  lng: number;
};

export type GeocodedPlace = {
  label: string;
  coord: Coord;
};

export type Mode = "foot" | "bike" | "tram" | "bus" | "car" | "scooter";

// Un segment = une portion d'itinéraire dans un seul mode
export type Segment = {
  mode: Mode;
  distanceM: number;
  durationS: number;
  co2G: number;
  // Géométrie GeoJSON pour tracer sur la carte
  geometry: {
    type: "LineString";
    coordinates: [number, number][]; // [lng, lat]
  };
  // Métadonnées optionnelles selon le mode
  meta?: {
    lineCode?: string; // ex : "Tram A"
    lineName?: string;
  };
};

// Un itinéraire = suite ordonnée de segments
export type Itinerary = {
  id: string;
  segments: Segment[];
  totalDistanceM: number;
  totalDurationS: number;
  totalCo2G: number;
  departureTime?: string; // ISO
  arrivalTime?: string;
};

export type TransitStop = {
  id: string;
  name: string;
  coord: Coord;
  lines: string[]; // ex : ["A", "B"]
};

export type TransitLine = {
  ref: string; // ex : "bordeaux:Line:59:LOC"
  code: string; // ex : "A"
  name: string; // ex : "Tram A"
};
