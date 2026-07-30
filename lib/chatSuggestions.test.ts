import { describe, expect, it } from "vitest";
import { buildChatSuggestions } from "./chatSuggestions";
import type { ChartResponse, ZodiacPosition } from "./types";

function position(overrides: Partial<ZodiacPosition>): ZodiacPosition {
  return {
    longitude: 0,
    sign: "Aries",
    sign_longitude: 0,
    house: 1,
    retrograde: false,
    dignities: [],
    ...overrides,
  };
}

function chart(overrides: Partial<ChartResponse>): ChartResponse {
  return {
    julian_day_ut: 0,
    sect: "diurnal",
    timezone_id: null,
    utc_offset_used: 0,
    tz_source: "test",
    ascendant: position({ sign: "Leo", house: 1 }),
    midheaven: position({ sign: "Taurus", house: 10 }),
    planets: {
      Sun: position({ sign: "Leo", house: 1 }),
      Moon: position({ sign: "Cancer", house: 12 }),
      Mercury: position({ sign: "Leo", house: 1 }),
      Venus: position({ sign: "Libra", house: 3 }),
      Mars: position({ sign: "Aries", house: 9 }),
      Jupiter: position({ sign: "Sagittarius", house: 5 }),
      Saturn: position({ sign: "Capricorn", house: 6 }),
    },
    lot_of_fortune: position({}),
    lot_of_spirit: position({}),
    aspects: [],
    ...overrides,
  };
}

describe("buildChatSuggestions", () => {
  it("never returns more than 4 questions", () => {
    const c = chart({
      planets: {
        ...chart({}).planets,
        Mars: position({ sign: "Libra", house: 9, dignities: ["detriment"] }),
        Jupiter: position({ sign: "Cancer", house: 6, dignities: ["exaltation"] }),
      },
      aspects: [{ planet_a: "Sun", planet_b: "Moon", aspect: "square", angle: 90, orb: 1.2 }],
    });
    expect(buildChatSuggestions(c).length).toBeLessThanOrEqual(4);
  });

  it("always includes the ascendant ruler and ascendant sign when nothing else applies", () => {
    const c = chart({});
    const questions = buildChatSuggestions(c);
    expect(questions.some((q) => q.includes("rules the 1st"))).toBe(true);
    expect(questions.some((q) => q.includes("Leo ascendant"))).toBe(true);
  });

  it("surfaces a detriment/fall planet with the correct debility word", () => {
    const c = chart({
      planets: { ...chart({}).planets, Venus: position({ sign: "Aries", house: 3, dignities: ["detriment"] }) },
    });
    const questions = buildChatSuggestions(c);
    expect(questions.some((q) => q.includes("Venus is in detriment"))).toBe(true);
  });

  it("surfaces a planet in a cadent house (3, 6, 9, 12) with an ordinal", () => {
    const c = chart({});
    const questions = buildChatSuggestions(c);
    expect(questions.some((q) => q.includes("Moon in the 12th"))).toBe(true);
  });

  it("surfaces the tightest aspect by orb, not just the first one", () => {
    const c = chart({
      aspects: [
        { planet_a: "Sun", planet_b: "Moon", aspect: "square", angle: 90, orb: 4.5 },
        { planet_a: "Mars", planet_b: "Venus", aspect: "trine", angle: 120, orb: 0.3 },
      ],
    });
    const questions = buildChatSuggestions(c);
    expect(questions.some((q) => q.startsWith("Mars trine Venus is the tightest"))).toBe(true);
  });

  it("drops the lowest-priority candidates once more than 4 apply", () => {
    const c = chart({
      planets: {
        ...chart({}).planets,
        Mars: position({ sign: "Libra", house: 9, dignities: ["detriment"] }),
        Jupiter: position({ sign: "Cancer", house: 6, dignities: ["exaltation"] }),
      },
      aspects: [{ planet_a: "Sun", planet_b: "Moon", aspect: "square", angle: 90, orb: 1.2 }],
    });
    const questions = buildChatSuggestions(c);
    expect(questions).toHaveLength(4);
    // Ascendant sign (priority 6) is the generic filler and is the first to
    // be dropped once debility, ruler, cadent house and aspect all apply.
    expect(questions.some((q) => q.includes("ascendant say about me"))).toBe(false);
  });
});
