"use client";

import { useState } from "react";
import Link from "next/link";
import { signup } from "../actions";
import AuthField from "@/components/auth/AuthField";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

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
      <div className="mb-8">
        <h2 className="text-[1.65rem] font-bold tracking-tight leading-tight">
          Créer un compte
        </h2>
        <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
          Rejoignez UrbanFlow et réduisez l&apos;empreinte carbone de vos déplacements.
        </p>
      </div>

      <form action={handleSubmit} className="space-y-5">
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
          hint="Au moins 8 caractères"
        />

        {error && (
          <div
            role="alert"
            className="text-sm text-action-orange bg-orange-50 border border-orange-100 px-3 py-2.5 rounded-xl"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-mobility-green text-white font-semibold py-3.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition shadow-sm"
        >
          {isPending ? "Création..." : "Créer mon compte"}
        </button>

        <p className="text-xs text-neutral-500 text-center leading-relaxed">
          En créant un compte, vous acceptez le traitement de vos données conformément à notre politique RGPD.
        </p>
      </form>

      <div className="relative my-7">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white md:bg-off-white px-3 text-xs text-neutral-400 uppercase tracking-wide">
            ou continuer avec
          </span>
        </div>
      </div>

      <button
        type="button"
        disabled
        title="Connexion Google bientôt disponible"
        className="w-full flex items-center justify-center gap-3 bg-white border border-neutral-200 rounded-xl py-3 text-sm font-medium text-neutral-700 opacity-60 cursor-not-allowed"
      >
        <GoogleIcon />
        Google
      </button>

      <p className="mt-8 text-center text-sm text-neutral-600">
        Déjà un compte ?{" "}
        <Link href="/login" className="text-mobility-green font-semibold hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
