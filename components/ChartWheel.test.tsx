import { describe, expect, it } from "vitest";
import { layoutPlanetPositions, MIN_PLANET_SEP } from "./ChartWheel";

// Regression coverage for the wheel's declustering algorithm. This is the
// one piece of Tarefa 5 that's a real algorithm rather than styling: it must
// generalize to any cluster size, not just the two-planet case a manual
// nudge would handle -- a stellium (5+ planets within a few degrees, as
// happens for real nativities) is exactly the case that breaks a hardcoded
// pairwise fix.
describe("layoutPlanetPositions", () => {
  it("leaves well-separated planets at their true longitude", () => {
    const result = layoutPlanetPositions([
      { name: "Sun", longitude: 10 },
      { name: "Moon", longitude: 100 },
      { name: "Mars", longitude: 250 },
    ]);
    for (const p of result) {
      expect(p.displayLongitude).toBeCloseTo(p.trueLongitude, 5);
    }
  });

  it("spreads a five-planet stellium so every glyph clears MIN_PLANET_SEP, in original order", () => {
    // Five planets within a 4° span -- a real stellium, not just a close pair.
    const entries = [
      { name: "Mercury", longitude: 100.5 },
      { name: "Sun", longitude: 98 },
      { name: "Venus", longitude: 101.8 },
      { name: "Mars", longitude: 99.2 },
      { name: "Saturn", longitude: 102.6 },
    ];
    const result = layoutPlanetPositions(entries);

    // True longitude order must be preserved in the output regardless of
    // input order (glyphs would visually cross their own aspect lines
    // otherwise).
    const byTrueLon = [...entries].sort((a, b) => a.longitude - b.longitude).map((e) => e.name);
    const sortedResult = [...result].sort((a, b) => a.trueLongitude - b.trueLongitude);
    expect(sortedResult.map((r) => r.name)).toEqual(byTrueLon);

    // Every adjacent pair (by display position) must clear the minimum
    // separation -- checked generically over N planets, not asserted for a
    // hardcoded pair.
    const byDisplay = [...result].sort((a, b) => a.displayLongitude - b.displayLongitude);
    for (let i = 1; i < byDisplay.length; i++) {
      const gap = byDisplay[i].displayLongitude - byDisplay[i - 1].displayLongitude;
      expect(gap).toBeGreaterThanOrEqual(MIN_PLANET_SEP - 1e-9);
    }

    // trueLongitude must survive un-nudged, exactly as given -- this is what
    // the aspect lines and the leader-tick back to the rim both key off.
    for (const entry of entries) {
      const match = result.find((r) => r.name === entry.name);
      expect(match?.trueLongitude).toBe(entry.longitude);
    }
  });

  it("handles a stellium straddling the 0°/360° wrap without corrupting order", () => {
    const entries = [
      { name: "Sun", longitude: 358 },
      { name: "Moon", longitude: 1 },
      { name: "Mercury", longitude: 359 },
      { name: "Venus", longitude: 2.5 },
    ];
    const result = layoutPlanetPositions(entries);
    expect(result).toHaveLength(4);
    // No two glyphs collapse onto the same display spot even across the seam.
    const displays = result.map((r) => r.displayLongitude);
    expect(new Set(displays.map((d) => d.toFixed(3))).size).toBe(4);
  });

  it("returns the true (non-nudged) longitude for aspect-line placement even when the glyph itself was moved", () => {
    const entries = [
      { name: "Sun", longitude: 200 },
      { name: "Moon", longitude: 201 },
    ];
    const result = layoutPlanetPositions(entries);
    const moon = result.find((r) => r.name === "Moon")!;
    // Moon's glyph gets pushed forward (nudged) but its true longitude, used
    // for the aspect line, must stay exactly 201 -- never the display value.
    expect(moon.trueLongitude).toBe(201);
    expect(moon.displayLongitude).not.toBeCloseTo(201, 3);
  });
});
