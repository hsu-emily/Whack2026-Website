import { useRef, useState, useCallback, useMemo } from "react";

/* lighten a hex toward white by t (0..1) */
function lighten(hex, t) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const m = (v) => Math.round(v + (255 - v) * t).toString(16).padStart(2, "0");
  return `#${m(r)}${m(g)}${m(b)}`;
}

/* convert a CSS-style angle (deg) into linearGradient x1/y1/x2/y2 (%) */
function angleVec(deg) {
  const r = ((deg - 90) * Math.PI) / 180;
  const x = Math.cos(r), y = Math.sin(r);
  return {
    x1: `${(50 - x * 50).toFixed(1)}%`, y1: `${(50 - y * 50).toFixed(1)}%`,
    x2: `${(50 + x * 50).toFixed(1)}%`, y2: `${(50 + y * 50).toFixed(1)}%`,
  };
}

/**
 * Cloud — reusable airbrushed cloud with a soft edge, a fully configurable
 * gradient, optional Figma-style grain, and optional gentle flow.
 *
 * Color (use ONE):
 *   color        {string}            base color; glow + tint are derived for you
 *   colors       {string[]}          any number of stops, light center -> deep edge
 *
 * Gradient:
 *   gradient     {"radial"|"linear"} default "radial"
 *   angle        {number}            linear angle in deg (default 135)
 *   glow         {{x,y}}             radial focal point in % (default {x:42,y:40})
 *   glowRadius   {number}            radial size in % (default 72)
 *
 * Grain (Figma-style noise over the gradient):
 *   grain        {number}            0 (off) .. 1 strong (default 0)
 *   grainSize    {number}            noise frequency, ~0.25 coarse .. 1.2 fine (default 0.6)
 *
 * Look & feel:
 *   width        {number|string}     default 320
 *   height       {number|string}     optional; auto from ratio if omitted
 *   fuzziness    {number}            edge softness, ~8 crisp .. 50 soft (default 30)
 *   opacity      {number}            0-1 (default 1)
 *   seed         {number}            silhouette/noise seed. omit -> random each mount
 *
 *   flow         {boolean}           slowly drift the gradient through colors
 *   flowSpeed    {number}            seconds per cycle (default 20)
 *   flowPalette  {Array<[a,b]>}      colors the gradient flows through
 *
 * Interaction (opt-in):
 *   drift, driftSpeed, hover, parallax, onClick
 *   className, style
 */
