"use client";

import { useState } from "react";
import { updatePassword } from "../actions";
import AuthField from "@/components/auth/AuthField";

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    setError(null);
    const result = await updatePassword(formData);
    if (result?.error) {
      setError(result.error);
      setIsPending(false);
    }
  }

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight text-anthracite">
          Nouveau mot de passe
        </h1>
        <p className="text-sm text-neutral-500 mt-1.5">
          Choisissez un nouveau mot de passe.
        </p>
      </div>
      <form action={handleSubmit} className="space-y-4">
        <AuthField
          id="password"
          name="password"
          label="Nouveau mot de passe"
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
            className="text-sm text-action-orange-text bg-orange-50 border border-orange-100 px-3.5 py-2.5 rounded-xl"
          >
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-mobility-green text-white font-semibold py-3.5 rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-all mt-2"
        >
          {isPending ? "Mise à jour..." : "Réinitialiser"}
        </button>
      </form>
    </div>
  );
}
