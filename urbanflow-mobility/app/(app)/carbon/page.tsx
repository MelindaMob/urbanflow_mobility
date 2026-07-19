import { getCarbonStats } from "./actions";

const MODE_LABELS: Record<
  string,
  { icon: string; label: string; color: string }
> = {
  foot: { icon: "🚶", label: "Marche", color: "bg-mobility-green" },
  bike: { icon: "🚲", label: "Vélo", color: "bg-mobility-green" },
  tram: { icon: "🚊", label: "Tram", color: "bg-flow-blue" },
  bus: { icon: "🚌", label: "Bus", color: "bg-flow-blue" },
  car: { icon: "🚗", label: "Voiture", color: "bg-neutral-500" },
  scooter: { icon: "🛴", label: "Trottinette", color: "bg-mobility-green" },
};

function formatCo2(g: number): string {
  return g < 1000 ? `${g} g` : `${(g / 1000).toFixed(2)} kg`;
}

export default async function CarbonPage() {
  const stats = await getCarbonStats();

  if (!stats || stats.totalTripsCount === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-2">Mon empreinte carbone</h1>
        <div className="bg-white border border-neutral-200 rounded-lg p-8 text-center mt-6">
          <p className="text-neutral-600">
            Aucun trajet sauvegardé pour le moment.
          </p>
          <p className="text-sm text-neutral-500 mt-2">
            Utilisez le planificateur et sauvegardez vos trajets pour voir
            apparaître vos statistiques ici.
          </p>
        </div>
      </div>
    );
  }

  // Total CO₂ maximum pour l'échelle de la barre
  const maxCo2 = Math.max(...stats.byMode.map((m) => m.co2G), 1);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-1">Mon empreinte carbone</h1>
      <p className="text-sm text-neutral-500 mb-6">
        Basée sur {stats.totalTripsCount} trajet
        {stats.totalTripsCount > 1 ? "s" : ""} sauvegardé
        {stats.totalTripsCount > 1 ? "s" : ""} · Facteurs ADEME
      </p>

      {/* KPI principaux */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-neutral-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
            Total émis
          </p>
          <p className="text-2xl font-semibold mt-1">
            {formatCo2(stats.totalCo2G)}{" "}
            <span className="text-sm font-normal text-neutral-500">CO₂</span>
          </p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
            Distance totale
          </p>
          <p className="text-2xl font-semibold mt-1">
            {stats.totalDistanceKm}{" "}
            <span className="text-sm font-normal text-neutral-500">km</span>
          </p>
        </div>

        <div className="bg-green-50 border border-mobility-green rounded-lg p-4">
          <p className="text-xs font-semibold text-mobility-green uppercase tracking-wide">
            Économies vs voiture
          </p>
          <p className="text-2xl font-semibold text-mobility-green mt-1">
            {stats.co2VsCar > 0 ? `-${stats.co2VsCar}%` : "0%"}
          </p>
        </div>
      </div>

      {/* Répartition par mode */}
      <div className="bg-white border border-neutral-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Répartition par mode</h2>
        <ul className="space-y-4">
          {stats.byMode.map((m) => {
            const info = MODE_LABELS[m.mode] ?? {
              icon: "•",
              label: m.mode,
              color: "bg-neutral-400",
            };
            const widthPct = Math.round((m.co2G / maxCo2) * 100);
            return (
              <li key={m.mode}>
                <div className="flex items-center justify-between mb-1 text-sm">
                  <span className="flex items-center gap-2">
                    <span>{info.icon}</span>
                    <span className="font-medium">{info.label}</span>
                    <span className="text-xs text-neutral-500">
                      · {m.distanceKm} km · {m.tripCount} trajet
                      {m.tripCount > 1 ? "s" : ""}
                    </span>
                  </span>
                  <span className="text-sm font-medium">
                    {formatCo2(m.co2G)}
                  </span>
                </div>
                <div className="h-2 bg-neutral-100 rounded overflow-hidden">
                  <div
                    className={`h-full ${info.color} transition-all`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* 30 derniers jours */}
      <div className="bg-white border border-neutral-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-2">30 derniers jours</h2>
        <p className="text-3xl font-semibold">
          {formatCo2(stats.last30DaysCo2)}{" "}
          <span className="text-sm font-normal text-neutral-500">
            CO₂ émis
          </span>
        </p>
      </div>

      {/* Note source */}
      <p className="text-xs text-neutral-500 text-center">
        Sources : ADEME Base Empreinte (facteurs d&apos;émission par mode de
        transport)
      </p>
    </div>
  );
}
