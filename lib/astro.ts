import type { ZodiacPosition } from "./types";

export const PLANET_ORDER = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"];

// Trailing U+FE0E forces the text (monochrome) presentation of these glyphs.
// Without it, systems with a color-emoji font substitute the zodiac symbols
// (U+2648-U+2653 are emoji-eligible) with cartoonish colored icons that clash
// with the rest of the traditional/ink-and-bronze design.
export const PLANET_SYMBOLS: Record<string, string> = {
  Sun: "☉︎",
  Moon: "☽︎",
  Mercury: "☿︎",
  Venus: "♀︎",
  Mars: "♂︎",
  Jupiter: "♃︎",
  Saturn: "♄︎",
};

export const SIGN_SYMBOLS: Record<string, string> = {
  Aries: "♈︎",
  Taurus: "♉︎",
  Gemini: "♊︎",
  Cancer: "♋︎",
  Leo: "♌︎",
  Virgo: "♍︎",
  Libra: "♎︎",
  Scorpio: "♏︎",
  Sagittarius: "♐︎",
  Capricorn: "♑︎",
  Aquarius: "♒︎",
  Pisces: "♓︎",
};

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

export function dignitySummary(planets: Record<string, ZodiacPosition>): {
  dignified: { name: string; value: string }[];
  peregrine: string[];
} {
  const dignified = PLANET_ORDER.filter((name) => planets[name]?.dignities.length).map((name) => ({
    name,
    value: `${dignityLabel(planets[name].dignities)} · ${planets[name].sign}`,
  }));
  const peregrine = PLANET_ORDER.filter((name) => !planets[name]?.dignities.length);
  return { dignified, peregrine };
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
