import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Markdown from "./Markdown";

// Regression test for the Chat/Analysis "raw markdown on screen" bug: the
// AI's reply used to be dropped into a plain text node, so `#`/`**` and
// blank-line paragraph breaks all showed up literally instead of being
// rendered. renderToStaticMarkup lets us assert on the real output HTML
// without needing a jsdom test environment.
//
// Uses createElement rather than JSX: this repo's tsconfig.json sets
// `"jsx": "preserve"` for Next.js's own compiler, which esbuild (vitest's
// transform) can't parse directly, and adding a separate vitest jsx override
// isn't worth it for one test file.
describe("Markdown", () => {
  it("renders a heading as a real heading element, not literal '#' text", () => {
    const html = renderToStaticMarkup(createElement(Markdown, {}, "# On Your Love Life"));
    expect(html).toContain("<h1");
    expect(html).toContain("On Your Love Life");
    expect(html).not.toContain("#");
  });

  it("renders bold text as <strong>, not literal '**'", () => {
    const html = renderToStaticMarkup(createElement(Markdown, {}, "**The Core Tension**"));
    expect(html).toContain("<strong>");
    expect(html).not.toContain("**");
  });

  it("keeps blank-line-separated paragraphs as separate <p> elements", () => {
    const html = renderToStaticMarkup(
      createElement(Markdown, {}, "First paragraph about Venus.\n\nSecond paragraph about Saturn."),
    );
    const pCount = html.match(/<p>/g)?.length ?? 0;
    expect(pCount).toBe(2);
  });
});
