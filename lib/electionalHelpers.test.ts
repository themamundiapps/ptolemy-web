import { describe, expect, it } from "vitest";
import { groupHits, notCountedReason } from "./electionalHelpers";
import type { ElectionalHit } from "./types";

function hit(overrides: Partial<ElectionalHit>): ElectionalHit {
  return {
    planet: "Venus",
    house: 7,
    house_name: "Partnership & Marriage",
    aspect: "trine",
    mode: "direct",
    orb: 1.0,
    score: 5.0,
    is_supporting: true,
    is_cazimi: false,
    ...overrides,
  };
}

// Regression coverage for Problem 4: an antiscion-only supporting hit must
// never be folded into the same "direct" category a real direct-position
// supporting aspect earns -- the backend's day-label logic never looks at
// antiscion at all, so the UI shouldn't imply it counted the same way.
describe("groupHits — supportKind", () => {
  it("a direct supporting hit alone is kind 'direct'", () => {
    const [g] = groupHits([hit({ mode: "direct", is_supporting: true })]);
    expect(g.supportKind).toBe("direct");
    expect(g.modeLabel).toBe("direct");
  });

  it("an antiscion supporting hit alone is kind 'antiscion', not 'direct'", () => {
    const [g] = groupHits([hit({ mode: "antiscion", is_supporting: true })]);
    expect(g.supportKind).toBe("antiscion");
    expect(g.modeLabel).toBe("antiscion");
  });

  it("a non-supporting hit (tense aspect) is kind 'none'", () => {
    const [g] = groupHits([hit({ mode: "direct", aspect: "square", is_supporting: false })]);
    expect(g.supportKind).toBe("none");
  });

  it("direct supporting + antiscion non-supporting on the same (planet, house) merges into one 'direct' row", () => {
    const grouped = groupHits([
      hit({ mode: "direct", aspect: "trine", is_supporting: true, score: 3.0 }),
      hit({ mode: "antiscion", aspect: "square", is_supporting: false, score: 1.0 }),
    ]);
    expect(grouped).toHaveLength(1);
    expect(grouped[0].supportKind).toBe("direct");
    expect(grouped[0].modeLabel).toBe("direct + antiscion");
    expect(grouped[0].hit.mode).toBe("direct");
  });

  it("direct non-supporting + antiscion supporting on the same (planet, house) merges into one 'antiscion' row, not 'direct'", () => {
    // This is the exact bug scenario: before Problem 4's fix, filtering
    // hits into supporting/not-supporting BEFORE grouping would have split
    // this pair across two separate rows instead of merging them, and
    // there was no way to mark the result as antiscion-only support.
    const grouped = groupHits([
      hit({ mode: "direct", aspect: "square", is_supporting: false, score: 1.0 }),
      hit({ mode: "antiscion", aspect: "trine", is_supporting: true, score: 2.5 }),
    ]);
    expect(grouped).toHaveLength(1);
    expect(grouped[0].supportKind).toBe("antiscion");
    expect(grouped[0].modeLabel).toBe("direct + antiscion");
    expect(grouped[0].hit.mode).toBe("antiscion");
  });

  it("neither direct nor antiscion supporting merges into one 'none' row, picking the higher score for display", () => {
    const grouped = groupHits([
      hit({ mode: "direct", aspect: "square", is_supporting: false, score: 1.0 }),
      hit({ mode: "antiscion", aspect: "opposition", is_supporting: false, score: 2.0 }),
    ]);
    expect(grouped).toHaveLength(1);
    expect(grouped[0].supportKind).toBe("none");
    expect(grouped[0].hit.score).toBe(2.0);
  });

  it("cazimi is tracked across the group even when the cazimi hit isn't the displayed one", () => {
    const grouped = groupHits([
      hit({ mode: "direct", aspect: "square", is_supporting: false, is_cazimi: true, score: 1.0 }),
      hit({ mode: "antiscion", aspect: "trine", is_supporting: true, is_cazimi: false, score: 2.0 }),
    ]);
    expect(grouped[0].isCazimi).toBe(true);
  });
});

describe("notCountedReason", () => {
  it("names a tense aspect", () => {
    const [g] = groupHits([hit({ mode: "direct", aspect: "opposition", is_supporting: false })]);
    expect(notCountedReason(g)).toMatch(/tense/i);
  });

  it("names antiscion-only presence for a harmonious-but-unsupported antiscion hit", () => {
    const [g] = groupHits([hit({ mode: "antiscion", aspect: "trine", is_supporting: false })]);
    expect(notCountedReason(g)).toMatch(/antiscion/i);
  });

  it("names an untracked significator pairing for a harmonious direct hit that isn't supporting", () => {
    const [g] = groupHits([hit({ mode: "direct", aspect: "sextile", is_supporting: false })]);
    expect(notCountedReason(g)).toMatch(/tracked/i);
  });
});
