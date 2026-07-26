import type { ChartResponse } from "@/lib/types";
import { ASPECT_SYMBOLS, HARMONIOUS_ASPECTS, formatDegree } from "@/lib/astro";

export default function AspectsSection({ chart }: { chart: ChartResponse }) {
  const aspects = [...chart.aspects].sort((a, b) => a.orb - b.orb).slice(0, 6);

  if (aspects.length === 0) return null;

  return (
    <div className="border border-line bg-parchment-2 p-6 lg:p-7">
      <div className="mb-4 flex items-center gap-2">
        <span className="font-cinzel text-[11px] uppercase tracking-[0.14em] text-bronze-dark">IV</span>
        <span className="font-cinzel text-[11px] uppercase tracking-[0.14em] text-ink-2">Key Aspects</span>
      </div>
      <h2 className="mb-4 font-cormorant text-2xl font-medium text-ink">Tightest configurations, ranked by orb</h2>
      <div className="divide-y divide-line">
        {aspects.map((a, i) => (
          <div key={i} className="flex items-start gap-4 py-3 first:pt-0 last:pb-0">
            <div
              className={`flex h-11 w-11 flex-none items-center justify-center rounded-full border text-center font-cinzel text-[10px] leading-tight ${
                HARMONIOUS_ASPECTS.has(a.aspect) ? "border-bronze text-bronze-dark" : "border-terracotta text-terracotta"
              }`}
            >
              {formatDegree(a.orb)}
            </div>
            <div>
              <div className="font-crimson text-[15px] text-ink">
                {a.planet_a} {ASPECT_SYMBOLS[a.aspect] ?? ""} {a.planet_b}
                <span className="ml-2 font-cinzel text-[10px] uppercase tracking-[0.08em] text-ink-2">{a.aspect}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
