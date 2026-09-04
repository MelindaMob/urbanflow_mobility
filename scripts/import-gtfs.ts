import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

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

  // 🔍 DEBUG — à retirer une fois le bug trouvé
  console.log(`[debug] trips.txt : ${trips.length} lignes brutes`);
  console.log(`[debug] tripToRoute : ${tripToRoute.size} entrées`);
  console.log(`[debug] exemple trip brut :`, trips[0]);
  // #region agent log
  fetch("http://127.0.0.1:7860/ingest/f68b4835-f2e4-46d1-a86f-0aad26d2b5a1", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "299942",
    },
    body: JSON.stringify({
      sessionId: "299942",
      runId: "pre-fix",
      hypothesisId: "C",
      location: "scripts/import-gtfs.ts:tripToRoute",
      message: "trips.txt parse + tripToRoute size",
      data: {
        tripsLength: trips.length,
        tripToRouteSize: tripToRoute.size,
        tripKeys: trips[0] ? Object.keys(trips[0]) : [],
        sampleTripId: trips[0]?.trip_id ?? null,
        sampleRouteId: trips[0]?.route_id ?? null,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  const stopRoutes = new Map<string, Set<string>>();
  let skippedMissingIds = 0;
  let skippedNoTrip = 0;
  for (const row of stopTimes) {
    if (!row.stop_id || !row.trip_id) {
      skippedMissingIds += 1;
      continue;
    }
    const routeId = tripToRoute.get(row.trip_id);
    if (!routeId) {
      skippedNoTrip += 1;
      continue;
    }
    let set = stopRoutes.get(row.stop_id);
    if (!set) {
      set = new Set();
      stopRoutes.set(row.stop_id, set);
    }
    set.add(routeId);
  }

  // 🔍 DEBUG — à retirer une fois le bug trouvé
  console.log(`[debug] stop_times.txt : ${stopTimes.length} lignes brutes`);
  console.log(`[debug] exemple stop_time brut :`, stopTimes[0]);
  console.log(
    `[debug] stopRoutes : ${stopRoutes.size} arrêts avec au moins 1 ligne`
  );
  // #region agent log
  fetch("http://127.0.0.1:7860/ingest/f68b4835-f2e4-46d1-a86f-0aad26d2b5a1", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "299942",
    },
    body: JSON.stringify({
      sessionId: "299942",
      runId: "pre-fix",
      hypothesisId: "A-B-E",
      location: "scripts/import-gtfs.ts:stopRoutes",
      message: "stop_times parse + join trip_id→route_id",
      data: {
        stopTimesLength: stopTimes.length,
        stopTimeKeys: stopTimes[0] ? Object.keys(stopTimes[0]) : [],
        sampleStopId: stopTimes[0]?.stop_id ?? null,
        sampleTripId: stopTimes[0]?.trip_id ?? null,
        skippedMissingIds,
        skippedNoTrip,
        stopRoutesSize: stopRoutes.size,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  const stopRows = stops
    .filter((s) => {
      if (!s.stop_id || !s.stop_lat || !s.stop_lon) return false;
      return Number.isFinite(Number(s.stop_lat)) && Number.isFinite(Number(s.stop_lon));
    })
    .map((s) => ({
      stop_id: s.stop_id,
      stop_name: s.stop_name || "Arrêt",
      geom: `SRID=4326;POINT(${s.stop_lon} ${s.stop_lat})`,
      route_ids: Array.from(stopRoutes.get(s.stop_id) ?? []),
      updated_at: new Date().toISOString(),
    }))
    .filter((s) => s.route_ids.length > 0);

  const stopRowsWithRoutes = stopRows.filter((s) => s.route_ids.length > 0).length;
  // 🔍 DEBUG — à retirer une fois le bug trouvé
  console.log(
    `[debug] stopRows : ${stopRows.length} arrêts, dont ${stopRowsWithRoutes} avec route_ids non vide`
  );
  // #region agent log
  fetch("http://127.0.0.1:7860/ingest/f68b4835-f2e4-46d1-a86f-0aad26d2b5a1", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "299942",
    },
    body: JSON.stringify({
      sessionId: "299942",
      runId: "pre-fix",
      hypothesisId: "D",
      location: "scripts/import-gtfs.ts:stopRows",
      message: "stop_id match between stops.txt and stopRoutes",
      data: {
        stopsLength: stops.length,
        stopRowsLength: stopRows.length,
        stopRowsWithRoutes,
        sampleStopId: stopRows[0]?.stop_id ?? null,
        sampleStopRouteCount: stopRows[0]?.route_ids.length ?? null,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  console.log(`Lignes : ${lines.length}, arrêts : ${stopRows.length}`);

  await replaceTable(supabase, "gtfs_lines", lines, "route_id");
  await replaceTable(supabase, "gtfs_stops", stopRows, "stop_id");

  console.log("Import GTFS TBM terminé.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
