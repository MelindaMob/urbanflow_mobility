export type Coord = {
  lat: number;
  lng: number;
};

export type GeocodedPlace = {
  label: string;
  coord: Coord;
};

export type Mode = "foot" | "bike" | "tram" | "bus" | "car" | "scooter";
