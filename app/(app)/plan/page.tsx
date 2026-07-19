"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import AddressInput from "@/components/plan/AddressInput";
import ItineraryCard from "@/components/plan/ItineraryCard";
import { planTrip, getTransitStops, saveTrip } from "./actions";
import type {
  Coord,
  GeocodedPlace,
  Itinerary,
  TransitStop,
} from "@/types/mobility";

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

  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [selectedItineraryId, setSelectedItineraryId] = useState<string | null>(
    null
  );
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [transitStops, setTransitStops] = useState<TransitStop[]>([]);
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Géolocalisation
  useEffect(() => {
    if (!navigator.geolocation) {
      const timer = setTimeout(() => {
        setGeolocError("La géolocalisation n'est pas disponible.");
        setHasAskedGeolocation(true);
      }, 0);
      return () => clearTimeout(timer);
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coord = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(coord);
        setHasAskedGeolocation(true);
        setOrigin((prev) => prev ?? { label: "Ma position", coord });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setGeolocError("Saisissez le point de départ manuellement.");
        }
        setHasAskedGeolocation(true);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // Charger les arrêts TBM au montage
  useEffect(() => {
    getTransitStops().then(setTransitStops);
  }, []);

  async function handleSearch() {
    if (!origin || !destination) return;
    setIsSearching(true);
    setSearchError(null);
    setItineraries([]);
    setSelectedItineraryId(null);

    const result = await planTrip(origin.coord, destination.coord);

    if (result.error) {
      setSearchError(result.error);
    } else {
      setItineraries(result.itineraries);
      if (result.itineraries.length > 0) {
        setSelectedItineraryId(result.itineraries[0].id);
      }
    }
    setIsSearching(false);
  }

  async function handleSave() {
    if (!origin || !destination || !selectedItinerary) return;
    setSaveMessage(null);
    const result = await saveTrip(origin, destination, selectedItinerary);
    if (result.error) {
      setSaveMessage({ type: "error", text: result.error });
    } else {
      setSaveMessage({
        type: "success",
        text: "Trajet sauvegardé dans votre historique.",
      });
    }
  }

  const selectedItinerary =
    itineraries.find((it) => it.id === selectedItineraryId) ?? null;

  return (
    <div className="h-[calc(100vh-57px)] flex flex-col md:flex-row overflow-hidden">
      <aside className="w-full md:w-[420px] shrink-0 bg-white border-b md:border-b-0 md:border-r border-neutral-200 p-6 overflow-y-auto">
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
          onClick={handleSearch}
          disabled={!origin || !destination || isSearching}
          className="mt-6 w-full bg-action-orange text-white font-medium py-2.5 rounded-md hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {isSearching ? "Recherche..." : "Rechercher un itinéraire"}
        </button>

        {searchError && (
          <p
            role="alert"
            className="mt-4 text-sm text-action-orange bg-orange-50 p-3 rounded"
          >
            {searchError}
          </p>
        )}

        {/* Résultats */}
        {itineraries.length > 0 && (
          <div className="mt-6 space-y-3">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
              Itinéraires suggérés
            </p>
            {itineraries.map((it, idx) => (
              <ItineraryCard
                key={it.id}
                itinerary={it}
                isSelected={selectedItineraryId === it.id}
                onSelect={() => setSelectedItineraryId(it.id)}
                isRecommended={idx === 0}
              />
            ))}
          </div>
        )}

        {selectedItinerary && (
          <div className="mt-4">
            <button
              type="button"
              onClick={handleSave}
              className="w-full border border-mobility-green text-mobility-green font-medium py-2 rounded-md hover:bg-green-50 transition"
            >
              Sauvegarder ce trajet
            </button>
            {saveMessage && (
              <p
                role="status"
                className={`mt-2 text-sm ${
                  saveMessage.type === "success"
                    ? "text-mobility-green"
                    : "text-action-orange"
                }`}
              >
                {saveMessage.text}
              </p>
            )}
          </div>
        )}
      </aside>

      <section className="flex-1 min-h-0 min-w-0 relative" aria-label="Carte">
        {hasAskedGeolocation && (
          <MapView
            origin={origin?.coord ?? null}
            destination={destination?.coord ?? null}
            userLocation={userLocation}
            itinerary={selectedItinerary}
            transitStops={transitStops}
          />
        )}
      </section>
    </div>
  );
}
