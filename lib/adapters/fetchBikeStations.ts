/**
 * Récupération des stations de vélos en libre-service "Le Vélo" (ex-VCub)
 * via le standard GBFS 3.0 (MobilityData).
 *
 * Contrairement à GTFS/SIRI/GTFS-RT, GBFS est du JSON simple, pas de
 * parsing binaire ni de zip — le plus simple des flux TBM utilisés dans
 * ce projet.
 *
 * Endpoints (même clé API que les autres flux Mecatran) :
 *   - Racine (liste des sous-flux) :
 *     https://bdx.mecatran.com/utw/ws/gbfs/bordeaux/v3/gbfs.json?apiKey=...
 *   - station_information.json : position, nom, capacité de chaque station
 *   - station_status.json      : vélos dispos / bornes libres en temps réel
 *
 * On combine les deux car GBFS sépare volontairement le "statique"
 * (où sont les stations) du "dynamique" (combien de vélos maintenant).
 */

const GBFS_API_KEY = "opendata-bordeaux-metropole-flux-gtfs-rt";
const STATION_INFO_URL = `https://bdx.mecatran.com/utw/ws/gbfs/bordeaux/v3/station_information.json?apiKey=${GBFS_API_KEY}`;
const STATION_STATUS_URL = `https://bdx.mecatran.com/utw/ws/gbfs/bordeaux/v3/station_status.json?apiKey=${GBFS_API_KEY}`;

export type BikeStation = {
  stationId: string;
  name: string;
  lat: number;
  lng: number;
  capacity: number | null;
  bikesAvailable: number;
  docksAvailable: number;
  isRenting: boolean;
};

type GbfsStationInfoResponse = {
  data: {
    stations: {
      station_id: string;
      name: string;
      lat: number;
      lon: number;
      capacity?: number;
    }[];
  };
};

type GbfsStationStatusResponse = {
  data: {
    stations: {
      station_id: string;
      num_bikes_available: number;
      num_docks_available: number;
      is_renting: number | boolean;
      is_installed: number | boolean;
    }[];
  };
};

export async function fetchBikeStations(): Promise<BikeStation[]> {
  const [infoRes, statusRes] = await Promise.all([
    fetch(STATION_INFO_URL, { next: { revalidate: 300 } }), // référentiel stations : peu volatile, 5 min de cache suffit
    fetch(STATION_STATUS_URL, { cache: "no-store" }), // disponibilité : vraiment temps réel, pas de cache
  ]);

  if (!infoRes.ok) {
    throw new Error(`GBFS station_information indisponible (HTTP ${infoRes.status})`);
  }
  if (!statusRes.ok) {
    throw new Error(`GBFS station_status indisponible (HTTP ${statusRes.status})`);
  }

  const info: GbfsStationInfoResponse = await infoRes.json();
  const status: GbfsStationStatusResponse = await statusRes.json();

  const statusById = new Map(status.data.stations.map((s) => [s.station_id, s]));

  return info.data.stations
    .map((station) => {
      const st = statusById.get(station.station_id);
      if (!st) return null;
      return {
        stationId: station.station_id,
        name: station.name,
        lat: station.lat,
        lng: station.lon,
        capacity: station.capacity ?? null,
        bikesAvailable: st.num_bikes_available,
        docksAvailable: st.num_docks_available,
        isRenting: Boolean(st.is_renting),
      };
    })
    .filter((s): s is BikeStation => s !== null);
}

/**
 * Route Next.js à créer en app/api/bike-stations/route.ts, même principe
 * que pour les positions véhicules (ne pas exposer la clé API au client) :
 *
 *   import { fetchBikeStations } from "@/lib/adapters/fetchBikeStations";
 *
 *   export async function GET() {
 *     try {
 *       const stations = await fetchBikeStations();
 *       return Response.json({ stations });
 *     } catch (err) {
 *       return Response.json({ stations: [], error: String(err) }, { status: 502 });
 *     }
 *   }
 *
 * Côté MapView.tsx : même pattern que le polling véhicules, mais avec un
 * intervalle plus long (les stations vélos changent moins vite que la
 * position d'un tram) — 60s est cohérent avec le rafraîchissement du flux
 * lui-même côté TBM (2min30).
 */