import ChartWheel from "@/components/ChartWheel";
import { ASPECT_SYMBOLS, PLANET_ORDER, PLANET_SYMBOLS, dignityLabel, formatDegree } from "@/lib/astro";
import type { ChartResponse } from "@/lib/types";

export default function ChartTab({ chart }: { chart: ChartResponse }) {
  const planetRows = PLANET_ORDER.filter((name) => chart.planets[name]).map((name) => ({
    name,
    symbol: PLANET_SYMBOLS[name],
    position: chart.planets[name],
  }));

  return (
    <div>
      <div className="data-card">
        <ChartWheel chart={chart} />
      </div>

      <div className="data-card">
        <h4>Angles</h4>
        <div className="data-row">
          <div className="d-label">ASC</div>
          <div className="d-main">
            {chart.ascendant.sign} {formatDegree(chart.ascendant.sign_longitude)} · House {chart.ascendant.house}
          </div>
        </div>
        <div className="data-row">
          <div className="d-label">MC</div>
          <div className="d-main">
            {chart.midheaven.sign} {formatDegree(chart.midheaven.sign_longitude)} · House {chart.midheaven.house}
          </div>
        </div>
      </div>

      <div className="data-card">
        <h4>Planets</h4>
        {planetRows.map((row) => (
          <div className="data-row" key={row.name}>
            <div className="d-label">{row.symbol}</div>
            <div className="d-main">
              {row.name} — {row.position.sign} {formatDegree(row.position.sign_longitude)}
              {row.position.retrograde ? " ℞" : ""} · House {row.position.house}
            </div>
            {row.position.dignities.length > 0 && <div className="d-tag">{dignityLabel(row.position.dignities)}</div>}
          </div>
        ))}
      </div>

      <div className="data-card">
        <h4>Lots</h4>
        <div className="data-row">
          <div className="d-label">⊕</div>
          <div className="d-main">
            Lot of Fortune — {chart.lot_of_fortune.sign} {formatDegree(chart.lot_of_fortune.sign_longitude)} · House{" "}
            {chart.lot_of_fortune.house}
          </div>
        </div>
        <div className="data-row">
          <div className="d-label">⊗</div>
          <div className="d-main">
            Lot of Spirit — {chart.lot_of_spirit.sign} {formatDegree(chart.lot_of_spirit.sign_longitude)} · House{" "}
            {chart.lot_of_spirit.house}
          </div>
        </div>
      </div>

      <div className="data-card">
        <h4>Aspects</h4>
        {chart.aspects.length === 0 && <p className="empty">No major aspects within orb.</p>}
        {chart.aspects.map((a, i) => (
          <div className="data-row" key={i}>
            <div className="d-label">{ASPECT_SYMBOLS[a.aspect] ?? a.aspect}</div>
            <div className="d-main">
              {a.planet_a} {a.aspect} {a.planet_b}
            </div>
            <div className="d-tag">{formatDegree(a.orb)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
