import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: factors, error } = await supabase
    .from("emission_factors")
    .select("*")
    .order("factor_g_per_km", { ascending: true });

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-4xl font-semibold text-mobility-green mb-4">
          UrbanFlow Mobility
        </h1>
        <p className="text-lg mb-8">
          Plateforme de mobilité urbaine multimodale et durable
        </p>

        {error && (
          <p className="text-action-orange text-sm">
            Erreur de connexion : {error.message}
          </p>
        )}

        {factors && factors.length > 0 && (
          <div className="text-left bg-white rounded-lg p-4 border border-neutral-200">
            <p className="text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wide">
              Facteurs d&apos;émission ADEME
            </p>
            <ul className="text-sm space-y-1">
              {factors.map((f) => (
                <li key={f.mode} className="flex justify-between">
                  <span className="capitalize">{f.mode}</span>
                  <span className="font-mono text-neutral-600">
                    {f.factor_g_per_km} g CO₂/km
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-8 text-sm text-neutral-500">
          Version 0.1 · en développement
        </p>
      </div>
    </main>
  );
}
