import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "../(auth)/actions";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const initials = user.email?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <div className="min-h-screen flex bg-off-white">
      {/* Sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 bg-anthracite text-white">
        <div className="px-6 py-6 border-b border-white/10">
          <Link href="/plan" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-mobility-green flex items-center justify-center font-bold text-lg">
              U
            </div>
            <span className="text-xl font-semibold">UrbanFlow</span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavLink href="/plan" icon="🗺️" label="Planificateur" />
          <NavLink href="/history" icon="📍" label="Trajets sauvegardés" />
          <NavLink href="/carbon" icon="🌱" label="Empreinte carbone" />
          <NavLink href="/profile" icon="⚙️" label="Préférences" />
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-mobility-green flex items-center justify-center text-sm font-semibold">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.email}</p>
              <p className="text-xs text-white/50">Utilisateur</p>
            </div>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="w-full text-sm text-white/70 hover:text-action-orange transition text-left"
            >
              Déconnexion
            </button>
          </form>
        </div>
      </aside>

      {/* Header mobile */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-anthracite text-white px-4 py-3 flex items-center justify-between">
        <Link href="/plan" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-mobility-green flex items-center justify-center font-bold">
            U
          </div>
          <span className="font-semibold">UrbanFlow</span>
        </Link>
        <form action={logout}>
          <button type="submit" className="text-sm text-white/70">
            Déconnexion
          </button>
        </form>
      </header>

      {/* Nav mobile en bas */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-200 flex justify-around py-2">
        <MobileNavLink href="/plan" icon="🗺️" label="Planif." />
        <MobileNavLink href="/history" icon="📍" label="Trajets" />
        <MobileNavLink href="/carbon" icon="🌱" label="Impact" />
        <MobileNavLink href="/profile" icon="⚙️" label="Profil" />
      </nav>

      {/* Contenu principal */}
      <main className="flex-1 md:ml-0 pt-14 pb-16 md:pt-0 md:pb-0 min-h-0">
        {children}
      </main>
    </div>
  );
}

function NavLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-md text-white/80 hover:bg-white/10 hover:text-white transition text-sm"
    >
      <span className="text-base">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

function MobileNavLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-0.5 px-3 py-1 text-neutral-600 hover:text-mobility-green text-xs"
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
