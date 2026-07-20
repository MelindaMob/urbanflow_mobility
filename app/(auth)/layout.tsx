import Link from "next/link";
import Logo from "@/components/ui/Logo";
import WelcomeRouteMap from "@/components/welcome/WelcomeRouteMap";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      {/* Panneau gauche — desktop */}
      <aside className="hidden lg:flex flex-col bg-[#F8FAFC] border-r border-neutral-100">
        <div className="flex flex-col h-full p-10 xl:p-14">
          <Link href="/welcome">
            <Logo withText className="h-9 w-auto" />
          </Link>

          <div className="flex-1 flex flex-col justify-center py-10 max-w-md">
            <div className="rounded-2xl bg-white border border-neutral-100 shadow-[0_8px_40px_rgba(0,0,0,0.06)] overflow-hidden mb-8">
              <WelcomeRouteMap className="rounded-none" />
            </div>

            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-mobility-green mb-3">
              Bordeaux · Mobilité durable
            </p>
            <h1 className="text-2xl xl:text-3xl font-bold tracking-tight leading-snug text-anthracite mb-3">
              Tous vos trajets,
              <br />
              <span className="text-mobility-green">en un seul geste.</span>
            </h1>
            <p className="text-sm text-neutral-500 leading-relaxed">
              Tram, bus, vélo et marche — planifiez le trajet le plus rapide et le moins carboné.
            </p>
          </div>

          <p className="text-xs text-neutral-400">
            Installable sur votre écran d&apos;accueil (PWA)
          </p>
        </div>
      </aside>

      {/* Panneau droit — formulaire */}
      <main className="flex flex-col items-center justify-center min-h-screen px-5 py-10 sm:px-8 bg-white lg:bg-neutral-50/40">
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden flex justify-center mb-8">
            <Link href="/welcome">
              <Logo withText className="h-8 w-auto" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-100 shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-7 sm:p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
