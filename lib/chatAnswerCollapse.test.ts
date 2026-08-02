import { describe, expect, it } from "vitest";
import { analyzeAnswerForCollapse } from "./chatAnswerCollapse";

function paragraphs(n: number, wordsPerParagraph = 40): string {
  return Array.from({ length: n }, (_, p) =>
    Array.from({ length: wordsPerParagraph }, (_, i) => `p${p}word${i}`).join(" "),
  ).join("\n\n");
}

describe("analyzeAnswerForCollapse", () => {
  it("never collapses a short answer", () => {
    const info = analyzeAnswerForCollapse("Your Venus in Libra favors partnership.");
    expect(info.isCollapsible).toBe(false);
    expect(info.collapsedText).toBe("Your Venus in Libra favors partnership.");
  });

  it("never collapses a short multi-paragraph answer even with several paragraphs", () => {
    const content = "First.\n\nSecond.\n\nThird.";
    const info = analyzeAnswerForCollapse(content);
    expect(info.isCollapsible).toBe(false);
  });

  it("collapses a long multi-paragraph answer to the first two paragraphs", () => {
    const content = paragraphs(4);
    const info = analyzeAnswerForCollapse(content);
    const [p1, p2, p3] = content.split("\n\n");
    expect(info.isCollapsible).toBe(true);
    expect(info.collapsedText).toBe(`${p1}\n\n${p2}`);
    expect(info.collapsedText).not.toContain(p3);
  });

  it("does not collapse when the first two paragraphs already cover nearly the whole answer", () => {
    const content = `${paragraphs(2)}\n\nOne short tail.`;
    const info = analyzeAnswerForCollapse(content);
    expect(info.isCollapsible).toBe(false);
    expect(info.collapsedText).toBe(content.trim());
  });

  it("falls back to a hard word-boundary cut for one long paragraph with no breaks", () => {
    const content = Array.from({ length: 120 }, (_, i) => `word${i}`).join(" ");
    const info = analyzeAnswerForCollapse(content);
    expect(info.isCollapsible).toBe(true);
    expect(content.length).toBeGreaterThan(400);
    expect(info.collapsedText.length).toBeLessThan(content.length);
    expect(info.collapsedText.endsWith("…")).toBe(true);
    // Cuts at a word boundary (a complete "wordN" token), never mid-word.
    expect(info.collapsedText.slice(0, -1)).toMatch(/word\d+$/);
  });

  it("trims surrounding whitespace before measuring length", () => {
    const info = analyzeAnswerForCollapse(`   ${"a".repeat(10)}   `);
    expect(info.collapsedText).toBe("a".repeat(10));
  });
});
