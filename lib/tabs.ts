export type TabKey =
  | "chart"
  | "house-lords"
  | "temperament"
  | "electional"
  | "transits"
  | "synastry"
  | "analysis"
  | "ask";

export const SIDEBAR_ITEMS: { key: TabKey; label: string; icon: string }[] = [
  { key: "chart", label: "Chart", icon: "☽" },
  { key: "house-lords", label: "House Lords", icon: "⊕" },
  { key: "temperament", label: "Temperament", icon: "♄" },
  { key: "electional", label: "Electional", icon: "⚡" },
  { key: "transits", label: "Transits", icon: "☉" },
  { key: "synastry", label: "Synastry", icon: "⚭" },
  { key: "analysis", label: "Analysis", icon: "✦" },
  { key: "ask", label: "Chat", icon: "✉" },
];

export const DEFAULT_TAB: TabKey = "chart";

export function isTabKey(value: string | null): value is TabKey {
  return !!value && SIDEBAR_ITEMS.some((item) => item.key === value);
}
