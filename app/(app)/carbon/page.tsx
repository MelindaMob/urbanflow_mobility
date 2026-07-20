import { getCarbonStats } from "./actions";

const MODE_META: Record<string, { icon: string; label: string; color: string }> = {
  foot: { icon: "🚶", label: "Marche", color: "bg-mobility-green" },
  bike: { icon: "🚲", label: "Vélo", color: "bg-mobility-green" },
  tram: { icon: "🚊", label: "Tram", color: "bg-flow-blue" },
  bus: { icon: "🚌", label: "Bus", color: "bg-flow-blue" },
  car: { icon: "🚗", label: "Voiture", color: "bg-neutral-400" },
  scooter: { icon: "🛴", label: "Trottinette", color: "bg-mobility-green" },
};

function formatCo2(g: number): string {
  return g < 1000 ? `${g} g` : `${(g / 1000).toFixed(2)} kg`;
}

export default async function CarbonPage() {
  const stats = await getCarbonStats();

  if (!stats || stats.totalTripsCount === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        <h1 className="text-3xl font-bold mb-2">Mon empreinte carbone</h1>
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center mt-6">
          <div className="text-5xl mb-4">🌱</div>
          <p className="text-neutral-600 font-medium">
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

  const maxCo2 = Math.max(...stats.byMode.map((m) => m.co2G), 1);
  const equivalentKmCar = Math.round((stats.totalCo2G / 200) * 10) / 10;

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">Mon empreinte carbone</h1>
        <p className="text-sm text-neutral-500">
          Basée sur {stats.totalTripsCount} trajet
          {stats.totalTripsCount > 1 ? "s" : ""} sauvegardé
          {stats.totalTripsCount > 1 ? "s" : ""} · Facteurs ADEME
        </p>
      </div>

      {/* KPI principal — CO2 évité */}
      <div className="bg-gradient-to-br from-mobility-green to-emerald-700 text-white rounded-2xl p-8 mb-6 shadow-lg">
        <p className="text-sm font-medium text-white/80 uppercase tracking-wide mb-2">
          CO₂ économisé vs voiture
        </p>
        <div className="flex items-baseline gap-3 mb-4">
          <p className="text-6xl font-bold">
            {stats.co2VsCar > 0 ? `${stats.co2VsCar}%` : "0%"}
          </p>
          <p className="text-lg text-white/80">de réduction</p>
        </div>
        <p className="text-sm text-white/80">
          Équivalent à ~{equivalentKmCar} km non parcourus en voiture
        </p>
      </div>

      {/* Grille KPI secondaires */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
            Total émis
          </p>
          <p className="text-3xl font-bold mt-1">
            {formatCo2(stats.totalCo2G)}
          </p>
          <p className="text-xs text-neutral-500 mt-1">de CO₂</p>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
            Distance parcourue
          </p>
          <p className="text-3xl font-bold mt-1">{stats.totalDistanceKm}</p>
          <p className="text-xs text-neutral-500 mt-1">kilomètres</p>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
            30 derniers jours
          </p>
          <p className="text-3xl font-bold mt-1">
            {formatCo2(stats.last30DaysCo2)}
          </p>
          <p className="text-xs text-neutral-500 mt-1">émis</p>
        </div>
      </div>

      {/* Répartition par mode */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Répartition par mode</h2>
          <p className="text-xs text-neutral-500">Distance totale</p>
        </div>

        <ul className="space-y-5">
          {stats.byMode.map((m) => {
            const info = MODE_META[m.mode] ?? {
              icon: "•",
              label: m.mode,
              color: "bg-neutral-400",
            };
            const widthPct = Math.round((m.co2G / maxCo2) * 100);
            return (
              <li key={m.mode}>
                <div className="flex items-center justify-between mb-1.5 text-sm">
                  <span className="flex items-center gap-2">
                    <span className="text-base">{info.icon}</span>
                    <span className="font-medium">{info.label}</span>
                    <span className="text-xs text-neutral-500">
                      · {m.distanceKm} km
                    </span>
                  </span>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatCo2(m.co2G)}
                  </span>
                </div>
                <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${info.color} rounded-full transition-all duration-500`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="text-xs text-neutral-500 text-center">
        Sources : ADEME Base Empreinte · Facteurs d&apos;émission par mode
      </p>
    </div>
  );
}
