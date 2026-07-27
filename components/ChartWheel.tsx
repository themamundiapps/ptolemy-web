import type { ChartResponse } from "@/lib/types";
import { ASPECT_SYMBOLS, HARMONIOUS_ASPECTS, PLANET_ORDER, PLANET_SYMBOLS, SIGN_ORDER, SIGN_SYMBOLS } from "@/lib/astro";

const SIZE = 560;
const CENTER = SIZE / 2;
const OUTER_R = 232;
const SIGN_RING_R = 198;
const HOUSE_NUM_R = 178;
const PLANET_R = 152;
const PLANET_R_INNER = 124;
const ASPECT_R = 96;
const ANGLE_LABEL_R = OUTER_R + 18;

function pointOnWheel(longitude: number, ascLongitude: number, radius: number) {
  const thetaDeg = 180 + (longitude - ascLongitude);
  const thetaRad = (thetaDeg * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.cos(thetaRad),
    y: CENTER - radius * Math.sin(thetaRad),
  };
}

export default function ChartWheel({ chart }: { chart: ChartResponse }) {
  const ascLon = chart.ascendant.longitude;
  const mcLon = chart.midheaven.longitude;
  // Whole-sign houses: house cusps fall on sign boundaries, starting at the
  // Ascendant's own sign (house 1), so every sign wedge doubles as a house.
  const ascSignStart = Math.floor(ascLon / 30) * 30;

  const anglePoints = {
    ASC: ascLon,
    DSC: (ascLon + 180) % 360,
    MC: mcLon,
    IC: (mcLon + 180) % 360,
  };

  const planetEntries = PLANET_ORDER.filter((name) => chart.planets[name]).map((name) => ({
    name,
    ...chart.planets[name],
  }));
  const sortedByLongitude = [...planetEntries].sort((a, b) => a.longitude - b.longitude);
  const usedInnerRadius = new Set<string>();
  sortedByLongitude.forEach((planet, i) => {
    const prev = sortedByLongitude[i - 1];
    if (prev) {
      const gap = Math.min(Math.abs(planet.longitude - prev.longitude), 360 - Math.abs(planet.longitude - prev.longitude));
      if (gap < 8 && !usedInnerRadius.has(prev.name)) {
        usedInnerRadius.add(planet.name);
      }
    }
  });

  function positionFor(name: string): { longitude: number } | undefined {
    if (name in anglePoints) return { longitude: anglePoints[name as keyof typeof anglePoints] };
    if (chart.planets[name]) return { longitude: chart.planets[name].longitude };
    return undefined;
  }

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto block w-full" role="img" aria-label="Natal chart wheel">
      <rect x={0} y={0} width={SIZE} height={SIZE} rx={10} fill="#1B2438" />
      <circle cx={CENTER} cy={CENTER} r={OUTER_R} fill="none" stroke="#B08D57" strokeOpacity={0.65} />
      <circle cx={CENTER} cy={CENTER} r={SIGN_RING_R} fill="none" stroke="#B08D57" strokeOpacity={0.5} />
      <circle cx={CENTER} cy={CENTER} r={ASPECT_R} fill="none" stroke="#B08D57" strokeOpacity={0.35} />

      {/* House/sign cusp spokes, sign glyphs, and house numbers */}
      {SIGN_ORDER.map((sign, i) => {
        const cuspLon = i * 30;
        const houseNum = (((cuspLon - ascSignStart) / 30) % 12 + 12) % 12 + 1;
        const outer = pointOnWheel(cuspLon, ascLon, OUTER_R);
        const inner = pointOnWheel(cuspLon, ascLon, ASPECT_R);
        const signMid = pointOnWheel(cuspLon + 15, ascLon, (OUTER_R + SIGN_RING_R) / 2);
        const housePos = pointOnWheel(cuspLon + 5, ascLon, HOUSE_NUM_R);
        return (
          <g key={sign}>
            <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="#B08D57" strokeOpacity={0.28} />
            <text x={signMid.x} y={signMid.y} fill="#D9C08F" fontSize={19} textAnchor="middle" dominantBaseline="middle">
              {SIGN_SYMBOLS[sign]}
            </text>
            <text
              x={housePos.x}
              y={housePos.y}
              fill="#E4DAC5"
              fillOpacity={0.6}
              fontSize={13}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {houseNum}
            </text>
          </g>
        );
      })}

      {/* ASC/DSC and MC/IC axis */}
      {(["ASC", "MC"] as const).map((label) => {
        const opposite = label === "ASC" ? "DSC" : "IC";
        const a = pointOnWheel(anglePoints[label], ascLon, OUTER_R);
        const b = pointOnWheel(anglePoints[opposite], ascLon, OUTER_R);
        return (
          <line
            key={label}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke="#E4DAC5"
            strokeOpacity={0.45}
            strokeDasharray={label === "MC" ? "4 3" : undefined}
          />
        );
      })}
      {(Object.keys(anglePoints) as (keyof typeof anglePoints)[]).map((label) => {
        const p = pointOnWheel(anglePoints[label], ascLon, ANGLE_LABEL_R);
        return (
          <text key={label} x={p.x} y={p.y} fill="#E4DAC5" fontSize={14} textAnchor="middle" dominantBaseline="middle">
            {label}
          </text>
        );
      })}

      {/* Aspect lines */}
      {chart.aspects.map((aspect, i) => {
        const a = positionFor(aspect.planet_a);
        const b = positionFor(aspect.planet_b);
        if (a === undefined || b === undefined) return null;
        const p1 = pointOnWheel(a.longitude, ascLon, ASPECT_R);
        const p2 = pointOnWheel(b.longitude, ascLon, ASPECT_R);
        const harmonious = HARMONIOUS_ASPECTS.has(aspect.aspect);
        return (
          <line
            key={`${aspect.planet_a}-${aspect.planet_b}-${i}`}
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke={harmonious ? "#B08D57" : "#C2705A"}
            strokeOpacity={0.65}
            strokeWidth={aspect.aspect === "conjunction" ? 1.5 : 1}
          >
            <title>
              {aspect.planet_a} {ASPECT_SYMBOLS[aspect.aspect] ?? aspect.aspect} {aspect.planet_b} (orb {aspect.orb.toFixed(1)}°)
            </title>
          </line>
        );
      })}

      {/* Planets */}
      {planetEntries.map((planet) => {
        const radius = usedInnerRadius.has(planet.name) ? PLANET_R_INNER : PLANET_R;
        const p = pointOnWheel(planet.longitude, ascLon, radius);
        return (
          <g key={planet.name}>
            <circle cx={p.x} cy={p.y} r={15} fill="#E4DAC5" stroke="#B08D57" strokeOpacity={0.8} />
            <text x={p.x} y={p.y} fill="#1B2438" fontSize={17} textAnchor="middle" dominantBaseline="middle">
              {PLANET_SYMBOLS[planet.name] ?? planet.name.slice(0, 2)}
            </text>
            {planet.retrograde && (
              <text x={p.x + 14} y={p.y - 11} fill="#D9836B" fontSize={11}>
                ℞
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
