"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  emailSchema,
  loginSchema,
  passwordSchema,
  signupSchema,
} from "@/lib/validation";

export async function login(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Email ou mot de passe invalide." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "Identifiants incorrects." };
  }
  redirect("/plan");
}

export async function signup(formData: FormData) {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp(parsed.data);

  if (error) {
    if (error.message.includes("already registered")) {
      return { error: "Un compte existe déjà avec cet email." };
    }
    console.error("Signup error:", error.message);
    return { error: "Impossible de créer le compte. Réessayez." };
  }
  redirect("/plan");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(formData: FormData) {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { error: "Email invalide." };
  }

  const supabase = await createClient();
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://urbanflow-mobility-bordeaux.vercel.app";

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    console.error("Password reset error:", error.message);
    return { error: "Impossible d'envoyer l'email de réinitialisation." };
  }
  return { success: true };
}

export async function updatePassword(formData: FormData) {
  const parsed = passwordSchema.safeParse(formData.get("password"));
  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        "Le mot de passe doit contenir au moins 8 caractères.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) {
    console.error("Update password error:", error.message);
    return { error: "Impossible de mettre à jour le mot de passe." };
  }
  redirect("/plan");
}
