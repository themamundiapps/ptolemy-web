import { describe, expect, it } from "vitest";
import { dignitySummary, hasTrueDignity, leadAspect, naturalList } from "./astro";
import type { Aspect, ZodiacPosition } from "./types";

function pos(sign: string, dignities: string[]): ZodiacPosition {
  return { longitude: 0, sign, sign_longitude: 0, house: 1, retrograde: false, dignities };
}

describe("naturalList", () => {
  it("returns a single item as-is", () => {
    expect(naturalList(["Moon"])).toBe("Moon");
  });
  it("joins two items with 'and', no comma", () => {
    expect(naturalList(["Moon", "Venus"])).toBe("Moon and Venus");
  });
  it("joins three or more items with a serial (Oxford) comma", () => {
    expect(naturalList(["Sun", "Moon", "Jupiter"])).toBe("Sun, Moon, and Jupiter");
    expect(naturalList(["Sun", "Moon", "Jupiter", "Venus"])).toBe("Sun, Moon, Jupiter, and Venus");
  });
});

describe("hasTrueDignity / dignitySummary — regression for the Fall/Detriment-as-dignity bug", () => {
  // Fixture mirrors the reported bug: ASC Sagittarius, diurnal nativity where
  // Sun is in Fall (Libra), Moon is in Domicile (Cancer), Jupiter is in
  // Detriment (Gemini), and the rest are Peregrine. Only the Moon should ever
  // be reported as holding essential dignity.
  const planets: Record<string, ZodiacPosition> = {
    Sun: pos("Libra", ["fall"]),
    Moon: pos("Cancer", ["domicile"]),
    Mercury: pos("Aries", []),
    Venus: pos("Aries", []),
    Mars: pos("Aries", []),
    Jupiter: pos("Gemini", ["detriment"]),
    Saturn: pos("Aries", []),
  };

  it("treats detriment/fall as NOT dignified", () => {
    expect(hasTrueDignity(["fall"])).toBe(false);
    expect(hasTrueDignity(["detriment"])).toBe(false);
  });

  it("treats domicile/exaltation as dignified", () => {
    expect(hasTrueDignity(["domicile"])).toBe(true);
    expect(hasTrueDignity(["exaltation"])).toBe(true);
  });

  it("a planet holding both a debility and nothing else is not dignified", () => {
    expect(hasTrueDignity([])).toBe(false);
  });

  it("dignitySummary puts only the Moon in `dignified` for this fixture", () => {
    const { dignified, debilitated, peregrine } = dignitySummary(planets);
    expect(dignified.map((d) => d.name)).toEqual(["Moon"]);
    expect(debilitated.map((d) => d.name).sort()).toEqual(["Jupiter", "Sun"]);
    expect(peregrine.sort()).toEqual(["Mars", "Mercury", "Saturn", "Venus"]);
  });
});

describe("leadAspect — regression for the title/body aspect mismatch bug", () => {
  const aspects: Aspect[] = [
    { planet_a: "Moon", planet_b: "Saturn", aspect: "sextile", angle: 60, orb: 0.5 },
    { planet_a: "Venus", planet_b: "Saturn", aspect: "opposition", angle: 180, orb: 1.8 },
  ];

  it("picks the tightest-orb aspect when the body doesn't mention any aspect", () => {
    expect(leadAspect("", aspects)?.planet_a).toBe("Moon");
  });

  it("picks the aspect the body actually discusses, even if it's not the tightest orb", () => {
    const body = "Yet the native faces substantial difficulties. Venus in opposition to Saturn compounds this.";
    const picked = leadAspect(body, aspects);
    expect(picked?.planet_a).toBe("Venus");
    expect(picked?.planet_b).toBe("Saturn");
  });
});
