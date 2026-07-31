import type { ChartResponse } from "@/lib/types";
import { ASPECT_SYMBOLS, formatDegree, formatWholeDegree, HARMONIOUS_ASPECTS, PLANET_ORDER, SIGN_ORDER } from "@/lib/astro";
import { toRoman } from "@/lib/format";
import { ANGLE_GLYPH, AstroGlyph, PLANET_GLYPH, SIGN_GLYPH } from "@/components/AstroGlyphs";

const SIZE = 560;
const CENTER = SIZE / 2;

// Every ring radius is a fraction of R (the outer limit) rather than an
// independently-tuned pixel value, so the wheel scales as one coherent
// instrument instead of a pile of separately-eyeballed numbers.
const R = 232;
const SIGN_BAND_OUTER_R = R * 1.0;
const SIGN_BAND_INNER_R = R * 0.84;
const SIGN_GLYPH_R = R * 0.92;
const HOUSE_RING_OUTER_R = R * 0.8;
const HOUSE_RING_INNER_R = R * 0.67;
const HOUSE_NUM_R = R * 0.73;
const PLANET_GLYPH_R = R * 0.62;
// Not drawn yet -- exported so the degree-label pass (whole-degree labels at
// a fixed ring instead of tucked under each glyph) has a home to land in.
export const DEGREE_LABEL_R = R * 0.545;
const ASPECT_R = R * 0.5;
const ANGLE_LABEL_R = SIGN_BAND_OUTER_R + 18;
// Planets carry no disc anymore (Tarefa 5) -- the glyph lands straight on the
// house ring, so its footprint for collision purposes is just its own size.
const PLANET_GLYPH_SIZE = 20;
// Minimum angular gap (degrees) between two planet glyphs at PLANET_GLYPH_R
// so their ~PLANET_GLYPH_SIZE-wide bounding boxes clear each other (chord
// length 2*PLANET_GLYPH_R*sin(sep/2) >= glyph size + a few px of breathing
// room). Below this, a planet gets nudged forward and a thin leader line
// ties its glyph back to its true degree.
export const MIN_PLANET_SEP = 10;

const ASPECT_LINE_SOFT = "#7D6B3E"; // trine/sextile -- solid, deep bronze
const ASPECT_LINE_HARD = "#A8553C"; // square/opposition -- dashed, terracotta

// Three-tier value structure so the wheel doesn't sink into a single flat
// tone: lightest at the center (aspects circle), stepping down to darkest at
// the rim (sign band). The panel itself (see the <rect> below) is darker
// than the page background it sits on, so the wheel reads as an object
// resting on the page rather than a hole cut into it.
const SIGN_BAND_FILL = "#DBCDAD";
const HOUSE_RING_FILL = "#E9E0CA";
const MIOLO_FILL = "#F8F3E6";
const RING_CONTOUR = "#A08D66";

// Traditional ceiling for a major aspect's orb (the classical "moiety"
// ballpark for luminary-involving aspects). The backend has already decided
// which aspects are within orb and returned only those; this constant exists
// solely to scale line weight, not to gate what's drawn.
const MAX_ASPECT_ORB = 8;

/** Tighter orb -> heavier line: 2.2 at an exact (0°) aspect down to 0.9 at
 * MAX_ASPECT_ORB or wider. Doctrinally motivated, not decorative -- a close
 * aspect is a stronger one, and this is the one place on the wheel that
 * carries that as a visual weight instead of just a number in a table. */
function aspectStrokeWidth(orb: number): number {
  const t = Math.min(Math.abs(orb), MAX_ASPECT_ORB) / MAX_ASPECT_ORB;
  return 2.2 - t * 1.3;
}

