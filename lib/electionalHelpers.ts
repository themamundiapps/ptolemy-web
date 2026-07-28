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

/** What a HitRow's is_supporting actually earned:
 *  - "direct": a direct-position aspect the theme tracks -- full support,
 *    the same thing that can move a day's quality label.
 *  - "antiscion": no direct aspect earns support here, but the antiscion
 *    (mirrored) point does. Antiscion is a legitimate traditional technique
 *    (Ptolemy discusses degrees of equal power), but the backend's
 *    _important_reasons/_auspicious_reasons/_desirable_reasons -- the
 *    functions that decide a day's label -- never look at antiscion hits at
 *    all (only ELECTIONAL_ORBS-based direct-position matching). Folding an
 *    antiscion-only hit into "direct" support would tell the user it
 *    counted toward the label when it never could have.
 *  - "none": present but not counted either way (a tense aspect, or a
 *    harmonious one from a planet/house pair this theme doesn't track).
 */
export type SupportKind = "direct" | "antiscion" | "none";

/** A planetary-details row after merging a planet's direct and antiscion
 * hits on the same house into one line, so the same planet's two aspect
 * modes don't render as separate rows. */
export interface GroupedHit {
  hit: ElectionalHit;
  modeLabel: string;
  isCazimi: boolean;
  supportKind: SupportKind;
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
    const direct = list.find((h) => h.mode === "direct");
    const antiscion = list.find((h) => h.mode === "antiscion");
    // Cazimi is a planet-to-Sun relationship (only ever set on the direct
    // hit), so it's tracked across the whole group rather than trusting
    // whichever single hit ends up as the row's displayed `hit`.
    const isCazimi = list.some((h) => h.is_cazimi);

    // A direct supporting aspect earns full support on its own, even if an
    // antiscion hit also exists on the same (planet, house) -- the
    // antiscion is still shown in modeLabel, it just doesn't change the
    // category. Only when direct doesn't support (or doesn't exist) does
    // an antiscion hit's own is_supporting get its own category.
    let supportKind: SupportKind = "none";
    let primary: ElectionalHit = direct ?? antiscion!;
    if (direct?.is_supporting) {
      supportKind = "direct";
      primary = direct;
    } else if (antiscion?.is_supporting) {
      supportKind = "antiscion";
      primary = antiscion;
    } else if (direct && antiscion) {
      primary = [direct, antiscion].sort((a, b) => b.score - a.score)[0];
    }

    const modeLabel = direct && antiscion ? "direct + antiscion" : primary.mode === "antiscion" ? "antiscion" : "direct";
    grouped.push({ hit: primary, modeLabel, isCazimi, supportKind });
  }
  return grouped;
}

/** Plain-language reason a "present but not counted" row didn't count --
 * derivable entirely from what's already on the hit, no theme-table lookup
 * needed: is_supporting already encodes "harmonious aspect AND a (planet,
 * house) pair this theme tracks" as a single bool, so a harmonious aspect
 * that isn't supporting can only mean the pair isn't tracked. */
export function notCountedReason(grouped: GroupedHit): string {
  const { hit, modeLabel } = grouped;
  if (TENSE_ASPECTS.has(hit.aspect)) {
    return "Square/opposition — geometrically tense, never counted as support regardless of which planet forms it.";
  }
  if (modeLabel === "antiscion") {
    return "Only forms through antiscion (a mirrored reflection point, not the planet's true position), and isn't one of this theme's tracked significator pairings either way.";
  }
  return "A harmonious aspect, but not one of this theme's tracked significator-to-house pairings.";
}
