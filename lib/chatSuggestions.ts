import { DOMICILE_RULERS, PLANET_ORDER } from "./astro";
import type { ChartResponse } from "./types";

const CADENT_HOUSES = new Set([3, 6, 9, 12]);
const ORDINAL_HOUSE: Record<number, string> = { 3: "3rd", 6: "6th", 9: "9th", 12: "12th" };

interface Candidate {
  priority: number;
  question: string;
}

/** Template-filled chat starters drawn from the user's own chart -- no LLM
 * call, no fixed list. Each rule below contributes at most one candidate
 * (the first match in classical planetary order, PLANET_ORDER), and the four
 * highest-priority candidates that actually apply to this chart are kept.
 * Priority favors specific/surprising placements (a debility, a cadent
 * planet) over what's already visible elsewhere on the page (the ascendant
 * sign is already shown in the reading header). */
export function buildChatSuggestions(chart: ChartResponse): string[] {
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