// Tarefa 9 (optional) -- tinting the sign band by triplicity/element. Kept
// as a single flag so it's a one-line revert if it reads as too "colorful"
// for the parchment/ink/bronze palette.
const SHOW_TRIPLICITY_TINT = true;
const SIGN_ELEMENT: Record<string, "fire" | "earth" | "air" | "water"> = {
  Aries: "fire",
  Leo: "fire",
  Sagittarius: "fire",
  Taurus: "earth",
  Virgo: "earth",
  Capricorn: "earth",
  Gemini: "air",
  Libra: "air",
  Aquarius: "air",
  Cancer: "water",
  Scorpio: "water",
  Pisces: "water",
};
const ELEMENT_TINT: Record<string, string> = {
  fire: "#D9BEA6",
  earth: "#C8CBA7",
  air: "#DFD6B1",
  water: "#BCC7C6",
};

/** A 30-degree sign wedge approximated as a polygon (not a true SVG arc --
 * that would need a sweep-flag tied to this wheel's rotation convention,
 * and a handful of straight segments at 5-degree resolution reads as a
 * smooth arc at this radius anyway). */
function sectorPath(startDeg: number, endDeg: number, innerR: number, outerR: number, ascLongitude: number): string {
  const steps = 6;
  const outerPts = Array.from({ length: steps + 1 }, (_, i) =>
    pointOnWheel(startDeg + ((endDeg - startDeg) * i) / steps, ascLongitude, outerR)
  );
  const innerPts = Array.from({ length: steps + 1 }, (_, i) =>
    pointOnWheel(startDeg + ((endDeg - startDeg) * i) / steps, ascLongitude, innerR)
  ).reverse();
  const pts = [...outerPts, ...innerPts];
  return `M${pts.map((p) => `${p.x},${p.y}`).join(" L ")} Z`;
}

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
export function layoutPlanetPositions(
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
    <div>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto block w-full" role="img" aria-label="Natal chart wheel">
        {/* Panel reads as an object sitting on the page, not a cutout: it's
            deliberately darker/warmer than the page background (#EDE6D6).
            Inside it, three concentric fills step from darkest at the rim
            (sign band) to lightest at the center (aspects circle) -- without
            that contrast the whole wheel sinks into one flat tone. */}
        <rect x={0} y={0} width={SIZE} height={SIZE} rx={10} fill="#E4DAC4" />
        {SHOW_TRIPLICITY_TINT ? (
          SIGN_ORDER.map((sign, i) => (
            <path
              key={sign}
              d={sectorPath(i * 30, i * 30 + 30, SIGN_BAND_INNER_R, SIGN_BAND_OUTER_R, ascLon)}
              fill={ELEMENT_TINT[SIGN_ELEMENT[sign]]}
            />
          ))
        ) : (
          <circle cx={CENTER} cy={CENTER} r={SIGN_BAND_OUTER_R} fill={SIGN_BAND_FILL} />
        )}
        <circle cx={CENTER} cy={CENTER} r={SIGN_BAND_INNER_R} fill="#E4DAC4" />
        <circle cx={CENTER} cy={CENTER} r={HOUSE_RING_OUTER_R} fill={HOUSE_RING_FILL} />
        <circle cx={CENTER} cy={CENTER} r={HOUSE_RING_INNER_R} fill={MIOLO_FILL} />
        <circle cx={CENTER} cy={CENTER} r={SIGN_BAND_OUTER_R} fill="none" stroke={RING_CONTOUR} strokeOpacity={0.65} />
        <circle cx={CENTER} cy={CENTER} r={SIGN_BAND_INNER_R} fill="none" stroke={RING_CONTOUR} strokeOpacity={0.5} />
        <circle cx={CENTER} cy={CENTER} r={HOUSE_RING_OUTER_R} fill="none" stroke={RING_CONTOUR} strokeOpacity={0.4} />
        <circle cx={CENTER} cy={CENTER} r={HOUSE_RING_INNER_R} fill="none" stroke={RING_CONTOUR} strokeOpacity={0.4} />
        <circle cx={CENTER} cy={CENTER} r={ASPECT_R} fill="none" stroke={RING_CONTOUR} strokeOpacity={0.3} />

        {/* Degree ticks, graduated like an instrument rim: every 1 degree gets
            a short hairline, every 5th a medium tick, every 10th a long,
            heavier one. They project inward from the sign band's inner edge
            (sign cusps get their own full spoke below, so multiples of 30
            are skipped here). This is what separates an instrument from an
            illustration -- not optional polish. */}
        {Array.from({ length: 360 }, (_, deg) => deg)
          .filter((deg) => deg % 30 !== 0)
          .map((deg) => {
            const isTen = deg % 10 === 0;
            const isFive = deg % 5 === 0;
            const length = isTen ? R * 0.045 : isFive ? R * 0.028 : R * 0.015;
            const outer = pointOnWheel(deg, ascLon, SIGN_BAND_INNER_R);
            const inner = pointOnWheel(deg, ascLon, SIGN_BAND_INNER_R - length);
            return (
              <line
                key={deg}
                x1={outer.x}
                y1={outer.y}
                x2={inner.x}
                y2={inner.y}
                stroke={RING_CONTOUR}
                strokeOpacity={isTen ? 0.55 : isFive ? 0.4 : 0.25}
                strokeWidth={isTen ? 1.1 : isFive ? 0.7 : 0.4}
              />
            );
          })}

        {/* House/sign cusp spokes, sign glyphs, and house numbers */}
        {SIGN_ORDER.map((sign, i) => {
          const cuspLon = i * 30;
          const houseNum = (((cuspLon - ascSignStart) / 30) % 12 + 12) % 12 + 1;
          const outer = pointOnWheel(cuspLon, ascLon, SIGN_BAND_OUTER_R);
          const inner = pointOnWheel(cuspLon, ascLon, ASPECT_R);
          const signMid = pointOnWheel(cuspLon + 15, ascLon, SIGN_GLYPH_R);
          const housePos = pointOnWheel(cuspLon + 5, ascLon, HOUSE_NUM_R);
          const signGlyphSize = 14;
          return (
            <g key={sign}>
              <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="#B08D57" strokeOpacity={0.28} />
              <g transform={`translate(${signMid.x - signGlyphSize / 2},${signMid.y - signGlyphSize / 2})`} opacity={0.5}>
                <AstroGlyph name={SIGN_GLYPH[sign]} size={signGlyphSize} color="#1B2438" />
              </g>
              <text
                x={housePos.x}
                y={housePos.y}
                fill="#1B2438"
                fillOpacity={0.45}
                fontSize={12}
                fontFamily="var(--font-cinzel), serif"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {toRoman(houseNum)}
              </text>
            </g>
          );
        })}

        {/* ASC/DSC and MC/IC axis. Opacity deliberately outranks the aspect
            lines below (0.85) -- angles sit second in the wheel's visual
            hierarchy, right after the planet glyphs themselves. */}
        {(["ASC", "MC"] as const).map((label) => {
          const opposite = label === "ASC" ? "DSC" : "IC";
          const a = pointOnWheel(anglePoints[label], ascLon, SIGN_BAND_OUTER_R);
          const b = pointOnWheel(anglePoints[opposite], ascLon, SIGN_BAND_OUTER_R);
          return (
            <line
              key={label}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="#1B2438"
              strokeOpacity={0.9}
              strokeDasharray={label === "MC" ? "4 3" : undefined}
            />
          );
        })}
        {(Object.keys(anglePoints) as (keyof typeof anglePoints)[]).map((label) => {
          const p = pointOnWheel(anglePoints[label], ascLon, ANGLE_LABEL_R);
          const size = 16;
          return (
            <g key={label} transform={`translate(${p.x - size / 2},${p.y - size / 2})`}>
              <AstroGlyph name={ANGLE_GLYPH[label]} size={size} color="#1B2438" />
            </g>
          );
        })}

        {/* Aspect lines. Conjunction is deliberately never drawn here -- at
            near-zero angular separation a line communicates nothing; it's
            still listed in the Aspects table below the wheel. Color and dash
            redundantly encode the same soft/hard distinction as stroke width
            encodes orb tightness, so the chart doesn't depend on color
            perception alone. */}
        {chart.aspects.map((aspect, i) => {
          if (aspect.aspect === "conjunction") return null;
          const a = positionFor(aspect.planet_a);
          const b = positionFor(aspect.planet_b);
          if (a === undefined || b === undefined) return null;
          const p1 = pointOnWheel(a.longitude, ascLon, ASPECT_R);
          const p2 = pointOnWheel(b.longitude, ascLon, ASPECT_R);
          const soft = HARMONIOUS_ASPECTS.has(aspect.aspect);
          return (
            <line
              key={`${aspect.planet_a}-${aspect.planet_b}-${i}`}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={soft ? ASPECT_LINE_SOFT : ASPECT_LINE_HARD}
              strokeOpacity={0.85}
              strokeWidth={aspectStrokeWidth(aspect.orb)}
              strokeDasharray={soft ? undefined : "4 3"}
            >
              <title>
                {aspect.planet_a} {ASPECT_SYMBOLS[aspect.aspect] ?? aspect.aspect} {aspect.planet_b} (orb{" "}
                {aspect.orb.toFixed(1)}°)
              </title>
            </line>
          );
        })}

        {/* Planets — nudged apart by layoutPlanetPositions when crowded, with a
            thin leader tying the glyph back to its true degree on the rim. */}
        {planetLayout.map(({ name, trueLongitude, displayLongitude }) => {
          const planet = chart.planets[name];
          const p = pointOnWheel(displayLongitude, ascLon, PLANET_GLYPH_R);
          const truePoint = pointOnWheel(trueLongitude, ascLon, SIGN_BAND_INNER_R);
          const rawDiff = Math.abs(displayLongitude - trueLongitude) % 360;
          const nudged = Math.min(rawDiff, 360 - rawDiff) > 0.01;
          return (
            <g key={name}>
              <title>
                {name} {formatDegree(planet.sign_longitude)} {planet.sign}
                {planet.retrograde ? " ℞ retrograde" : ""}
              </title>
              {nudged && (
                <line
                  x1={truePoint.x}
                  y1={truePoint.y}
                  x2={p.x}
                  y2={p.y}
                  stroke={RING_CONTOUR}
                  strokeOpacity={0.4}
                  strokeWidth={0.75}
                />
              )}
              {/* No disc: at this point the ring's own value contrast (Tarefa
                  2) already separates the ink glyph from its background, the
                  way it would sit directly on a printed ephemeris. */}
              <g transform={`translate(${p.x - PLANET_GLYPH_SIZE / 2},${p.y - PLANET_GLYPH_SIZE / 2})`}>
                <AstroGlyph name={PLANET_GLYPH[name]} size={PLANET_GLYPH_SIZE} color="#1B2438" />
              </g>
              {/* Whole-degree label -- the wheel is the spatial view now, exact
                  minutes live in the side table. Retrograde rides as a small
                  subscript glued to the degree, not a separate corner mark. */}
              <text
                x={p.x - (planet.retrograde ? 4 : 0)}
                y={p.y + PLANET_GLYPH_SIZE + 11}
                fill="#1B2438"
                fontSize={10}
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {formatWholeDegree(planet.sign_longitude)}
              </text>
              {planet.retrograde && (
                <g transform={`translate(${p.x + 10},${p.y + PLANET_GLYPH_SIZE + 14})`}>
                  <AstroGlyph name="retrograde" size={7} color="#1B2438" title={`${name} retrograde`} />
                </g>
              )}
            </g>
          );
        })}
      </svg>

      <div className="mx-auto mt-3 flex max-w-[420px] flex-wrap items-center justify-center gap-x-4 gap-y-1 font-cormorant text-xs italic text-ink-2">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block h-0 w-4 border-t-2" style={{ borderColor: ASPECT_LINE_SOFT }} />
          Trine / sextile
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="inline-block h-0 w-4 border-t-2 border-dashed"
            style={{ borderColor: ASPECT_LINE_HARD }}
          />
          Square / opposition
        </span>
        <span>Heavier line = tighter orb</span>
      </div>
    </div>
  );
}
