import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-white">
      <p className="text-sm font-semibold text-mobility-green uppercase tracking-wide mb-3">
        Erreur 404
      </p>
      <h1 className="text-3xl font-bold text-anthracite mb-3">
        Vous êtes perdu(e) ?
      </h1>
      <p className="text-neutral-500 mb-8 max-w-sm">
        Cette page n&apos;existe pas. Retournez au planificateur pour trouver
        votre chemin.
      </p>
      <Link
        href="/plan"
        className="bg-mobility-green text-white font-semibold px-6 py-3 rounded-xl hover:bg-emerald-700 transition"
      >
        Retour au planificateur
      </Link>
    </div>
  );
}
