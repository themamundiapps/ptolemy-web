import type { ChartResponse } from "@/lib/types";
import { PLANET_ORDER, PLANET_SYMBOLS, SIGN_SYMBOLS, formatDegree } from "@/lib/astro";

function dignityLabel(dignities: string[]): string {
  if (!dignities.length) return "Peregrine";
  return dignities.map((d) => d[0].toUpperCase() + d.slice(1)).join(" & ");
}

export default function PlanetList({ chart }: { chart: ChartResponse }) {
  const rows = [
    { name: "Ascendant", position: chart.ascendant, symbol: "ASC", isPlanet: false },
    ...PLANET_ORDER.filter((name) => chart.planets[name]).map((name) => ({
      name,
      position: chart.planets[name],
      symbol: PLANET_SYMBOLS[name],
      isPlanet: true,
    })),
    { name: "Midheaven", position: chart.midheaven, symbol: "MC", isPlanet: false },
    { name: "Lot of Fortune", position: chart.lot_of_fortune, symbol: "⊕", isPlanet: false },
    { name: "Lot of Spirit", position: chart.lot_of_spirit, symbol: "⊗", isPlanet: false },
  ];

  return (
    <div className="divide-y divide-line border border-line bg-parchment-2">
      {rows.map((row) => (
        <div key={row.name} className="flex items-center justify-between gap-3 px-4 py-3 font-crimson text-sm">
          <div className="flex items-center gap-3">
            <span className="w-6 text-center font-cinzel text-bronze-dark">{row.symbol}</span>
            <span className="text-ink">{row.name}</span>
            {row.position.retrograde && <span className="text-xs text-terracotta">℞</span>}
          </div>
          <div className="flex items-center gap-3 font-ebgaramond text-xs uppercase tracking-[0.04em] text-ink-2">
            <span>
              {SIGN_SYMBOLS[row.position.sign]} {row.position.sign} {formatDegree(row.position.sign_longitude)}
            </span>
            <span className="w-16 text-right">House {row.position.house}</span>
            {row.isPlanet && (
              <span className="w-24 text-right">{dignityLabel(row.position.dignities)}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
