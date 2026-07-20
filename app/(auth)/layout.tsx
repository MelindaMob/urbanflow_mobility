import Link from "next/link";
import Logo from "@/components/ui/Logo";
import AuthIllustration from "@/components/auth/AuthIllustration";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-neutral-50 md:bg-off-white">
      {/* Panneau gauche — desktop */}
      <div className="hidden md:flex md:w-5/12 lg:w-[45%] bg-white border-r border-neutral-100 relative overflow-hidden">
        <div className="relative flex flex-col justify-between p-12 lg:p-16 w-full">
          <Logo withText className="h-9 w-auto" />

          <div className="flex flex-col items-center py-8">
            <AuthIllustration className="w-full max-w-sm h-auto mb-10" />
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-center leading-tight mb-4">
              Tous vos trajets,
              <br />
              en un seul geste.
            </h1>
            <p className="text-sm text-neutral-500 text-center leading-relaxed max-w-sm">
              Métro, tram, bus, trottinette et marche : UrbanFlow combine toutes les mobilités de Bordeaux en temps réel.
            </p>
          </div>

          <p className="text-xs text-neutral-400 text-center">
            Installable sur votre écran d&apos;accueil (PWA)
          </p>
        </div>
      </div>

      {/* Panneau droit — formulaire */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 sm:px-8 md:px-12">
        <div className="w-full max-w-[400px] bg-white md:bg-transparent rounded-2xl md:rounded-none p-6 sm:p-8 md:p-0 shadow-sm md:shadow-none border border-neutral-100 md:border-0">
          {children}
        </div>
      </div>
    </div>
  );
}
