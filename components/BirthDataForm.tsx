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
}: {
  onSubmit: (birth: BirthData) => void;
  loading: boolean;
  error?: string | null;
  initialDate?: string;
  initialTime?: string;
  initialPlace?: string;
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
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-md space-y-6">
      <div>
        <label className="mb-1 block text-sm text-muted">Name (optional)</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full rounded border border-white/15 bg-surface px-4 py-2 text-ink outline-none focus:border-gold"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm text-muted">Date of birth</label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded border border-white/15 bg-surface px-4 py-2 text-ink outline-none focus:border-gold [color-scheme:dark]"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Time of birth</label>
          <input
            type="time"
            required
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full rounded border border-white/15 bg-surface px-4 py-2 text-ink outline-none focus:border-gold [color-scheme:dark]"
          />
        </div>
      </div>

      <div className="relative">
        <label className="mb-1 block text-sm text-muted">Place of birth</label>
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
          className="w-full rounded border border-white/15 bg-surface px-4 py-2 text-ink outline-none focus:border-gold"
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full rounded border border-white/15 bg-surface shadow-lg">
            {suggestions.map((city) => (
              <li key={`${city.name}-${city.latitude}-${city.longitude}`}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCity(city);
                    setPlaceQuery(city.name);
                    setShowSuggestions(false);
                  }}
                  className="block w-full px-4 py-2 text-left text-sm hover:bg-gold/10 hover:text-gold"
                >
                  {city.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded bg-gold px-6 py-3 font-medium text-background transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? "Calculating…" : "Calculate my chart"}
      </button>
    </form>
  );
}
