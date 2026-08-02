import { DOMICILE_RULERS, PLANET_ORDER, signOnHouse } from "./astro";
import type { ChartResponse } from "./types";

const CADENT_HOUSES = new Set([3, 6, 9, 12]);
const ORDINAL_HOUSE: Record<number, string> = {
  1: "1st",
  2: "2nd",
  3: "3rd",
  4: "4th",
  5: "5th",
  6: "6th",
  7: "7th",
  8: "8th",
  9: "9th",
  10: "10th",
  11: "11th",
  12: "12th",
};

interface Candidate {
  priority: number;
  question: string;
}

/** Per-theme generation rules, keyed the same as lib/electionalThemes.ts's
 * ELECTIONAL_THEMES so the two tabs share one taxonomy. `significators`
 * mirrors each theme's natural (topic-general) planetary rulers from the
 * backend's electional THEMES table (backend/app/services/electional.py) --
 * `primaryHouse` is that same table's `primary_house`. `topic` is only the
 * phrase spliced into question templates below. */
export const CHAT_THEME_RULES: Record<
  string,
  { significators: string[]; primaryHouse: number; topic: string }
> = {
  love_relationships: { significators: ["Venus", "Jupiter"], primaryHouse: 7, topic: "love and relationships" },
  travel: { significators: ["Mercury", "Jupiter"], primaryHouse: 9, topic: "travel" },
  business_career: { significators: ["Sun", "Jupiter"], primaryHouse: 10, topic: "career" },
  health_body: { significators: ["Sun", "Jupiter"], primaryHouse: 1, topic: "health" },
  spiritual_learning: { significators: ["Jupiter"], primaryHouse: 9, topic: "study and spiritual life" },
  home_family: { significators: ["Moon", "Venus"], primaryHouse: 4, topic: "home and family" },
};

/** Template-filled chat starters drawn from the user's own chart -- no LLM
 * call, no fixed list. `themeKey` selects one of the six domains in
 * CHAT_THEME_RULES; omitted or unrecognized falls back to the general,
 * whole-chart suggestions (the neutral state). Each rule below contributes
 * at most one candidate, and the four highest-priority candidates that
 * actually apply are kept. */
export function buildChatSuggestions(chart: ChartResponse, themeKey?: string | null): string[] {
  const rule = themeKey ? CHAT_THEME_RULES[themeKey] : undefined;
  return rule ? buildThemedSuggestions(chart, rule) : buildGeneralSuggestions(chart);
}

/** Priority favors specific/surprising placements (a debility, a cadent
 * planet) over what's already visible elsewhere on the page (the ascendant
 * sign is already shown in the reading header). */
function buildGeneralSuggestions(chart: ChartResponse): string[] {
  const candidates: Candidate[] = [];

  // 1. Detriment or fall -- a debility, the most immediately dramatic hook.
  const debilitated = PLANET_ORDER.find(
    (name) => chart.planets[name]?.dignities.includes("detriment") || chart.planets[name]?.dignities.includes("fall"),
  );
  if (debilitated) {
    const debility = chart.planets[debilitated].dignities.includes("detriment") ? "detriment" : "fall";
    candidates.push({
      priority: 1,
      question: `${debilitated} is in ${debility} — how much does that cost me?`,
    });
  }

  // 2. Ruler of the Ascendant -- the chart's core signature, not shown
  // explicitly anywhere else on the page.
  const ascendantRuler = DOMICILE_RULERS[chart.ascendant.sign];
  if (ascendantRuler) {
    candidates.push({
      priority: 2,
      question: `My ${ascendantRuler} rules the 1st. What does it govern in my life?`,
    });
  }

  // 3. A planet in a cadent house (3, 6, 9, 12) -- traditionally the weakest
  // house condition, and rarely intuitive to a first-time reader.
  const cadentPlanet = PLANET_ORDER.find((name) => CADENT_HOUSES.has(chart.planets[name]?.house));
  if (cadentPlanet) {
    const house = chart.planets[cadentPlanet].house;
    candidates.push({
      priority: 3,
      question: `Why does ${cadentPlanet} in the ${ORDINAL_HOUSE[house]} matter so much here?`,
    });
  }

  // 4. Tightest aspect in the chart -- the most technically "active" contact.
  if (chart.aspects.length > 0) {
    const tightest = [...chart.aspects].sort((a, b) => a.orb - b.orb)[0];
    candidates.push({
      priority: 4,
      question: `${tightest.planet_a} ${tightest.aspect} ${tightest.planet_b} is the tightest aspect in my chart — what does that mean?`,
    });
  }

  // 5. Domicile or exaltation -- a planet's strength, framed positively.
  const dignified = PLANET_ORDER.find(
    (name) => chart.planets[name]?.dignities.includes("domicile") || chart.planets[name]?.dignities.includes("exaltation"),
  );
  if (dignified) {
    const dignity = chart.planets[dignified].dignities.includes("domicile") ? "domicile" : "exaltation";
    candidates.push({
      priority: 5,
      question: `${dignified} is in ${dignity} in my chart — what strength does that give me?`,
    });
  }

  // 6. Ascendant sign -- always available, but already visible in the
  // reading header, so it's the lowest-priority filler.
  candidates.push({
    priority: 6,
    question: `What does my ${chart.ascendant.sign} ascendant say about me?`,
  });

  return candidates
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 4)
    .map((c) => c.question);
}

