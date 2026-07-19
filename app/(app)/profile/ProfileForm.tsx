"use client";

import { useState } from "react";
import { updateProfile } from "./actions";

type Profile = {
  walking_speed_kmh: number;
  accepted_modes: string[];
  has_personal_bike: boolean;
  reduced_mobility: boolean;
  preferred_sort: string;
};

const MODES = [
  { key: "foot", label: "Marche" },
  { key: "bike", label: "Vélo" },
  { key: "tram", label: "Tram" },
  { key: "bus", label: "Bus" },
  { key: "car", label: "Voiture" },
  { key: "scooter", label: "Trottinette" },
];

export default function ProfileForm({ profile }: { profile: Profile }) {
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    setMessage(null);
    const result = await updateProfile(formData);
    if (result?.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({ type: "success", text: "Profil mis à jour." });
    }
    setIsPending(false);
  }

  return (
    <form
      action={handleSubmit}
      className="bg-white rounded-lg border border-neutral-200 p-6 space-y-6"
    >
      {/* Vitesse de marche */}
      <div>
        <label
          htmlFor="walking_speed_kmh"
          className="block text-sm font-medium mb-1"
        >
          Vitesse de marche (km/h)
        </label>
        <input
          id="walking_speed_kmh"
          name="walking_speed_kmh"
          type="number"
          step="0.1"
          min="1"
          max="10"
          defaultValue={profile.walking_speed_kmh}
          className="w-32 px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mobility-green"
        />
      </div>

      {/* Modes acceptés */}
      <fieldset>
        <legend className="text-sm font-medium mb-2">
          Modes de transport acceptés
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {MODES.map((mode) => (
            <label
              key={mode.key}
              className="flex items-center gap-2 text-sm cursor-pointer"
            >
              <input
                type="checkbox"
                name={`mode_${mode.key}`}
                defaultChecked={profile.accepted_modes?.includes(mode.key)}
                className="w-4 h-4 accent-mobility-green"
              />
              {mode.label}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Options */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            name="has_personal_bike"
            defaultChecked={profile.has_personal_bike}
            className="w-4 h-4 accent-mobility-green"
          />
          Je possède un vélo personnel
        </label>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            name="reduced_mobility"
            defaultChecked={profile.reduced_mobility}
            className="w-4 h-4 accent-mobility-green"
          />
          Mobilité réduite (exclut vélo/trottinette, filtre les lignes
          accessibles PMR)
        </label>
      </div>

      {/* Tri préféré */}
      <div>
        <label
          htmlFor="preferred_sort"
          className="block text-sm font-medium mb-1"
        >
          Tri des itinéraires par défaut
        </label>
        <select
          id="preferred_sort"
          name="preferred_sort"
          defaultValue={profile.preferred_sort}
          className="px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mobility-green"
        >
          <option value="duration">Durée</option>
          <option value="carbon">Empreinte carbone</option>
        </select>
      </div>

      {message && (
        <p
          role="alert"
          className={`text-sm ${
            message.type === "success"
              ? "text-mobility-green"
              : "text-action-orange"
          }`}
        >
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="bg-mobility-green text-white font-medium px-6 py-2 rounded-md hover:opacity-90 disabled:opacity-50 transition"
      >
        {isPending ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}
