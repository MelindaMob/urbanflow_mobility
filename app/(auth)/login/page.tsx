"use client";

import { useState } from "react";
import Link from "next/link";
import { login } from "../actions";
import AuthField from "@/components/auth/AuthField";
import AuthDivider from "@/components/auth/AuthDivider";
import GoogleIcon from "@/components/auth/GoogleIcon";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    setError(null);
    const result = await login(formData);
    if (result?.error) {
      setError(result.error);
      setIsPending(false);
    }
  }

  return (
    <div>
      <div className="mb-7">
        <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.15em] text-mobility-green mb-3">
          Connexion
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-anthracite">
          Bon retour
        </h1>
        <p className="text-sm text-neutral-500 mt-1.5 leading-relaxed">
          Reprenez vos trajets là où vous les avez laissés.
        </p>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <AuthField
          id="email"
          name="email"
          label="Email"
          type="email"
          placeholder="marie.dupont@email.fr"
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
          autoComplete="current-password"
        />

        <div className="flex items-center justify-between text-sm pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none text-neutral-600">
            <input
              type="checkbox"
              name="remember"
              className="w-4 h-4 rounded border-neutral-300 text-mobility-green focus:ring-mobility-green/30"
            />
            Se souvenir de moi
          </label>
          <button type="button" className="text-neutral-500 hover:text-flow-blue transition">
            Mot de passe oublié ?
          </button>
        </div>

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
          {isPending ? "Connexion en cours..." : "Se connecter"}
        </button>
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
          Pas encore de compte ?{" "}
          <Link href="/signup" className="font-semibold text-mobility-green hover:underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
