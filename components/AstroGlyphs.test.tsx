import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ChartWheel from "./ChartWheel";
import { AstroGlyphDefs } from "./AstroGlyphs";
import type { ChartResponse } from "@/lib/types";

const pos = (longitude: number, sign: string, house: number, retrograde = false) => ({
  longitude,
  sign,
  sign_longitude: longitude % 30,
  house,
  retrograde,
  dignities: [],
});

const chart: ChartResponse = {
  julian_day_ut: 0,
  sect: "diurnal",
  timezone_id: "Europe/London",
  utc_offset_used: 0,
  tz_source: "test",
  ascendant: pos(10, "Aries", 1),
  midheaven: pos(280, "Capricorn", 10),
  planets: {
    Sun: pos(85, "Gemini", 3),
    Moon: pos(96, "Cancer", 3, true),
    Mercury: pos(88, "Gemini", 3),
    Venus: pos(120, "Leo", 4),
    Mars: pos(200, "Libra", 7),
    Jupiter: pos(300, "Aquarius", 11),
    Saturn: pos(15, "Aries", 1),
  },
  lot_of_fortune: pos(50, "Taurus", 2),
  lot_of_spirit: pos(340, "Pisces", 12),
  aspects: [
    { planet_a: "Sun", planet_b: "Mercury", aspect: "conjunction", angle: 3, orb: 3 },
    { planet_a: "Sun", planet_b: "Mars", aspect: "square", angle: 92, orb: 2 },
  ],
};

// Regression coverage for the Astronomicon glyph swap: every <use> the wheel
// emits must resolve to a real <symbol> id from AstroGlyphDefs, with no gap
// between the two. This is exactly the failure mode that would show up as a
// silent empty box in the rasterized 1080x1080 export -- catching a broken
// reference here doesn't require an actual browser or export pipeline.
describe("AstroGlyphs", () => {
  it("wheel references real symbol ids for every planet, sign, angle, aspect-adjacent and retrograde glyph drawn", () => {
    const defsHtml = renderToStaticMarkup(createElement(AstroGlyphDefs));
    const wheelHtml = renderToStaticMarkup(createElement(ChartWheel, { chart }));

    for (const id of [
      "glyph-sun",
      "glyph-moon",
      "glyph-mercury",
      "glyph-venus",
      "glyph-mars",
      "glyph-jupiter",
      "glyph-saturn",
      "glyph-aries",
      "glyph-taurus",
      "glyph-gemini",
      "glyph-cancer",
      "glyph-leo",
      "glyph-libra",
      "glyph-aquarius",
      "glyph-pisces",
      "glyph-capricorn",
      "glyph-asc",
      "glyph-mc",
      "glyph-dsc",
      "glyph-ic",
      "glyph-retrograde",
    ]) {
      expect(defsHtml).toContain(`id="${id}"`);
    }

    // Every <use href="#glyph-X"> in the wheel must resolve to a real symbol id in defs.
    const useRe = /href="#(glyph-[a-z]+)"/g;
    const uses: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = useRe.exec(wheelHtml)) !== null) {
      uses.push(match[1]);
    }
    expect(uses.length).toBeGreaterThan(0);
    for (const id of uses) {
      expect(defsHtml).toContain(`id="${id}"`);
    }

    // No leftover hand-drawn/unicode markers rendered as visible glyphs
    // (a plain-text "℞" inside an accessible <title> tooltip is fine).
    expect(wheelHtml.replace(/<title>[\s\S]*?<\/title>/g, "")).not.toContain("℞");
    // Retrograde Moon must produce a retrograde glyph reference.
    expect(uses).toContain("glyph-retrograde");
  });
});
