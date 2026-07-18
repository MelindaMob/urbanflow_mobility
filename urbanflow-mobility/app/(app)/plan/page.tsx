"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import AddressInput from "@/components/plan/AddressInput";
import type { Coord, GeocodedPlace } from "@/types/mobility";

// MapLibre nécessite l'objet window, donc chargement client-only
const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
      <p className="text-neutral-500 text-sm">Chargement de la carte...</p>
    </div>
  ),
});

export default function PlanPage() {
  const [origin, setOrigin] = useState<GeocodedPlace | null>(null);
  const [destination, setDestination] = useState<GeocodedPlace | null>(null);
  const [userLocation, setUserLocation] = useState<Coord | null>(null);
  const [geolocError, setGeolocError] = useState<string | null>(null);
  const [hasAskedGeolocation, setHasAskedGeolocation] = useState(false);

  // Demande de géolocalisation au chargement, avec consentement implicite du navigateur
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeolocError(
        "La géolocalisation n'est pas disponible sur ce navigateur."
      );
      setHasAskedGeolocation(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coord: Coord = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(coord);
        setHasAskedGeolocation(true);

        // Pré-remplir l'origine avec "Ma position"
        if (!origin) {
          setOrigin({
            label: "Ma position",
            coord,
          });
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setGeolocError(
            "Géolocalisation refusée. Saisissez le point de départ manuellement."
          );
        } else {
          setGeolocError("Impossible de déterminer votre position.");
        }
        setHasAskedGeolocation(true);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-[calc(100vh-57px)] flex flex-col md:flex-row">
      {/* Panneau de saisie */}
      <aside className="w-full md:w-96 bg-white border-b md:border-b-0 md:border-r border-neutral-200 p-6 overflow-y-auto">
        <h1 className="text-xl font-semibold mb-1">Où allez-vous ?</h1>
        <p className="text-sm text-neutral-500 mb-6">
          Trouvez le meilleur itinéraire multimodal
        </p>

        <div className="space-y-4">
          <AddressInput
            id="origin"
            label="Départ"
            placeholder="Adresse ou lieu"
            value={origin}
            onChange={setOrigin}
            colorAccent="green"
          />

          <AddressInput
            id="destination"
            label="Arrivée"
            placeholder="Adresse ou lieu"
            value={destination}
            onChange={setDestination}
            colorAccent="orange"
          />
        </div>

        {geolocError && (
          <p
            role="status"
            className="mt-4 text-xs text-neutral-600 bg-neutral-100 p-2 rounded"
          >
            {geolocError}
          </p>
        )}

        <button
          type="button"
          disabled={!origin || !destination}
          className="mt-6 w-full bg-action-orange text-white font-medium py-2.5 rounded-md hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Rechercher un itinéraire
        </button>
        <p className="mt-2 text-xs text-neutral-500 text-center">
          Le calcul multimodal sera disponible au prochain sprint.
        </p>
      </aside>

      {/* Carte */}
      <section className="flex-1 relative" aria-label="Carte">
        {hasAskedGeolocation && (
          <MapView
            origin={origin?.coord ?? null}
            destination={destination?.coord ?? null}
            userLocation={userLocation}
          />
        )}
      </section>
    </div>
  );
}
