import Link from "next/link";
import Logo from "@/components/ui/Logo";
import WelcomeRouteMap from "@/components/welcome/WelcomeRouteMap";

const MODES = [
  { label: "Tram & Bus", color: "bg-flow-blue/10 text-flow-blue border-flow-blue/20" },
  { label: "Vélo", color: "bg-mobility-green/10 text-mobility-green border-mobility-green/20" },
  { label: "Marche", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
] as const;

export default function WelcomePage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-[#F8FAFC]">
      {/* Fond décoratif */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(5,150,105,0.12) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(2,132,199,0.10) 0%, transparent 45%)",
        }}
        aria-hidden="true"
      />

      <div className="relative min-h-screen flex flex-col">
        {/* Header logo */}
        <header className="pt-8 pb-4 px-6 flex justify-center">
          <Logo withText className="h-10 w-auto" />
        </header>

        {/* Contenu principal */}
        <main className="flex-1 flex flex-col lg:flex-row lg:items-center lg:justify-center gap-10 lg:gap-16 px-6 pb-8 max-w-6xl mx-auto w-full">
          {/* Visuel hero */}
          <div className="lg:flex-1 lg:max-w-xl">
            <div className="bg-white rounded-[2rem] p-2 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.10)] border border-neutral-100/80 overflow-hidden">
              <WelcomeRouteMap />
            </div>

            {/* Stats rapides — desktop sous le visuel */}
            <div className="hidden lg:grid grid-cols-3 gap-3 mt-6">
              {[
                { value: "Temps réel", sub: "Données TBM" },
                { value: "Multimodal", sub: "6 modes" },
                { value: "Bas carbone", sub: "Facteurs ADEME" },
              ].map((stat) => (
                <div
                  key={stat.value}
                  className="bg-white/80 backdrop-blur rounded-xl border border-neutral-100 px-4 py-3 text-center"
                >
                  <p className="text-sm font-semibold text-anthracite">{stat.value}</p>
                  <p className="text-[11px] text-neutral-500 mt-0.5">{stat.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Texte + actions */}
          <div className="lg:flex-1 lg:max-w-md flex flex-col justify-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-mobility-green mb-4">
              Bordeaux · Mobilité durable
            </p>

            <h1 className="text-[2rem] sm:text-[2.35rem] font-bold tracking-tight leading-[1.15] text-anthracite mb-5">
              Tous vos trajets,
              <br />
              <span className="text-mobility-green">en un seul geste.</span>
            </h1>

            <p className="text-base text-neutral-500 leading-relaxed mb-6">
              Planifiez, comparez et suivez vos déplacements. UrbanFlow fusionne tram, bus, vélo et marche pour vous proposer l&apos;itinéraire le plus rapide et le moins polluant.
            </p>

            {/* Tags modes */}
            <div className="flex flex-wrap gap-2 mb-8">
              {MODES.map((mode) => (
                <span
                  key={mode.label}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${mode.color}`}
                >
                  {mode.label}
                </span>
              ))}
            </div>

            {/* CTA */}
            <div className="space-y-3">
              <Link
                href="/signup"
                className="flex items-center justify-center gap-2 w-full bg-mobility-green text-white font-semibold py-4 rounded-2xl hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-lg shadow-mobility-green/25"
              >
                Commencer gratuitement
                <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 10h12M11 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>

              <Link
                href="/login"
                className="flex items-center justify-center w-full py-3.5 rounded-2xl border border-neutral-200 bg-white text-sm font-semibold text-anthracite hover:border-neutral-300 hover:bg-neutral-50 transition"
              >
                J&apos;ai déjà un compte
              </Link>
            </div>

            {/* Indicateur étapes */}
            <div className="flex items-center justify-center gap-2 mt-8">
              <span className="h-1.5 w-8 rounded-full bg-mobility-green" />
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-300" />
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-300" />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="px-6 pb-8 pt-2 text-center">
          <p className="text-[11px] text-neutral-400">
            Installable sur votre écran d&apos;accueil · PWA · © 2026 UrbanFlow
          </p>
        </footer>
      </div>
    </div>
  );
}
