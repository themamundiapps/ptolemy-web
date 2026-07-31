"use client";

import { useState } from "react";
import ChartWheel from "@/components/ChartWheel";
import DetailModal, { ModalSection } from "@/components/DetailModal";
import {
  ApiError,
  fetchAspectInterpretation,
  fetchLotInterpretation,
  fetchPlanetInHouse,
  fetchPlanetInSign,
} from "@/lib/api";
import { PLANET_ORDER, dignityLabel, formatDegree, oppositePoint } from "@/lib/astro";
import { ANGLE_GLYPH, ASPECT_GLYPH, AstroGlyph, LOT_GLYPH, PLANET_GLYPH } from "@/components/AstroGlyphs";
import type { ChartResponse, Interpretation } from "@/lib/types";

type ModalTarget =
  | { kind: "planet"; planet: string; sign: string; house: number }
  | { kind: "lot"; label: string; lotKey: string; sign: string; house: number }
  | { kind: "aspect"; planetA: string; planetB: string; aspect: string };

function titleFor(target: ModalTarget): string {
  if (target.kind === "planet") return target.planet;
  if (target.kind === "lot") return target.label;
  return `${target.planetA} ${target.aspect} ${target.planetB}`;
}

export default function ChartTab({ chart }: { chart: ChartResponse }) {
  const [active, setActive] = useState<ModalTarget | null>(null);
  const [sections, setSections] = useState<{ label?: string; interp: Interpretation }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openModal = async (target: ModalTarget) => {
    setActive(target);
    setSections([]);
    setError(null);
    setLoading(true);
    try {
      if (target.kind === "planet") {
        const [signInterp, houseInterp] = await Promise.all([
          fetchPlanetInSign(target.planet, target.sign),
          fetchPlanetInHouse(target.planet, target.house),
        ]);
        setSections([
          { label: `In ${target.sign}`, interp: signInterp },
          { label: `In House ${target.house}`, interp: houseInterp },
        ]);
      } else if (target.kind === "lot") {
        const interp = await fetchLotInterpretation(target.lotKey, target.sign, target.house);
        setSections([{ interp }]);
      } else {
        const interp = await fetchAspectInterpretation(target.planetA, target.planetB, target.aspect);
        setSections([{ interp }]);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load this interpretation.");
    } finally {
      setLoading(false);
    }
  };

  const planetRows = PLANET_ORDER.filter((name) => chart.planets[name]).map((name) => ({
    name,
    position: chart.planets[name],
  }));

  const descendant = oppositePoint(chart.ascendant);
  const ic = oppositePoint(chart.midheaven);

  return (
    <div>
      <div className="chart-layout">
        <div className="data-card">
          <ChartWheel chart={chart} />
        </div>

        <div className="data-card">
          <h4>Planets</h4>
          {planetRows.map((row) => (
            <button
              type="button"
              className="data-row planet-row"
              key={row.name}
              onClick={() => openModal({ kind: "planet", planet: row.name, sign: row.position.sign, house: row.position.house })}
            >
              <span className="d-glyph">
                <AstroGlyph name={PLANET_GLYPH[row.name]} size={18} color="var(--bronze-deep)" />
              </span>
              <span className="d-col d-col-name">{row.name}</span>
              <span className="d-col d-col-sign">
                {row.position.sign} {formatDegree(row.position.sign_longitude)}
                {row.position.retrograde && (
                  <span style={{ marginLeft: 4 }}>
                    <AstroGlyph name="retrograde" size={11} title={`${row.name} retrograde`} />
                  </span>
                )}
              </span>
              <span className="d-col d-col-house">House {row.position.house}</span>
              <span className="d-col d-col-dignity">
                {row.position.dignities.length > 0 ? dignityLabel(row.position.dignities) : ""}
              </span>
              <span className="d-chevron">›</span>
            </button>
          ))}
        </div>
      </div>

      <div className="data-card">
        <h4>Angles</h4>
        <div className="data-row">
          <div className="d-label">
            <AstroGlyph name={ANGLE_GLYPH.ASC} size={14} title="Ascendant" />
          </div>
          <div className="d-main">
            {chart.ascendant.sign} {formatDegree(chart.ascendant.sign_longitude)} · House {chart.ascendant.house}
          </div>
        </div>
        <div className="data-row">
          <div className="d-label">
            <AstroGlyph name={ANGLE_GLYPH.DSC} size={14} title="Descendant" />
          </div>
          <div className="d-main">
            {descendant.sign} {formatDegree(descendant.sign_longitude)} · House {descendant.house}
          </div>
        </div>
        <div className="data-row">
          <div className="d-label">
            <AstroGlyph name={ANGLE_GLYPH.MC} size={14} title="Midheaven" />
          </div>
          <div className="d-main">
            {chart.midheaven.sign} {formatDegree(chart.midheaven.sign_longitude)} · House {chart.midheaven.house}
          </div>
        </div>
        <div className="data-row">
          <div className="d-label">
            <AstroGlyph name={ANGLE_GLYPH.IC} size={14} title="Imum Coeli" />
          </div>
          <div className="d-main">
            {ic.sign} {formatDegree(ic.sign_longitude)} · House {ic.house}
          </div>
        </div>
      </div>

      <div className="data-card">
        <h4>Lots</h4>
        <button
          type="button"
          className="data-row"
          onClick={() =>
            openModal({
              kind: "lot",
              label: "Lot of Fortune",
              lotKey: "fortune",
              sign: chart.lot_of_fortune.sign,
              house: chart.lot_of_fortune.house,
            })
          }
        >
          <div className="d-label">
            <AstroGlyph name={LOT_GLYPH.fortune} size={14} />
          </div>
          <div className="d-main">
            Lot of Fortune — {chart.lot_of_fortune.sign} {formatDegree(chart.lot_of_fortune.sign_longitude)} · House{" "}
            {chart.lot_of_fortune.house}
          </div>
        </button>
        <button
          type="button"
          className="data-row"
          onClick={() =>
            openModal({
              kind: "lot",
              label: "Lot of Spirit",
              lotKey: "spirit",
              sign: chart.lot_of_spirit.sign,
              house: chart.lot_of_spirit.house,
            })
          }
        >
          <div className="d-label">
            <AstroGlyph name={LOT_GLYPH.spirit} size={14} />
          </div>
          <div className="d-main">
            Lot of Spirit — {chart.lot_of_spirit.sign} {formatDegree(chart.lot_of_spirit.sign_longitude)} · House{" "}
            {chart.lot_of_spirit.house}
          </div>
        </button>
      </div>

      <div className="data-card">
        <h4>Aspects</h4>
        {chart.aspects.length === 0 && <p className="empty">No major aspects within orb.</p>}
        {chart.aspects.map((a, i) => (
          <button
            type="button"
            className="data-row"
            key={i}
            onClick={() => openModal({ kind: "aspect", planetA: a.planet_a, planetB: a.planet_b, aspect: a.aspect })}
          >
            <div className="d-label">
              <AstroGlyph name={ASPECT_GLYPH[a.aspect]} size={14} title={a.aspect} />
            </div>
            <div className="d-main">
              {a.planet_a} {a.aspect} {a.planet_b}
            </div>
            <div className="d-tag">{formatDegree(a.orb)}</div>
          </button>
        ))}
      </div>

      {active && (
        <DetailModal title={titleFor(active)} onClose={() => setActive(null)}>
          {loading && <p>Reading the doctrine…</p>}
          {error && <p style={{ color: "var(--terracotta)" }}>{error}</p>}
          {sections.map((s, i) => (
            <ModalSection key={i} label={s.label} body={s.interp.body} citation={s.interp.citation || undefined} />
          ))}
        </DetailModal>
      )}
    </div>
  );
}
