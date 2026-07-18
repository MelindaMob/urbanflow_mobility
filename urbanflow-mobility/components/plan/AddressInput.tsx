"use client";

import { useState, useEffect, useRef } from "react";
import { geocodeAddress } from "@/app/(app)/plan/actions";
import type { GeocodedPlace } from "@/types/mobility";

type AddressInputProps = {
  label: string;
  placeholder?: string;
  value: GeocodedPlace | null;
  onChange: (place: GeocodedPlace | null) => void;
  colorAccent?: "green" | "orange";
  id: string;
};

export default function AddressInput({
  label,
  placeholder,
  value,
  onChange,
  colorAccent = "green",
  id,
}: AddressInputProps) {
  const [query, setQuery] = useState(value?.label ?? "");
  const [suggestions, setSuggestions] = useState<GeocodedPlace[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const accentColor =
    colorAccent === "green" ? "bg-mobility-green" : "bg-action-orange";
  const ringColor =
    colorAccent === "green"
      ? "focus:ring-mobility-green"
      : "focus:ring-action-orange";

  // Sync query avec value externe (ex : géoloc auto)
  useEffect(() => {
    setQuery(value?.label ?? "");
  }, [value]);

  // Debounce du géocodage
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query || query.trim().length < 3 || query === value?.label) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      const result = await geocodeAddress(query);
      setSuggestions(result.places);
      setIsLoading(false);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, value?.label]);

  // Fermer les suggestions au clic extérieur
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(place: GeocodedPlace) {
    onChange(place);
    setQuery(place.label);
    setIsOpen(false);
    setSuggestions([]);
  }

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor={id} className="block text-sm font-medium mb-1">
        <span
          className={`inline-block w-2 h-2 rounded-full ${accentColor} mr-2`}
          aria-hidden="true"
        />
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={query}
        placeholder={placeholder}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
          if (!e.target.value) onChange(null);
        }}
        onFocus={() => setIsOpen(true)}
        autoComplete="off"
        className={`w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 ${ringColor}`}
      />

      {isOpen && (suggestions.length > 0 || isLoading) && (
        <ul
          role="listbox"
          className="absolute z-10 mt-1 w-full bg-white border border-neutral-200 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {isLoading && (
            <li className="px-3 py-2 text-sm text-neutral-500">
              Recherche...
            </li>
          )}
          {!isLoading &&
            suggestions.map((place, idx) => (
              <li key={idx} role="option" aria-selected="false">
                <button
                  type="button"
                  onClick={() => handleSelect(place)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 focus:bg-neutral-100 focus:outline-none"
                >
                  {place.label}
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
