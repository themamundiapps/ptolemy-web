import type { Aspect, ZodiacPosition } from "./types";

export const PLANET_ORDER = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"];

export const SIGN_ORDER = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

export const ASPECT_SYMBOLS: Record<string, string> = {
  conjunction: "☌",
  sextile: "⚹",
  square: "□",
  trine: "△",
  opposition: "☍",
};

export const HARMONIOUS_ASPECTS = new Set(["trine", "sextile"]);

export function formatDegree(signLongitude: number): string {
  const deg = Math.floor(signLongitude);
  const min = Math.round((signLongitude - deg) * 60);
  return `${deg}°${min.toString().padStart(2, "0")}'`;
}

/** Whole-degree only ("28°", not "28°37'") -- the wheel shows this next to
 * each planet; the exact minute stays in the side table, which already
 * carries that precision via formatDegree. */
export function formatWholeDegree(signLongitude: number): string {
  return `${Math.floor(signLongitude)}°`;
}

/** Traditional (Ptolemaic) domicile rulers -- no outer planets. */
export const DOMICILE_RULERS: Record<string, string> = {
  Aries: "Mars",
  Taurus: "Venus",
  Gemini: "Mercury",
  Cancer: "Moon",
  Leo: "Sun",
  Virgo: "Mercury",
  Libra: "Venus",
  Scorpio: "Mars",
  Sagittarius: "Jupiter",
  Capricorn: "Saturn",
  Aquarius: "Saturn",
  Pisces: "Jupiter",
};

export function dignityLabel(dignities: string[]): string {
  if (!dignities.length) return "Peregrine";
  return dignities.map((d) => d[0].toUpperCase() + d.slice(1)).join(" & ");
}

/** The backend's `dignities` field on a planet position holds every essential
 * dignity *or debility* it holds in its sign (domicile/exaltation/detriment/
 * fall — see backend/app/services/ephemeris.py's ESSENTIAL_DIGNITIES table).
 * Only these two count as a true dignity; detriment/fall are debilities and
 * must never be treated as "the planet is dignified here". */
const TRUE_DIGNITIES = new Set(["domicile", "exaltation"]);

/** True only for an actual dignity (domicile/exaltation) -- a non-empty
 * `dignities` array is not enough, since it may hold only debilities
 * (detriment/fall). Use this anywhere "is this planet dignified?" is asked;
 * never gate on `dignities.length` alone. */
export function hasTrueDignity(dignities: string[]): boolean {
  return dignities.some((d) => TRUE_DIGNITIES.has(d));
}

/** Formats a list of items as natural-language prose: "A", "A and B", or
 * "A, B, and C" for one, two, or three-or-more items (serial/Oxford comma). */
export function naturalList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

export function dignitySummary(planets: Record<string, ZodiacPosition>): {
  dignified: { name: string; value: string }[];
  debilitated: { name: string; value: string }[];
  peregrine: string[];
} {
  const dignified = PLANET_ORDER.filter((name) => hasTrueDignity(planets[name]?.dignities ?? [])).map((name) => ({
    name,
    value: `${dignityLabel(planets[name].dignities)} · ${planets[name].sign}`,
  }));
  const debilitated = PLANET_ORDER.filter(
    (name) => !hasTrueDignity(planets[name]?.dignities ?? []) && (planets[name]?.dignities.length ?? 0) > 0,
  ).map((name) => ({
    name,
    value: `${dignityLabel(planets[name].dignities)} · ${planets[name].sign}`,
  }));
  const peregrine = PLANET_ORDER.filter((name) => !(planets[name]?.dignities.length ?? 0));
  return { dignified, debilitated, peregrine };
}

/** The point 180° opposite a given position (e.g. Descendant from the
 * Ascendant, IC from the Midheaven) -- same distance-from-house-cusp logic,
 * six whole-sign houses further round. */
export function oppositePoint(pos: ZodiacPosition): { sign: string; sign_longitude: number; house: number } {
  const oppositeLongitude = (pos.longitude + 180) % 360;
  const signIndex = Math.floor(oppositeLongitude / 30) % 12;
  return {
    sign: SIGN_ORDER[signIndex],
    sign_longitude: oppositeLongitude % 30,
    house: ((pos.house + 5) % 12) + 1,
  };
}

/** Picks the aspect a piece of prose actually opens with, by finding the
 * first aspect (in [orbSorted]'s order) whose two planet names both appear in
 * [paragraph] -- so a section title stays in sync with what the prose
 * discusses instead of silently defaulting to the tightest orb regardless of
 * what the text leads with. Falls back to the tightest-orb aspect when the
 * paragraph doesn't clearly reference any of them (e.g. no body text yet,
 * mid-generation). */
export function leadAspect(paragraph: string, orbSorted: Aspect[]): Aspect | undefined {
  if (paragraph) {
    const mentioned = orbSorted.find((a) => paragraph.includes(a.planet_a) && paragraph.includes(a.planet_b));
    if (mentioned) return mentioned;
  }
  return orbSorted[0];
}

/** Whole-sign houses a planet rules, given the Ascendant's sign -- house N's
 * sign is the Nth sign counting from the Ascendant. */
export function housesRuledBy(planet: string, ascendantSign: string): number[] {
  const ascIndex = SIGN_ORDER.indexOf(ascendantSign);
  if (ascIndex === -1) return [];
  const houses: number[] = [];
  for (let house = 1; house <= 12; house++) {
    const sign = SIGN_ORDER[(ascIndex + house - 1) % 12];
    if (DOMICILE_RULERS[sign] === planet) houses.push(house);
  }
  return houses;
}
