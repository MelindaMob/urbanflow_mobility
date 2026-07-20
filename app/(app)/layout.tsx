import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "../(auth)/actions";
import SidebarNav from "@/components/layout/SidebarNav";
import Logo from "@/components/ui/Logo";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const initials = user.email?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <div className="min-h-screen flex bg-off-white">
      {/* Sidebar desktop — style clair, cartes */}
      <aside className="hidden md:flex md:flex-col w-72 shrink-0 bg-white border-r border-neutral-200 relative overflow-hidden">
        {/* Accent vertical dégradé */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-mobility-green via-flow-blue to-action-orange"
          aria-hidden="true"
        />

        {/* Courbe décorative bas-gauche */}
        <svg
          className="absolute -bottom-16 -left-8 w-64 h-64 text-mobility-green/5 pointer-events-none"
          viewBox="0 0 200 200"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M-20 120 Q 60 40, 140 100 T 260 80"
            stroke="currentColor"
            strokeWidth="24"
            strokeLinecap="round"
          />
        </svg>

        <div className="relative px-6 pt-8 pb-6">
          <Link href="/plan" className="block">
            <Logo withText className="h-8 w-auto" />
          </Link>
        </div>

        <SidebarNav />

        <div className="relative p-4 mt-auto">
          <div className="rounded-2xl bg-anthracite text-white p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-mobility-green to-flow-blue flex items-center justify-center text-sm font-bold shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/50 mb-0.5">Connecté</p>
                <p className="text-sm font-medium truncate">{user.email}</p>
              </div>
            </div>
            <form action={logout} className="mt-4 pt-3 border-t border-white/10">
              <button
                type="submit"
                className="w-full text-left text-xs text-white/60 hover:text-action-orange transition"
              >
                Se déconnecter →
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Header mobile */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
        <Link href="/plan">
          <Logo withText className="h-7 w-auto" />
        </Link>
        <form action={logout}>
          <button type="submit" className="text-xs text-neutral-500 hover:text-action-orange">
            Déconnexion
          </button>
        </form>
      </header>

      {/* Nav mobile en bas */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-200 flex justify-around py-2.5 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
        <MobileNavLink href="/plan" label="Planif." />
        <MobileNavLink href="/history" label="Trajets" />
        <MobileNavLink href="/carbon" label="Impact" />
        <MobileNavLink href="/profile" label="Profil" />
      </nav>

      <main className="flex-1 pt-14 pb-16 md:pt-0 md:pb-0 min-h-0">
        {children}
      </main>
    </div>
  );
}

function MobileNavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="px-4 py-1 text-neutral-500 hover:text-mobility-green text-xs font-semibold transition-colors"
    >
      {label}
    </Link>
  );
}
