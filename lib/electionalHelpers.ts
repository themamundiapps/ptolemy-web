import type { ElectionalHit } from "./types";

/** Pure, side-effect-free logic used by the Electional results view --
 * ported 1:1 from the Flutter app's electional_helpers.dart. */

const WEEKDAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MONTH_NAMES = [
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

/** Formats an ISO date ("2026-07-08") as "Tuesday, July 8". */
export function formatDayHeading(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const dt = new Date(year, month - 1, day);
  const weekday = WEEKDAY_NAMES[(dt.getDay() + 6) % 7];
  const monthName = MONTH_NAMES[dt.getMonth()];
  return `${weekday}, ${monthName} ${dt.getDate()}`;
}

/** Converts an ISO time ("17:30") into a humanized time-of-day label. */
export function humanizedTimeOfDay(isoTime: string): string {
  const hour = Number(isoTime.split(":")[0]);
  if (hour >= 5 && hour <= 8) return "early morning";
  if (hour >= 9 && hour <= 11) return "late morning";
  if (hour >= 12 && hour <= 13) return "midday";
  if (hour >= 14 && hour <= 16) return "afternoon";
  if (hour >= 17 && hour <= 19) return "early evening";
  if (hour >= 20 && hour <= 23) return "night";
  return "late night";
}

/** Traditional planetary rulers of the days of the week (Chaldean order).
 * Keyed by JS Date.getDay() (0 = Sunday .. 6 = Saturday). */
const DAY_RULERS: Record<number, string> = {
  0: "Sun",
  1: "Moon",
  2: "Mars",
  3: "Mercury",
  4: "Jupiter",
  5: "Venus",
  6: "Saturn",
};

/** Weekdays whose ruling planet is traditionally favorable for each theme. */
const FAVORABLE_WEEKDAYS_BY_THEME: Record<string, number[]> = {
  love_relationships: [5, 1], // Friday, Monday
  travel: [3, 4], // Wednesday, Thursday
  business_career: [4, 0], // Thursday, Sunday
  health_body: [0, 4], // Sunday, Thursday
  spiritual_learning: [4, 1], // Thursday, Monday
  home_family: [1, 5], // Monday, Friday
};

/** Returns the ruling planet's name if `date`'s weekday is favorable for
 * `themeKey`, or null if there's nothing worth showing. */
export function favorableRulerFor(themeKey: string, date: Date): string | null {
  const favorableDays = FAVORABLE_WEEKDAYS_BY_THEME[themeKey];
  if (!favorableDays || !favorableDays.includes(date.getDay())) return null;
  return DAY_RULERS[date.getDay()] ?? null;
}

const BENEFIC_PLANETS = new Set(["Venus", "Jupiter"]);
const HARMONIOUS_ASPECTS = new Set(["trine", "sextile", "conjunction"]);
const TENSE_ASPECTS = new Set(["square", "opposition"]);

/** Gold star for a benefic in harmonious aspect (trine/sextile/conjunction)
 * only. Squares and oppositions get the warning triangle regardless of which
 * planet forms them -- a square is geometrically tense whether it comes from
 * Mars, Saturn, or a luminary. */
export function qualityIndicatorFor(hit: ElectionalHit): "★" | "△" | null {
  if (BENEFIC_PLANETS.has(hit.planet) && HARMONIOUS_ASPECTS.has(hit.aspect)) return "★";
  if (TENSE_ASPECTS.has(hit.aspect)) return "△";
  return null;
}

/** A planetary-details row after merging a planet's direct and antiscion
 * hits on the same house into one line, so the same planet's two aspect
 * modes don't render as separate rows. */
export interface GroupedHit {
  hit: ElectionalHit;
  modeLabel: string;
  isCazimi: boolean;
}

export function groupHits(hits: ElectionalHit[]): GroupedHit[] {
  const byKey = new Map<string, ElectionalHit[]>();
  for (const h of hits) {
    const key = `${h.planet}-${h.house}`;
    const list = byKey.get(key) ?? [];
    list.push(h);
    byKey.set(key, list);
  }

  const grouped: GroupedHit[] = [];
  for (const list of Array.from(byKey.values())) {
    const hasDirect = list.some((h) => h.mode === "direct");
    const hasAntiscion = list.some((h) => h.mode === "antiscion");
    // Cazimi is a planet-to-Sun relationship (only ever set on the direct
    // hit), so it's tracked across the whole group rather than trusting
    // whichever single hit the score sort happens to pick first.
    const isCazimi = list.some((h) => h.is_cazimi);
    if (list.length === 2 && hasDirect && hasAntiscion) {
      const byScore = [...list].sort((a, b) => b.score - a.score);
      grouped.push({ hit: byScore[0], modeLabel: "direct + antiscion", isCazimi });
    } else {
      for (const h of list) {
        grouped.push({ hit: h, modeLabel: h.mode === "antiscion" ? "antiscion" : "direct", isCazimi: h.is_cazimi });
      }
    }
  }
  return grouped;
}
