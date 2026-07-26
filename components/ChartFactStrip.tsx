import type { ChartResponse } from "@/lib/types";
import { PLANET_ORDER, PLANET_SYMBOLS } from "@/lib/astro";

function dignityLabel(dignities: string[]): string | null {
  if (!dignities.length) return null;
  return dignities.map((d) => d[0].toUpperCase() + d.slice(1)).join(" & ");
}

export default function ChartFactStrip({ chart }: { chart: ChartResponse }) {
  const dignified = PLANET_ORDER.filter((name) => chart.planets[name]?.dignities.length);

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {dignified.length > 0 ? (
        dignified.map((name) => (
          <span key={name} className="border border-line px-3 py-1 font-crimson text-xs text-ink-2">
            {PLANET_SYMBOLS[name]} {name} — {dignityLabel(chart.planets[name].dignities)}
          </span>
        ))
      ) : (
        <span className="border border-line px-3 py-1 font-crimson text-xs text-ink-2 italic">
          No planet in essential dignity
        </span>
      )}
    </div>
  );
}
