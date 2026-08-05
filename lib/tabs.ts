export type TabKey =
  | "chart"
  | "house-lords"
  | "temperament"
  | "electional"
  | "transits"
  | "synastry"
  | "analysis"
  | "ask";

// `proGated` tabs are entirely behind Ptolemy Pro server-side (403 on their
// endpoint for a free caller, see backend app/routers/chart.py) -- flagged
// here so the sidebar can show a PRO tag rather than let someone click in
// and only discover the gate once they're inside the tab.
export const SIDEBAR_ITEMS: { key: TabKey; label: string; proGated?: boolean }[] = [
  { key: "chart", label: "Chart" },
  { key: "house-lords", label: "House Lords" },
  { key: "temperament", label: "Temperament" },
  { key: "electional", label: "Electional" },
  { key: "transits", label: "Transits" },
  { key: "synastry", label: "Synastry", proGated: true },
  { key: "analysis", label: "Analysis", proGated: true },
  { key: "ask", label: "Chat" },
];

export const DEFAULT_TAB: TabKey = "chart";

export function isTabKey(value: string | null): value is TabKey {
  return !!value && SIDEBAR_ITEMS.some((item) => item.key === value);
}
