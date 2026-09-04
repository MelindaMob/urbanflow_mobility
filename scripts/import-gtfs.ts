/**
 * Import quotidien du GTFS statique TBM dans gtfs_lines / gtfs_stops.
 *
 * Usage local :
 *   npx tsx scripts/import-gtfs.ts
 *
 * Variables d'environnement :
 *   SUPABASE_URL (ou NEXT_PUBLIC_SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY
 */
import AdmZip from "adm-zip";
import Papa from "papaparse";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const TBM_API_KEY = "opendata-bordeaux-metropole-flux-gtfs-rt";
const GTFS_STATIC_URL = `https://bdx.mecatran.com/utw/ws/gtfsfeed/static/bordeaux?apiKey=${TBM_API_KEY}`;
const INSERT_BATCH = 500;

type CsvRow = Record<string, string>;

function requiredEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Variable d'environnement manquante : ${name}`);
  }
  return value;
}

function parseCsv(text: string): CsvRow[] {
  const cleaned = text.replace(/^\uFEFF/, "");
  const parsed = Papa.parse<CsvRow>(cleaned, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });
  if (parsed.errors.length > 0 && parsed.data.length === 0) {
    const first = parsed.errors[0];
    throw new Error(`Parse CSV GTFS : ${first.message} (ligne ${first.row})`);
  }
  return parsed.data;
}

function readGtfsFile(zip: AdmZip, filename: string): string {
  const entry = zip.getEntries().find((e) => {
    const base = e.entryName.replace(/\\/g, "/").split("/").pop();
    return base === filename;
  });
  if (!entry) {
    throw new Error(`Fichier GTFS manquant dans le zip : ${filename}`);
  }
  return entry.getData().toString("utf8");
}

async function replaceTable(
  supabase: SupabaseClient,
  table: "gtfs_lines" | "gtfs_stops",
  rows: Record<string, unknown>[],
  idColumn: string
) {
  const { error: deleteError } = await supabase
    .from(table)
    .delete()
    .neq(idColumn, "");
  if (deleteError) {
    throw new Error(`Purge ${table} : ${deleteError.message}`);
  }

  for (let i = 0; i < rows.length; i += INSERT_BATCH) {
    const chunk = rows.slice(i, i + INSERT_BATCH);
    const { error } = await supabase.from(table).insert(chunk);
    if (error) {
      throw new Error(`Insert ${table} (offset ${i}) : ${error.message}`);
    }
  }
}

async function main() {
  const supabaseUrl = requiredEnv(
    "SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL
  );
  const serviceKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(supabaseUrl, serviceKey);

  console.log("Téléchargement du GTFS TBM…");
  const response = await fetch(GTFS_STATIC_URL);
  if (!response.ok) {
    throw new Error(`Téléchargement GTFS HTTP ${response.status}`);
  }
  const zip = new AdmZip(Buffer.from(await response.arrayBuffer()));

  const routes = parseCsv(readGtfsFile(zip, "routes.txt"));
  const trips = parseCsv(readGtfsFile(zip, "trips.txt"));
  const stopTimes = parseCsv(readGtfsFile(zip, "stop_times.txt"));
  const stops = parseCsv(readGtfsFile(zip, "stops.txt"));

  const lines = routes
    .filter((r) => r.route_id)
    .map((r) => ({
      route_id: r.route_id,
      route_short_name: r.route_short_name || null,
      route_long_name: r.route_long_name || null,
      route_type: r.route_type ? Number(r.route_type) : null,
    }));

  const tripToRoute = new Map<string, string>();
  for (const trip of trips) {
    if (trip.trip_id && trip.route_id) {
      tripToRoute.set(trip.trip_id, trip.route_id);
    }
  }

  const stopRoutes = new Map<string, Set<string>>();
  for (const row of stopTimes) {
    if (!row.stop_id || !row.trip_id) continue;
    const routeId = tripToRoute.get(row.trip_id);
    if (!routeId) continue;
    let set = stopRoutes.get(row.stop_id);
    if (!set) {
      set = new Set();
      stopRoutes.set(row.stop_id, set);
    }
    set.add(routeId);
  }

  const stopRows = stops
    .filter((s) => s.stop_id && s.stop_lat && s.stop_lon)
    .map((s) => ({
      stop_id: s.stop_id,
      stop_name: s.stop_name || null,
      lat: Number(s.stop_lat),
      lng: Number(s.stop_lon),
      route_ids: Array.from(stopRoutes.get(s.stop_id) ?? []),
    }))
    .filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng));

  console.log(`Lignes : ${lines.length}, arrêts : ${stopRows.length}`);

  await replaceTable(supabase, "gtfs_lines", lines, "route_id");
  await replaceTable(supabase, "gtfs_stops", stopRows, "stop_id");

  console.log("Import GTFS TBM terminé.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
