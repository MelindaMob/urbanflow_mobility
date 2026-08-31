"use client";

import {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
} from "react";
import { createPortal } from "react-dom";
import { geocodeAddress } from "@/app/(app)/plan/actions";
import type { GeocodedPlace } from "@/types/mobility";

export type AddressInputHandle = {
  resolve: () => Promise<GeocodedPlace | null>;
};

type AddressInputProps = {
  label: string;
  placeholder?: string;
  value: GeocodedPlace | null;
  onChange: (place: GeocodedPlace | null) => void;
  onDraftChange?: (hasDraft: boolean) => void;
  colorAccent?: "green" | "orange";
  id: string;
};

const AddressInput = forwardRef<AddressInputHandle, AddressInputProps>(
  function AddressInput(
    { label, placeholder, value, onChange, onDraftChange, colorAccent = "green", id },
    ref
  ) {
    const [query, setQuery] = useState(value?.label ?? "");
    const [suggestions, setSuggestions] = useState<GeocodedPlace[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const [dropdownRect, setDropdownRect] = useState<{
      top: number;
      left: number;
      width: number;
    } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLUListElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const requestIdRef = useRef(0);
    const lastExternalLabel = useRef(value?.label ?? "");
    const suggestionsRef = useRef<GeocodedPlace[]>([]);
    const valueRef = useRef(value);
    const queryRef = useRef(query);

    valueRef.current = value;
    queryRef.current = query;
    suggestionsRef.current = suggestions;

    const accentColor =
      colorAccent === "green" ? "bg-mobility-green" : "bg-action-orange";
    const ringColor =
      colorAccent === "green"
        ? "focus:ring-mobility-green"
        : "focus:ring-action-orange";

    function applySelection(place: GeocodedPlace) {
      onChange(place);
      setQuery(place.label);
      lastExternalLabel.current = place.label;
      setIsOpen(false);
      setSuggestions([]);
      setError(null);
      onDraftChange?.(false);
    }

    async function resolve(): Promise<GeocodedPlace | null> {
      const trimmed = queryRef.current.trim();
      if (!trimmed || trimmed.length < 2) return null;

      const current = valueRef.current;
      if (current && trimmed === current.label) return current;

      const pending = suggestionsRef.current;
      if (pending.length > 0) {
        applySelection(pending[0]);
        return pending[0];
      }

      const result = await geocodeAddress(trimmed);
      if (result.places.length > 0) {
        applySelection(result.places[0]);
        return result.places[0];
      }

      setError(result.error ?? "Aucun résultat");
      return null;
    }

    useImperativeHandle(ref, () => ({ resolve }), []);

    useEffect(() => {
      setMounted(true);
    }, []);

    const showDropdown =
      isOpen &&
      query.trim().length >= 2 &&
      query.trim() !== value?.label &&
      (isLoading || suggestions.length > 0 || !!error);

    useLayoutEffect(() => {
      if (!showDropdown || !inputRef.current) {
        setDropdownRect(null);
        return;
      }

      function updateRect() {
        const input = inputRef.current;
        if (!input) return;
        const rect = input.getBoundingClientRect();
        setDropdownRect({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width,
        });
      }

      updateRect();
      window.addEventListener("resize", updateRect);
      window.addEventListener("scroll", updateRect, true);
      return () => {
        window.removeEventListener("resize", updateRect);
        window.removeEventListener("scroll", updateRect, true);
      };
    }, [showDropdown, suggestions.length, isLoading, error, query]);

    // Sync uniquement quand une vraie valeur externe arrive (géoloc / sélection)
    useEffect(() => {
      const externalLabel = value?.label ?? "";
      if (externalLabel === lastExternalLabel.current) return;
      lastExternalLabel.current = externalLabel;
      if (externalLabel) {
        setQuery(externalLabel);
        setSuggestions([]);
        setError(null);
        setIsOpen(false);
      }
    }, [value?.label]);

    // Debounce du géocodage — suggestions continues à la saisie
    useEffect(() => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      const trimmed = query.trim();
      if (!trimmed || trimmed.length < 2 || trimmed === value?.label) {
        if (trimmed.length < 2) {
          setSuggestions([]);
          setError(null);
          setIsLoading(false);
        }
        return;
      }

      debounceRef.current = setTimeout(async () => {
        const requestId = ++requestIdRef.current;
        setIsLoading(true);
        setIsOpen(true);
        setError(null);

        const result = await geocodeAddress(trimmed);

        if (requestId !== requestIdRef.current) return;

        setSuggestions(result.places);
        setError(
          result.error ?? (result.places.length === 0 ? "Aucun résultat" : null)
        );
        setIsLoading(false);
        setIsOpen(true);
      }, 180);

      return () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
      };
    }, [query, value?.label]);

    useEffect(() => {
      function handleClickOutside(e: MouseEvent) {
        const target = e.target as Node;
        if (containerRef.current?.contains(target)) return;
        if (dropdownRef.current?.contains(target)) return;
        setIsOpen(false);
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    function handleSelect(place: GeocodedPlace) {
      applySelection(place);
    }

    const dropdown =
      showDropdown && dropdownRect ? (
        <ul
          ref={dropdownRef}
          role="listbox"
          style={{
            position: "fixed",
            top: dropdownRect.top,
            left: dropdownRect.left,
            width: dropdownRect.width,
            zIndex: 9999,
          }}
          className="max-h-64 overflow-auto rounded-lg border border-neutral-200 bg-white shadow-xl flex flex-col"
        >
          {isLoading && (
            <li className="block px-3 py-2.5 text-sm text-neutral-500">
              Recherche...
            </li>
          )}
          {!isLoading && error && suggestions.length === 0 && (
            <li className="block px-3 py-2.5 text-sm text-neutral-500">
              {error}
            </li>
          )}
          {!isLoading &&
            suggestions.map((place, idx) => (
              <li
                key={`${place.label}-${idx}`}
                role="option"
                aria-selected="false"
                className="block border-b border-neutral-100 last:border-b-0"
              >
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(place);
                  }}
                  className="block w-full text-left px-3 py-2.5 text-sm hover:bg-neutral-100 focus:bg-neutral-100 focus:outline-none"
                >
                  {place.label}
                </button>
              </li>
            ))}
        </ul>
      ) : null;

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
          ref={inputRef}
          id={id}
          type="text"
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            const next = e.target.value;
            setQuery(next);
            setIsOpen(true);
            setError(null);
            if (value) onChange(null);
            onDraftChange?.(next.trim().length >= 2);
            if (!next || next.trim().length < 2) {
              setSuggestions([]);
            }
          }}
          onFocus={() => {
            if (query.trim().length >= 2 && query.trim() !== value?.label) {
              setIsOpen(true);
            }
          }}
          onBlur={() => {
            const trimmed = queryRef.current.trim();
            if (
              trimmed.length >= 2 &&
              trimmed !== valueRef.current?.label
            ) {
              void resolve();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (suggestionsRef.current.length > 0) {
                handleSelect(suggestionsRef.current[0]);
              } else {
                void resolve();
              }
            }
          }}
          autoComplete="off"
          className={`w-full px-3 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 ${ringColor}`}
        />

        {mounted && dropdown ? createPortal(dropdown, document.body) : null}
      </div>
    );
  }
);

export default AddressInput;
