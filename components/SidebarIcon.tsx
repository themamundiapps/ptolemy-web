import type { TabKey } from "@/lib/tabs";

/** One small line-art SVG per sidebar destination, all `stroke="currentColor"`
 * so they inherit the sidebar item's ink/bronze color exactly like the rest
 * of the design system (see BrandGlyph.tsx for the same convention) --
 * replaces a set of Unicode glyphs that included an emoji-presentation
 * lightning bolt (Electional), an envelope that read as "email" rather than
 * "chat" (Chat), and a sparkle that reads as "AI magic" (Analysis, at odds
 * with the product's anti-pop-astrology positioning). No OS/font glyph
 * rendering is involved here, so nothing can render as a colored emoji on
 * any platform. */
export default function SidebarIcon({ tab }: { tab: TabKey }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 1.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (tab) {
    case "chart":
      // The chart wheel itself, simplified: a circle quartered by the angles.
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 4v16M4 12h16" />
        </svg>
      );
    case "house-lords":
      // Rulership/dominion, not timing: a crown -- was previously a clock-face
      // construction (circle + hand) that duplicated the Electional glyph.
      return (
        <svg {...common}>
          <path d="M5 17V11l3.5 3L12 8l3.5 6 3.5-3v6z" />
          <path d="M5 17h14" />
        </svg>
      );
    case "temperament":
      // The four humors as a balanced quadrant, echoing the quality bars.
      return (
        <svg {...common}>
          <rect x="5" y="5" width="14" height="14" rx="1" />
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "electional":
      // Choosing a moment in time: a clock face.
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 7.5V12l3.5 2" />
        </svg>
      );
    case "transits":
      // The current sky: a sun.
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4.5" />
          <path d="M12 3v2.5M12 18.5V21M4.4 4.4l1.8 1.8M17.8 17.8l1.8 1.8M3 12h2.5M18.5 12H21M4.4 19.6l1.8-1.8M17.8 6.2l1.8-1.8" />
        </svg>
      );
    case "synastry":
      // Two charts compared: overlapping circles.
      return (
        <svg {...common}>
          <circle cx="9.5" cy="12" r="6.5" />
          <circle cx="14.5" cy="12" r="6.5" />
        </svg>
      );
    case "analysis":
      // A sober reading of the chart: an open manuscript, not a sparkle.
      return (
        <svg {...common}>
          <path d="M4 6.5c2.2-1 4.6-1 6.5 0v12c-1.9-1-4.3-1-6.5 0z" />
          <path d="M20 6.5c-2.2-1-4.6-1-6.5 0v12c1.9-1 4.3-1 6.5 0z" />
        </svg>
      );
    case "ask":
      // Conversation, not mail: a speech bubble.
      return (
        <svg {...common}>
          <path d="M4 6.5h16v9H9.5L6 19v-3.5H4z" />
        </svg>
      );
  }
}
