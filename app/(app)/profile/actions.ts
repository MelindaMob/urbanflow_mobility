"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const AVAILABLE_MODES = ["foot", "bike", "tram", "bus", "car", "scooter"];

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non authentifié." };
  }

  // Extraction et validation
  const walkingSpeed = parseFloat(formData.get("walking_speed_kmh") as string);
  const hasPersonalBike = formData.get("has_personal_bike") === "on";
  const reducedMobility = formData.get("reduced_mobility") === "on";
  const preferredSort = formData.get("preferred_sort") as string;

  const acceptedModes = AVAILABLE_MODES.filter(
    (mode) => formData.get(`mode_${mode}`) === "on"
  );

  // Validations
  if (isNaN(walkingSpeed) || walkingSpeed < 1 || walkingSpeed > 10) {
    return {
      error: "La vitesse de marche doit être comprise entre 1 et 10 km/h.",
    };
  }

  if (acceptedModes.length === 0) {
    return { error: "Sélectionnez au moins un mode de transport." };
  }

  if (!["duration", "carbon"].includes(preferredSort)) {
    return { error: "Tri préféré invalide." };
  }

  // Mise à jour
  const { error } = await supabase
    .from("profiles")
    .update({
      walking_speed_kmh: walkingSpeed,
      accepted_modes: acceptedModes,
      has_personal_bike: hasPersonalBike,
      reduced_mobility: reducedMobility,
      preferred_sort: preferredSort,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) {
    return { error: "Impossible de mettre à jour le profil." };
  }

  revalidatePath("/profile");
  return { success: true };
}
