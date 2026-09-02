import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Email invalide.");
export const passwordSchema = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères.");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Mot de passe requis."),
});

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const coordSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const planTripSchema = z.object({
  origin: coordSchema,
  destination: coordSchema,
});

export const geocodeSchema = z.object({
  query: z.string().trim().min(3).max(200),
});
