import type { ChartResponse } from "@/lib/types";
import { ASPECT_SYMBOLS, HARMONIOUS_ASPECTS, PLANET_ORDER, PLANET_SYMBOLS, SIGN_ORDER, SIGN_SYMBOLS } from "@/lib/astro";

const SIZE = 560;
const CENTER = SIZE / 2;
const OUTER_R = 232;
const SIGN_RING_R = 198;
const HOUSE_NUM_R = 178;
const PLANET_R = 148;
const ASPECT_R = 96;
const ANGLE_LABEL_R = OUTER_R + 18;
// Minimum angular gap (degrees) between two planet glyphs at PLANET_R so
// their circles (r=15) never touch. Below this, a planet gets nudged
// forward and a thin leader line ties its glyph back to its true degree.
const MIN_PLANET_SEP = 13;

function pointOnWheel(longitude: number, ascLongitude: number, radius: number) {
  const thetaDeg = 180 + (longitude - ascLongitude);
  const thetaRad = (thetaDeg * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.cos(thetaRad),
    y: CENTER - radius * Math.sin(thetaRad),
  };
}

/**
 * Spread out planets that fall within MIN_PLANET_SEP of each other so their
 * glyphs never overlap, starting from the widest open gap in the chart (so
 * the nudging never has to wrap around 0°/360°). Each result keeps both the
 * true longitude (for aspect lines and the leader tick) and the adjusted
 * display longitude (for where the glyph is actually drawn).
 */
function layoutPlanetPositions(
  entries: { name: string; longitude: number }[]
): { name: string; trueLongitude: number; displayLongitude: number }[] {
  if (entries.length === 0) return [];
  const sorted = [...entries].sort((a, b) => a.longitude - b.longitude);
  const n = sorted.length;

  let gapStart = 0;
  let maxGap = -1;
  for (let i = 0; i < n; i++) {
    const cur = sorted[i].longitude;
    const next = sorted[(i + 1) % n].longitude;
    const gap = ((next - cur + 360) % 360) || 360;
    if (gap > maxGap) {
      maxGap = gap;
      gapStart = (i + 1) % n;
    }
  }

  const ordered = [...sorted.slice(gapStart), ...sorted.slice(0, gapStart)];
  const base = ordered[0].longitude;
  const unrolled = ordered.map((p) => ({ ...p, lon: p.longitude < base ? p.longitude + 360 : p.longitude }));

  let prevDisplay = -Infinity;
  return unrolled.map((p) => {
    const display = Math.max(p.lon, prevDisplay + MIN_PLANET_SEP);
    prevDisplay = display;
    return { name: p.name, trueLongitude: p.longitude, displayLongitude: ((display % 360) + 360) % 360 };
  });
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
  const planetLayout = layoutPlanetPositions(planetEntries.map(({ name, longitude }) => ({ name, longitude })));

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

      {/* Degree ticks, like a graduated instrument rim (sign cusps get their own full spoke below) */}
      {Array.from({ length: 72 }, (_, idx) => idx * 5)
        .filter((deg) => deg % 30 !== 0)
        .map((deg) => {
          const isTen = deg % 10 === 0;
          const outer = pointOnWheel(deg, ascLon, OUTER_R);
          const inner = pointOnWheel(deg, ascLon, OUTER_R - (isTen ? 10 : 5));
          return (
            <line
              key={deg}
              x1={outer.x}
              y1={outer.y}
              x2={inner.x}
              y2={inner.y}
              stroke="#B08D57"
              strokeOpacity={isTen ? 0.55 : 0.3}
              strokeWidth={isTen ? 1 : 0.75}
            />
          );
        })}

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

      {/* Planets — nudged apart by layoutPlanetPositions when crowded, with a
          thin leader tying the glyph back to its true degree on the rim. */}
      {planetLayout.map(({ name, trueLongitude, displayLongitude }) => {
        const planet = chart.planets[name];
        const p = pointOnWheel(displayLongitude, ascLon, PLANET_R);
        const truePoint = pointOnWheel(trueLongitude, ascLon, SIGN_RING_R);
        const rawDiff = Math.abs(displayLongitude - trueLongitude) % 360;
        const nudged = Math.min(rawDiff, 360 - rawDiff) > 0.01;
        return (
          <g key={name}>
            {nudged && (
              <line x1={truePoint.x} y1={truePoint.y} x2={p.x} y2={p.y} stroke="#B08D57" strokeOpacity={0.35} strokeWidth={0.75} />
            )}
            <circle cx={p.x} cy={p.y} r={15} fill="#E4DAC5" stroke="#B08D57" strokeOpacity={0.8} />
            <text x={p.x} y={p.y} fill="#1B2438" fontSize={17} textAnchor="middle" dominantBaseline="middle">
              {PLANET_SYMBOLS[name] ?? name.slice(0, 2)}
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
