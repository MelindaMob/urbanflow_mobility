"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "../actions";
import AuthField from "@/components/auth/AuthField";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    setError(null);
    const result = await requestPasswordReset(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setSent(true);
    }
    setIsPending(false);
  }

  if (sent) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-anthracite mb-2">
          Email envoyé
        </h1>
        <p className="text-sm text-neutral-500 leading-relaxed">
          Si un compte existe avec cette adresse, vous recevrez un lien pour
          réinitialiser votre mot de passe.
        </p>
        <Link
          href="/login"
          className="inline-block mt-6 text-sm font-semibold text-mobility-green hover:underline"
        >
          Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight text-anthracite">
          Mot de passe oublié
        </h1>
        <p className="text-sm text-neutral-500 mt-1.5 leading-relaxed">
          Entrez votre email, on vous envoie un lien de réinitialisation.
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
          className="w-full bg-mobility-green text-white font-semibold py-3.5 rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-all mt-2"
        >
          {isPending ? "Envoi..." : "Envoyer le lien"}
        </button>
      </form>
      <div className="mt-7 pt-6 border-t border-neutral-100 text-center">
        <Link
          href="/login"
          className="text-sm font-semibold text-mobility-green hover:underline"
        >
          Retour à la connexion
        </Link>
      </div>
    </div>
  );
}
