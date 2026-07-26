"use client";

import { useEffect, useRef, useState } from "react";
import type { BirthData, CityResult } from "@/lib/types";
import { searchCities } from "@/lib/api";

export default function BirthDataForm({
  onSubmit,
  loading,
  error,
  initialDate,
  initialTime,
  initialPlace,
  title = "Cast your chart",
  submitLabel = "Calculate chart",
  helperText = "Free to start. Sign in to save your chart.",
}: {
  onSubmit: (birth: BirthData) => void;
  loading: boolean;
  error?: string | null;
  initialDate?: string;
  initialTime?: string;
  initialPlace?: string;
  title?: string;
  submitLabel?: string;
  helperText?: string;
}) {
  const [name, setName] = useState("");
  const [date, setDate] = useState(initialDate ?? "");
  const [time, setTime] = useState(initialTime ?? "");
  const [placeQuery, setPlaceQuery] = useState(initialPlace ?? "");
  const [selectedCity, setSelectedCity] = useState<CityResult | null>(null);
  const [suggestions, setSuggestions] = useState<CityResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (placeQuery.length < 2 || selectedCity?.name === placeQuery) {
      setSuggestions([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const { results } = await searchCities(placeQuery);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeQuery]);

  const canSubmit = Boolean(date && time && selectedCity) && !loading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCity) return;
    onSubmit({
      name: name.trim() || undefined,
      date,
      time,
      latitude: selectedCity.latitude,
      longitude: selectedCity.longitude,
      place_name: selectedCity.name,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-[380px] border border-ink bg-parchment-2 p-8 text-left">
      <div className="mb-5 border-b border-line pb-3.5 font-cinzel text-sm uppercase tracking-[0.1em] text-ink">
        {title}
      </div>

      <div className="mb-4">
        <label className="mb-1.5 block font-ebgaramond text-xs uppercase tracking-[0.08em] text-ink-2">
          Name (optional)
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full border border-line bg-parchment px-3 py-2.5 font-crimson text-[15px] text-ink outline-none placeholder:text-ink-2/50 focus:border-bronze-dark"
        />
      </div>

      <div className="mb-4">
        <label className="mb-1.5 block font-ebgaramond text-xs uppercase tracking-[0.08em] text-ink-2">
          Date of birth
        </label>
        <input
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full border border-line bg-parchment px-3 py-2.5 font-crimson text-[15px] text-ink outline-none [color-scheme:light] focus:border-bronze-dark"
        />
      </div>

      <div className="mb-4">
        <label className="mb-1.5 block font-ebgaramond text-xs uppercase tracking-[0.08em] text-ink-2">
          Time of birth
        </label>
        <input
          type="time"
          required
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="w-full border border-line bg-parchment px-3 py-2.5 font-crimson text-[15px] text-ink outline-none [color-scheme:light] focus:border-bronze-dark"
        />
      </div>

      <div className="relative mb-4">
        <label className="mb-1.5 block font-ebgaramond text-xs uppercase tracking-[0.08em] text-ink-2">
          Place of birth
        </label>
        <input
          value={placeQuery}
          onChange={(e) => {
            setPlaceQuery(e.target.value);
            setSelectedCity(null);
          }}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder="City, country"
          required
          className="w-full border border-line bg-parchment px-3 py-2.5 font-crimson text-[15px] text-ink outline-none placeholder:text-ink-2/50 focus:border-bronze-dark"
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full border border-line bg-parchment shadow-md">
            {suggestions.map((city) => (
              <li key={`${city.name}-${city.latitude}-${city.longitude}`}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCity(city);
                    setPlaceQuery(city.name);
                    setShowSuggestions(false);
                  }}
                  className="block w-full px-3 py-2 text-left font-crimson text-sm text-ink hover:bg-parchment-2 hover:text-bronze-dark"
                >
                  {city.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <p className="mb-3 font-crimson text-sm text-terracotta">{error}</p>}

      <button
        type="submit"
        disabled={!canSubmit}
        className="mt-2 w-full bg-ink py-3 font-cinzel text-[13px] uppercase tracking-[0.12em] text-parchment transition-colors hover:bg-ink-2 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? "Calculating…" : submitLabel}
      </button>
      <p className="mt-3.5 text-center font-ebgaramond text-[12.5px] italic text-ink-2">{helperText}</p>
    </form>
  );
}
