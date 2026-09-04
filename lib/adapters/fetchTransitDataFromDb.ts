import type { SupabaseClient } from "@supabase/supabase-js";
import type { TransitLine, TransitStop } from "@/types/mobility";
import { TBMAdapter } from "./TBMAdapter";

type GtfsLineRow = {
  route_id: string;
  route_short_name: string | null;
  route_long_name: string | null;
  route_type: number | null;
};

type GtfsStopRow = {
  stop_id: string;
  stop_name: string | null;
  lat: number | null;
  lng: number | null;
  route_ids: string[] | null;
};

/**
 * Lit le référentiel réseau TBM (lignes + arrêts) depuis les tables
 * gtfs_lines / gtfs_stops, peuplées par scripts/import-gtfs.ts.
 *
 * IMPORTANT sur la cohérence des identifiants : ce référentiel utilise des
 * route_id GTFS (ex: "59"), différents des LineRef SIRI (ex:
 * "bordeaux:Line:59:LOC") utilisés par TBMAdapter.fetchTransitData().
 * C'est sans conséquence pour TripService.findBestTransitJourney, qui ne
 * compare que stop.lines à line.ref — deux valeurs venant toujours de LA
 * MÊME source ici. Ne jamais mélanger un TransitStop[] issu de cette
 * fonction avec un TransitLine[] issu de TBMAdapter.fetchLines() (SIRI),
 * ou l'inverse : le matching échouerait silencieusement (aucune ligne
 * commune trouvée, donc aucun itinéraire transport en commun proposé).
 */
export async function fetchTransitDataFromDb(
  supabase: SupabaseClient
): Promise<{ stops: TransitStop[]; lines: TransitLine[]; errors: string[] }> {
  const [linesRes, stopsRes] = await Promise.all([
    supabase
      .from("gtfs_lines")
      .select("route_id, route_short_name, route_long_name, route_type"),
    supabase.from("gtfs_stops").select("stop_id, stop_name, lat, lng, route_ids"),
  ]);

  const errors: string[] = [];
  if (linesRes.error) {
    errors.push(`Lecture lignes GTFS (base) impossible : ${linesRes.error.message}`);
  }
  if (stopsRes.error) {
    errors.push(`Lecture arrêts GTFS (base) impossible : ${stopsRes.error.message}`);
  }

  const lines: TransitLine[] = ((linesRes.data ?? []) as GtfsLineRow[]).map((r) => ({
    ref: r.route_id,
    code: r.route_short_name ?? "",
    name: r.route_long_name ?? r.route_short_name ?? "Ligne",
    routeType: r.route_type ?? undefined,
  }));

  const stops: TransitStop[] = ((stopsRes.data ?? []) as GtfsStopRow[])
    .filter((r) => typeof r.lat === "number" && typeof r.lng === "number")
    .map((r) => ({
      id: r.stop_id,
      name: r.stop_name ?? "Arrêt",
      coord: { lat: r.lat as number, lng: r.lng as number },
      lines: r.route_ids ?? [],
    }));

  return { stops, lines, errors };
}

/**
 * Wrapper avec fallback automatique : tente la base GTFS d'abord (rapide,
 * pas de dépendance réseau externe à chaque requête utilisateur), et ne
 * retombe sur le live SIRI Discovery que si la base est vide ou en erreur
 * (ex: le cron d'import n'a jamais tourné, ou a échoué la nuit dernière).
 *
 * C'est ce wrapper qu'il faut appeler depuis plan/actions.ts, pas les deux
 * fonctions séparément — il encapsule la stratégie de repli.
 */
export async function fetchTransitDataWithFallback(
  supabase: SupabaseClient
): Promise<{
  stops: TransitStop[];
  lines: TransitLine[];
  errors: string[];
  source: "db" | "siri-fallback";
}> {
  const dbResult = await fetchTransitDataFromDb(supabase);

  if (dbResult.stops.length > 0 && dbResult.lines.length > 0) {
    return { ...dbResult, source: "db" };
  }

  console.warn(
    "Base GTFS vide ou incomplète, fallback vers SIRI Discovery live.",
    dbResult.errors
  );
  const liveResult = await TBMAdapter.fetchTransitData();

  return {
    stops: liveResult.stops,
    lines: liveResult.lines,
    errors: [...dbResult.errors, ...liveResult.errors],
    source: "siri-fallback",
  };
}