/** Same shape as buildGeneralSuggestions, restricted to the planets this
 * theme actually cares about: its fixed natural significators (e.g. Venus
 * for Love) plus this native's own accidental significators -- the ruler of
 * the theme's primary house and the ruler of the Ascendant (who's
 * undertaking the action, tracked for every theme) -- mirroring how the
 * backend's electional scan (_significators_for in
 * backend/app/services/electional.py) augments natural rulership with
 * chart-specific rulership rather than replacing it. */
function buildThemedSuggestions(chart: ChartResponse, rule: { significators: string[]; primaryHouse: number; topic: string }): string[] {
  const candidates: Candidate[] = [];

  const ascendantRuler = DOMICILE_RULERS[chart.ascendant.sign];
  const primaryHouseSign = signOnHouse(rule.primaryHouse, chart.ascendant.sign);
  const primaryRuler = primaryHouseSign ? DOMICILE_RULERS[primaryHouseSign] : undefined;

  const trackedSet = new Set([...rule.significators, primaryRuler, ascendantRuler].filter((p): p is string => Boolean(p)));
  const tracked = PLANET_ORDER.filter((p) => trackedSet.has(p));

  // 1. Detriment or fall on a tracked planet -- the most dramatic hook.
  const debilitated = tracked.find(
    (name) => chart.planets[name]?.dignities.includes("detriment") || chart.planets[name]?.dignities.includes("fall"),
  );
  if (debilitated) {
    const debility = chart.planets[debilitated].dignities.includes("detriment") ? "detriment" : "fall";
    candidates.push({
      priority: 1,
      question: `${debilitated} is in ${debility} — what does that mean for ${rule.topic}?`,
    });
  }

  // 2. Ruler of the theme's primary house -- its core signature, e.g. Love's
  // ruler of the 7th.
  if (primaryRuler) {
    candidates.push({
      priority: 2,
      question: `My ${primaryRuler} rules the ${ORDINAL_HOUSE[rule.primaryHouse]}. What does that mean for ${rule.topic}?`,
    });
  }

  // 3. A tracked planet in a cadent house.
  const cadentPlanet = tracked.find((name) => CADENT_HOUSES.has(chart.planets[name]?.house));
  if (cadentPlanet) {
    const house = chart.planets[cadentPlanet].house;
    candidates.push({
      priority: 3,
      question: `Why does ${cadentPlanet} in the ${ORDINAL_HOUSE[house]} matter for ${rule.topic}?`,
    });
  }

  // 4. Tightest aspect involving a tracked planet.
  const themedAspects = chart.aspects.filter((a) => trackedSet.has(a.planet_a) || trackedSet.has(a.planet_b));
  if (themedAspects.length > 0) {
    const tightest = [...themedAspects].sort((a, b) => a.orb - b.orb)[0];
    candidates.push({
      priority: 4,
      question: `${tightest.planet_a} ${tightest.aspect} ${tightest.planet_b} — how does that shape ${rule.topic}?`,
    });
  }

  // 5. Domicile or exaltation on a tracked planet.
  const dignified = tracked.find(
    (name) => chart.planets[name]?.dignities.includes("domicile") || chart.planets[name]?.dignities.includes("exaltation"),
  );
  if (dignified) {
    const dignity = chart.planets[dignified].dignities.includes("domicile") ? "domicile" : "exaltation";
    candidates.push({
      priority: 5,
      question: `${dignified} is in ${dignity} in my chart — what strength does that give ${rule.topic}?`,
    });
  }

  // 6. The theme's primary natural significator, in its own sign -- always
  // available filler, same role as the ascendant-sign filler above.
  const anchor = rule.significators[0];
  const anchorPos = anchor ? chart.planets[anchor] : undefined;
  if (anchor && anchorPos) {
    candidates.push({
      priority: 6,
      question: `What does my ${anchor} in ${anchorPos.sign} say about ${rule.topic}?`,
    });
  }

  return candidates
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 4)
    .map((c) => c.question);
}
