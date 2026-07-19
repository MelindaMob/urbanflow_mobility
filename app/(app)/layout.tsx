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

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <header className="bg-white border-b border-neutral-200 shrink-0">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/plan"
            className="text-xl font-semibold text-mobility-green"
          >
            UrbanFlow
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/plan" className="hover:text-mobility-green transition">
              Planificateur
            </Link>
            <Link
              href="/history"
              className="hover:text-mobility-green transition"
            >
              Historique
            </Link>
            <Link
              href="/carbon"
              className="hover:text-mobility-green transition"
            >
              Empreinte
            </Link>
            <Link
              href="/profile"
              className="hover:text-mobility-green transition"
            >
              Profil
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <span className="text-sm text-neutral-500 hidden sm:inline">
              {user.email}
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="text-sm text-neutral-600 hover:text-action-orange transition"
              >
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0">{children}</main>
    </div>
  );
}
