"use client";

import { useEffect, useRef, useState } from "react";
import type { BirthData, CityResult } from "@/lib/types";
import { searchCities } from "@/lib/api";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Splits an ISO "YYYY-MM-DD" string into its parts for the day/month/year
 * fields below, or blanks if there's nothing to prefill. */
function splitIsoDate(iso?: string): { year: string; month: string; day: string } {
  const m = iso?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return { year: "", month: "", day: "" };
  return { year: m[1], month: String(Number(m[2])), day: String(Number(m[3])) };
}

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
  const initialParts = splitIsoDate(initialDate);
  const [day, setDay] = useState(initialParts.day);
  const [month, setMonth] = useState(initialParts.month);
  const [year, setYear] = useState(initialParts.year);
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

  // Built from three explicitly-labeled fields (day/month name/year) rather
  // than a single locale-formatted text field: a native <input type="date">
  // displays in whatever order the browser's OS locale dictates (mm/dd/yyyy
  // on a US-locale browser regardless of the visitor's own country), so a
  // visitor expecting day-first entry can type a value that silently parses
  // as a different, wrong date instead of erroring. Spelling the month out
  // removes the ambiguity entirely.
  const dayNum = Number(day);
  const monthNum = Number(month);
  const yearNum = Number(year);
  const dateValid =
    day !== "" &&
    month !== "" &&
    year.length === 4 &&
    dayNum >= 1 &&
    dayNum <= 31 &&
    monthNum >= 1 &&
    monthNum <= 12 &&
    yearNum >= 1900 &&
    yearNum <= new Date().getFullYear();
  const date = dateValid ? `${year}-${pad2(monthNum)}-${pad2(dayNum)}` : "";

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
        <label className="mb-1.5 block font-cinzel text-xs font-medium uppercase tracking-[0.08em] text-ink-2">
          Name (optional)
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full border border-line bg-parchment px-3 py-2.5 font-cormorant text-[15px] text-ink outline-none placeholder:text-ink-2/50 focus:border-bronze-dark"
        />
      </div>

      <div className="mb-4">
        <label className="mb-1.5 block font-cinzel text-xs font-medium uppercase tracking-[0.08em] text-ink-2">
          Date of birth
        </label>
        <div className="grid grid-cols-[1fr_1.4fr_1fr] gap-2">
          <input
            type="number"
            inputMode="numeric"
            required
            min={1}
            max={31}
            placeholder="Day"
            aria-label="Day of birth"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className="w-full border border-line bg-parchment px-3 py-2.5 font-cormorant text-[15px] text-ink outline-none placeholder:text-ink-2/50 focus:border-bronze-dark"
          />
          <select
            required
            aria-label="Month of birth"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full border border-line bg-parchment px-2 py-2.5 font-cormorant text-[15px] text-ink outline-none focus:border-bronze-dark"
          >
            <option value="" disabled>
              Month
            </option>
            {MONTHS.map((label, i) => (
              <option key={label} value={i + 1}>
                {label}
              </option>
            ))}
          </select>
          <input
            type="number"
            inputMode="numeric"
            required
            min={1900}
            max={new Date().getFullYear()}
            placeholder="Year"
            aria-label="Year of birth"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="w-full border border-line bg-parchment px-3 py-2.5 font-cormorant text-[15px] text-ink outline-none placeholder:text-ink-2/50 focus:border-bronze-dark"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="mb-1.5 block font-cinzel text-xs font-medium uppercase tracking-[0.08em] text-ink-2">
          Time of birth
        </label>
        <input
          type="time"
          required
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="w-full border border-line bg-parchment px-3 py-2.5 font-cormorant text-[15px] text-ink outline-none [color-scheme:light] focus:border-bronze-dark"
        />
      </div>

      <div className="relative mb-4">
        <label className="mb-1.5 block font-cinzel text-xs font-medium uppercase tracking-[0.08em] text-ink-2">
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
          className="w-full border border-line bg-parchment px-3 py-2.5 font-cormorant text-[15px] text-ink outline-none placeholder:text-ink-2/50 focus:border-bronze-dark"
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
                  className="block w-full px-3 py-2 text-left font-cormorant text-sm text-ink hover:bg-parchment-2 hover:text-bronze-dark"
                >
                  {city.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <p className="mb-3 font-cormorant text-sm text-terracotta">{error}</p>}

      <button
        type="submit"
        disabled={!canSubmit}
        className="mt-2 w-full bg-bronze py-3 font-cinzel text-[13px] uppercase tracking-[0.12em] text-ink transition-colors hover:bg-bronze-dark disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? "Calculating…" : submitLabel}
      </button>
      <p className="mt-3.5 text-center font-cormorant text-sm italic text-ink-2">{helperText}</p>
    </form>
  );
}
