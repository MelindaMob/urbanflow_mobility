import { createClient } from "@/lib/supabase/server";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(s: number): string {
  const mins = Math.round(s / 60);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)} h ${(mins % 60).toString().padStart(2, "0")}`;
}

function formatCo2(g: number): string {
  return g < 1000 ? `${g} g` : `${(g / 1000).toFixed(2)} kg`;
}

export default async function HistoryPage() {
  const supabase = await createClient();

  const { data: trips } = await supabase
    .from("trips")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-2">Historique de mes trajets</h1>
      <p className="text-sm text-neutral-500 mb-6">
        Vos 20 derniers trajets sauvegardés
      </p>

      {!trips || trips.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-lg p-8 text-center">
          <p className="text-neutral-600">
            Vous n&apos;avez pas encore de trajet sauvegardé.
          </p>
          <p className="text-sm text-neutral-500 mt-2">
            Utilisez le planificateur pour rechercher et sauvegarder votre
            premier trajet.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {trips.map((trip) => (
            <li
              key={trip.id}
              className="bg-white border border-neutral-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-neutral-500">
                  {formatDate(trip.created_at)}
                </p>
                <p className="text-xs font-semibold text-mobility-green">
                  {formatCo2(trip.total_co2_g)} CO₂
                </p>
              </div>
              <div className="text-sm">
                <span className="inline-block w-2 h-2 rounded-full bg-mobility-green mr-2" />
                {trip.origin_label}
              </div>
              <div className="text-sm mt-1">
                <span className="inline-block w-2 h-2 rounded-full bg-action-orange mr-2" />
                {trip.destination_label}
              </div>
              <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center gap-4 text-xs text-neutral-500">
                <span>{formatDuration(trip.total_duration_s)}</span>
                <span>{(trip.total_distance_m / 1000).toFixed(1)} km</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
