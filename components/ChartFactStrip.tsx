import type { ChartResponse } from "@/lib/types";
import { PLANET_ORDER, PLANET_SYMBOLS, SIGN_SYMBOLS } from "@/lib/astro";

function dignityLabel(dignities: string[]): string | null {
  if (!dignities.length) return null;
  return dignities.map((d) => d[0].toUpperCase() + d.slice(1)).join(" & ");
}

export default function ChartFactStrip({ chart }: { chart: ChartResponse }) {
  const dignified = PLANET_ORDER.filter((name) => chart.planets[name]?.dignities.length);

  return (
    <div className="flex flex-wrap gap-2">
      <span className="border border-bronze px-3 py-1 font-cinzel text-[11px] uppercase tracking-[0.1em] text-bronze-dark">
        {chart.sect === "diurnal" ? "Diurnal sect" : "Nocturnal sect"}
      </span>
      <span className="border border-line px-3 py-1 font-crimson text-xs text-ink-2">
        {SIGN_SYMBOLS[chart.ascendant.sign]} {chart.ascendant.sign} rising
      </span>
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
