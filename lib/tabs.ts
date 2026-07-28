export type TabKey =
  | "chart"
  | "house-lords"
  | "temperament"
  | "electional"
  | "transits"
  | "synastry"
  | "analysis"
  | "ask";

export const SIDEBAR_ITEMS: { key: TabKey; label: string }[] = [
  { key: "chart", label: "Chart" },
  { key: "house-lords", label: "House Lords" },
  { key: "temperament", label: "Temperament" },
  { key: "electional", label: "Electional" },
  { key: "transits", label: "Transits" },
  { key: "synastry", label: "Synastry" },
  { key: "analysis", label: "Analysis" },
  { key: "ask", label: "Chat" },
];

export const DEFAULT_TAB: TabKey = "chart";

export function isTabKey(value: string | null): value is TabKey {
  return !!value && SIDEBAR_ITEMS.some((item) => item.key === value);
}