export default function Cloud({
  color,
  colors,
  gradient = "radial",
  angle = 135,
  glow = { x: 42, y: 40 },
  glowRadius = 72,
  grain = 0,
  grainSize = 0.6,
  width = 320,
  height,
  fuzziness = 30,
  opacity = 1,
  seed,
  flow = false,
  flowSpeed = 20,
  flowPalette = [
    ["#e4f0fc", "#bcd9f6"],
    ["#ece4fb", "#cbb8ee"],
    ["#fdeae0", "#f8c3ae"],
    ["#e2f8ee", "#bce8d6"],
    ["#dfe8ff", "#9fb4e8"],
  ],
  drift = false,
  driftSpeed = 9,
  hover = false,
  parallax = 0,
  onClick,
  className = "",
  style = {},
}) {
  const uid = useRef(`cl${Math.random().toString(36).slice(2, 7)}`).current;
  const s = useRef(seed ?? Math.floor(Math.random() * 9999)).current;

  const [hovered, setHovered] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // resolve stops: explicit `colors` (any length) wins, else derive from `color`
  const stops = useMemo(() => {
    if (Array.isArray(colors) && colors.length >= 2) return colors;
    const base = color ?? "#bcd9f6";
    return [lighten(base, 0.92), lighten(base, 0.55), base];
  }, [colors, color]);

  const w = typeof width === "number" ? `${width}px` : width;
  const h = height != null ? (typeof height === "number" ? `${height}px` : height) : undefined;

  const lin = useMemo(() => angleVec(angle), [angle]);

  // flow value lists, generated per stop so any stop count works
  const flowValues = (base, i) => {
    const seq = flowPalette.map((p) => (i <= 1 ? p[0] : p[p.length - 1]));
    return [base, ...seq, base].join(";");
  };

  const handleMove = useCallback(
    (e) => {
      if (!parallax) return;
      const r = e.currentTarget.getBoundingClientRect();
      const dx = (e.clientX - r.left) / r.width - 0.5;
      const dy = (e.clientY - r.top) / r.height - 0.5;
      setOffset({ x: dx * parallax, y: dy * parallax * 0.6 });
    },
    [parallax]
  );

  const reset = useCallback(() => {
    setHovered(false);
    setOffset({ x: 0, y: 0 });
  }, []);

  const transform =
    `translate(${offset.x}px, ${offset.y}px)` + (hover && hovered ? " scale(1.07)" : "");

  const stopEls = stops.map((c, i) => (
    <stop key={i} offset={`${Math.round((i / (stops.length - 1)) * 100)}%`} stopColor={c}>
      {flow && i > 0 && (
        <animate attributeName="stop-color" values={flowValues(c, i)} dur={`${flowSpeed}s`} repeatCount="indefinite" />
      )}
    </stop>
  ));

  return (
    <div
      className={className}
      onClick={onClick}
      onMouseMove={handleMove}
      onMouseEnter={() => hover && setHovered(true)}
      onMouseLeave={reset}
      style={{
        position: "relative",
        width: w,
        height: h,
        opacity,
        cursor: onClick ? "pointer" : "default",
        transform,
        transition: "transform .4s cubic-bezier(.22,1,.36,1), filter .4s",
        filter: hover && hovered ? "brightness(1.12)" : undefined,
        animation: drift ? `cloud-drift-${uid} ${driftSpeed}s ease-in-out infinite` : undefined,
        ...style,
      }}
    >
      <style>{`
        @keyframes cloud-drift-${uid}{0%,100%{translate:0 0}50%{translate:12px -9px}}
        @media (prefers-reduced-motion: reduce){[style*="cloud-drift-${uid}"]{animation:none!important}}
      `}</style>

      <svg viewBox="0 0 360 180" width="100%" height={h ? "100%" : undefined}
        style={{ overflow: "visible", display: "block" }}
        xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          {gradient === "linear" ? (
            <linearGradient id={`${uid}-g`} x1={lin.x1} y1={lin.y1} x2={lin.x2} y2={lin.y2}>
              {stopEls}
            </linearGradient>
          ) : (
            <radialGradient id={`${uid}-g`} cx={`${glow.x}%`} cy={`${glow.y}%`} r={`${glowRadius}%`}>
              {stopEls}
              {flow && <animate attributeName="cx" values={`${glow.x}%;${glow.x + 12}%;${glow.x - 6}%;${glow.x}%`} dur={`${flowSpeed * 1.2}s`} repeatCount="indefinite" />}
              {flow && <animate attributeName="cy" values={`${glow.y}%;${glow.y - 6}%;${glow.y + 6}%;${glow.y}%`} dur={`${flowSpeed * 0.95}s`} repeatCount="indefinite" />}
            </radialGradient>
          )}

          {/* soft airbrushed edge + optional grain, all clipped to the shape */}
          <filter id={`${uid}-core`} x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence type="fractalNoise" baseFrequency="0.013" numOctaves="4" seed={s} result="warp" />
            <feDisplacementMap in="SourceGraphic" in2="warp" scale={fuzziness} xChannelSelector="R" yChannelSelector="G" result="shape" />
            {grain > 0 && (
              <>
                <feTurbulence type="fractalNoise" baseFrequency={grainSize} numOctaves="2" seed={s + 3} result="gn" />
                <feColorMatrix in="gn" type="matrix"
                  values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${grain} 0 0 0 0`} result="grainA" />
                <feComposite in="grainA" in2="shape" operator="in" result="gm" />
                <feBlend in="shape" in2="gm" mode="multiply" result="grained" />
              </>
            )}
            <feGaussianBlur in={grain > 0 ? "grained" : "shape"} stdDeviation="1.1" />
          </filter>

          <path id={`${uid}-blob`} d="M 30 122 C 14 100 42 86 64 92 C 74 70 106 76 118 94 C 132 58 178 50 196 76 C 210 34 272 20 300 48 C 330 42 350 74 342 100 C 352 122 336 142 310 142 L 48 142 C 22 142 36 132 30 122 Z" />
        </defs>

        <use href={`#${uid}-blob`} fill={`url(#${uid}-g)`} filter={`url(#${uid}-core)`} />
      </svg>
    </div>
  );
}


/* ─── Example sky scene ──────────────────────────────────────────── */

export function SkyScene() {
  return (
    <div style={{
      position: "relative", height: 320, overflow: "hidden", borderRadius: 18,
      background: "linear-gradient(165deg,#e6edfb 0%,#d2ddf4 50%,#bcc9ee 100%)",
    }}>
      <Cloud color="#7fb4f0" width={280} grain={0.45} flow drift hover parallax={28}
        style={{ position: "absolute", left: "5%", top: "14%" }} />

      <Cloud color="#b39ae6" width={190} grain={0.5} gradient="linear" angle={120}
        flow flowSpeed={26} drift driftSpeed={11} hover parallax={16}
        style={{ position: "absolute", left: "56%", top: "8%" }} />

      <Cloud color="#f4a6c4" width={150} grain={0.4} opacity={0.9}
        drift driftSpeed={9} parallax={40}
        style={{ position: "absolute", left: "42%", top: "54%" }} />
    </div>
  );
}
