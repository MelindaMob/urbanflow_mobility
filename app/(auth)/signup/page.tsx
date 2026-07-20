"use client";

import { useState } from "react";
import Link from "next/link";
import { signup } from "../actions";
import AuthField from "@/components/auth/AuthField";
import AuthDivider from "@/components/auth/AuthDivider";
import GoogleIcon from "@/components/auth/GoogleIcon";

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    setError(null);
    const result = await signup(formData);
    if (result?.error) {
      setError(result.error);
      setIsPending(false);
    }
  }

  return (
    <div>
      <div className="mb-7">
        <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.15em] text-mobility-green mb-3">
          Inscription
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-anthracite">
          Créer un compte
        </h1>
        <p className="text-sm text-neutral-500 mt-1.5 leading-relaxed">
          Rejoignez UrbanFlow et suivez l&apos;impact de vos déplacements.
        </p>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <AuthField
          id="email"
          name="email"
          label="Email"
          type="email"
          placeholder="votre@email.fr"
          required
          autoComplete="email"
        />

        <AuthField
          id="password"
          name="password"
          label="Mot de passe"
          type="password"
          placeholder="••••••••"
          required
          minLength={8}
          autoComplete="new-password"
          hint="Minimum 8 caractères"
        />

        {error && (
          <div
            role="alert"
            className="text-sm text-action-orange bg-orange-50 border border-orange-100 px-3.5 py-2.5 rounded-xl"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-mobility-green text-white font-semibold py-3.5 rounded-xl hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50 transition-all shadow-sm shadow-mobility-green/20 mt-2"
        >
          {isPending ? "Création en cours..." : "Créer mon compte"}
        </button>

        <p className="text-[11px] text-neutral-400 text-center leading-relaxed pt-1">
          En vous inscrivant, vous acceptez le traitement de vos données conformément au RGPD.
        </p>
      </form>

      <AuthDivider />

      <button
        type="button"
        disabled
        title="Connexion Google bientôt disponible"
        className="w-full flex items-center justify-center gap-2.5 border border-neutral-200 rounded-xl py-3 text-sm font-medium text-neutral-500 bg-neutral-50 cursor-not-allowed"
      >
        <GoogleIcon />
        Continuer avec Google
      </button>

      <div className="mt-7 pt-6 border-t border-neutral-100 text-center">
        <p className="text-sm text-neutral-600">
          Déjà un compte ?{" "}
          <Link href="/login" className="font-semibold text-mobility-green hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
