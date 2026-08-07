import { useEffect, useRef } from 'react';

import frontPillars from '../assets/hourglass/1_frontpillars.png';
import glassLayer from '../assets/hourglass/2_glass.png';
import starLayer from '../assets/hourglass/3_star.png';
import topBubble from '../assets/hourglass/4_topbubble.png';
import moonLayer from '../assets/hourglass/5_moon.png';
import bottomBubble from '../assets/hourglass/6_bottombubble.png';
import backPillars from '../assets/hourglass/7_backpillars.png';
import caseLayer from '../assets/hourglass/8_case.png';
import backGlow from '../assets/hourglass/9_backglow.png';

/**
 * Hourglass — layered PNG hourglass.
 *
 * The nine art layers are all square (2048×2048) and pre-registered, so they
 * stack as absolutely-positioned overlays filling the frame. File numbering is
 * the paint order: 1 is the frontmost layer, 9 the backmost.
 *
 * The star (layer 3) and moon (layer 5) drift around inside their own glass
 * bulbs, bouncing off the bulb walls. Bounds below are fractions of the frame
 * measured off the glass art: the star lives in the top bulb, the moon in the
 * bottom one. Because each PNG is a full-frame canvas with the art painted in
 * place, we move them by translating the whole layer — a translation of 0,0
 * leaves the piece exactly where the artist drew it.
 *
 * Props:
 *   progress    number  0–1. Currently drives the glow/pulse intensity.
 *   showStar    bool    Hide the star until the wishing star arrives.
 *   className   string  Passed to the root wrapper.
 *   style       object  Passed to the root wrapper.
 */

// How far each piece may wander from its painted home position, as a fraction
// of the frame size. Kept small so the art never crosses the glass walls.
const STAR_RANGE = { x: 0.085, y: 0.075 };
const MOON_RANGE = { x: 0.085, y: 0.07 };

// px/sec of travel (as a fraction of frame size per second) — a slow float.
const STAR_SPEED = { x: 0.055, y: 0.043 };
const MOON_SPEED = { x: 0.041, y: 0.052 };

/** One drifting piece: position + velocity in normalized frame units. */
function makeDrifter(range, speed, phase) {
  return {
    x: Math.cos(phase) * range.x * 0.4,
    y: Math.sin(phase) * range.y * 0.4,
    vx: speed.x * (Math.cos(phase) > 0 ? 1 : -1),
    vy: speed.y * (Math.sin(phase) > 0 ? 1 : -1),
    range,
  };
}

/** Advance a drifter and reflect it off its bounds. */
function stepDrifter(d, dt) {
  d.x += d.vx * dt;
  d.y += d.vy * dt;
  if (d.x > d.range.x) { d.x = d.range.x; d.vx = -d.vx; }
  if (d.x < -d.range.x) { d.x = -d.range.x; d.vx = -d.vx; }
  if (d.y > d.range.y) { d.y = d.range.y; d.vy = -d.vy; }
  if (d.y < -d.range.y) { d.y = -d.range.y; d.vy = -d.vy; }
}

export default function Hourglass({
  progress = 0,
  showStar = true,
  className,
  style,
}) {
  const starRef = useRef(null);
  const moonRef = useRef(null);

  useEffect(() => {
    const starEl = starRef.current;
    const moonEl = moonRef.current;
    if (!starEl || !moonEl) return;

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const star = makeDrifter(STAR_RANGE, STAR_SPEED, 0.6);
    const moon = makeDrifter(MOON_RANGE, MOON_SPEED, 2.4);

    let raf = 0;
    let last = 0;
    let elapsed = 0;

    const frame = (now) => {
      const t = now / 1000;
      const dt = last ? Math.min(t - last, 0.05) : 0;
      last = t;
      elapsed += dt;

      stepDrifter(star, dt);
      stepDrifter(moon, dt);

      // A gentle bob and tilt on top of the bounce so it reads as floating
      // rather than sliding.
      const starBob = Math.sin(elapsed * 1.3) * 0.006;
      const starTilt = Math.sin(elapsed * 0.7) * 5;
      const moonBob = Math.sin(elapsed * 1.05 + 1.4) * 0.005;
      const moonTilt = Math.sin(elapsed * 0.55 + 0.8) * 4;

      starEl.style.transform =
        `translate(${(star.x * 100).toFixed(2)}%, ${((star.y + starBob) * 100).toFixed(2)}%) rotate(${starTilt.toFixed(2)}deg)`;
      moonEl.style.transform =
        `translate(${(moon.x * 100).toFixed(2)}%, ${((moon.y + moonBob) * 100).toFixed(2)}%) rotate(${moonTilt.toFixed(2)}deg)`;

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Glow swells a little as the schedule pours.
  const glowOpacity = 0.75 + Math.min(1, Math.max(0, progress)) * 0.25;

  return (
    <div
      className={`hourglass-png ${className || ''}`}
      style={style}
      aria-hidden="true"
    >
      {/* 9 → 1: back to front */}
      <img src={backGlow} alt="" className="hg-layer hg-backglow" style={{ opacity: glowOpacity }} />
      <img src={caseLayer} alt="" className="hg-layer hg-case" />
      <img src={backPillars} alt="" className="hg-layer hg-backpillars" />
      <img src={bottomBubble} alt="" className="hg-layer hg-bottombubble" />
      <img ref={moonRef} src={moonLayer} alt="" className="hg-layer hg-moon" />
      <img src={topBubble} alt="" className="hg-layer hg-topbubble" />
      <img
        ref={starRef}
        src={starLayer}
        alt=""
        className="hg-layer hg-star"
        style={{ opacity: showStar ? 1 : 0 }}
      />
      <img src={glassLayer} alt="" className="hg-layer hg-glass" />
      <img src={frontPillars} alt="" className="hg-layer hg-frontpillars" />
    </div>
  );
}
