"use client";

import { useState } from "react";
import Link from "next/link";
import { login } from "../actions";

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
    <div className="bg-white rounded-lg border border-neutral-200 p-6">
      <h2 className="text-xl font-semibold mb-6">Connexion</h2>

      <form action={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium mb-1"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mobility-green"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium mb-1"
          >
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mobility-green"
          />
        </div>

        {error && (
          <p className="text-sm text-action-orange" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-mobility-green text-white font-medium py-2 rounded-md hover:opacity-90 disabled:opacity-50 transition"
        >
          {isPending ? "Connexion..." : "Se connecter"}
        </button>
      </form>

      <p className="text-sm text-center mt-6 text-neutral-600">
        Pas encore de compte ?{" "}
        <Link
          href="/signup"
          className="text-mobility-green font-medium hover:underline"
        >
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
