import { useEffect, useRef } from 'react'

/**
 * GalaxyStream — spiral-galaxy canvas background for the Tracks section.
 *
 * The canvas is transparent: the section's own gradient shows through.
 * Stars are drawn additively, so it reads best over a dark background.
 *
 * Usage:
 *   <section className="section section-5 galaxy-section">
 *     <GalaxyStream />
 *     <div className="section-inner">…</div>
 *   </section>
 *
 * ─── HOW THE GALAXY IS BUILT (so you can tune it) ────────────────────
 * Every star lives in flat "disc space" as (radius r, angle θ):
 *
 *   r = random^bias · R          bias < 1 packs stars toward the core
 *   θ = armAngle + winding·(r/R) + scatter
 *
 * armAngle spaces the arms evenly (2π / ARMS per arm). The winding term
 * makes each arm wrap around the center as radius grows — that IS the
 * spiral. scatter fuzzes stars off the exact arm line so arms look like
 * star clouds, not drawn curves.
 *
 * To render, each flat (r, θ) point is squashed in y (SQUASH) and then
 * rotated (TILT) — that fakes viewing the disc at an angle, like the
 * Andromeda photo. Rotation is animated by slowly adding to θ.
 * ─────────────────────────────────────────────────────────────────────
 */

// ═══════════════════════ TUNE ME ═══════════════════════
const CONFIG = {
  // ── placement (fractions of the section's width/height) ──
  centerX: 0.69, // 0 = left edge, 1 = right edge
  centerY: 0.42, // 0 = top, 1 = bottom
  radius: 0.42, // disc radius as a fraction of min(sectionW, sectionH)

  // ── 3D-ish orientation ──
  tilt: -0.45, // rotation of the whole disc, radians (0 = horizontal)
  squash: 0.42, // 1 = face-on circle, 0.2 = nearly edge-on

  // ── spiral shape ── ("stuff going around the center" lives here)
  arms: 4, // number of spiral arms
  winding: 4.6, // how far each arm wraps around, radians (higher = tighter spiral)
  scatter: 0.55, // how far stars stray off the arm line (0 = razor-thin arms)
  coreBias: 0.6, // <1 packs stars toward the core, 1 = uniform spread

  // ── population (all scaled by the `intensity` prop) ──
  starCount: 1500, // points making up the arms + core
  sparkleCount: 60, // 4-point sparkles seeded along the arms
  heroStarCount: 8, // oversized breathing highlight stars
  coreFraction: 0.28, // stars inside this radius fraction get warm/bright colors

  // ── motion ──
  rotationSpeed: 0.02, // radians per second (positive = counterclockwise-ish)
  twinkleAmount: 0.55, // 0 = steady stars, 0.5 = strong flicker

  // ── the two star trails peeling off the lower edge ──
  trails: {
    enabled: true, // set false to show the disc alone
    counts: [120, 70], // particles per trail
  },
}

// palette — cores/highlights first array, arm body second
const BRIGHT = ['#eef0ff', '#fff3d8', '#dcd2ff']
const DEEP = ['#7c8ce0', '#5d6fd4', '#9aa8f2', '#b9a7ee']
// ═══════════════════════════════════════════════════════

const TWO_PI = Math.PI * 2
const pick = (arr) => arr[(Math.random() * arr.length) | 0]
const randn = () => Math.random() + Math.random() + Math.random() - 1.5 // ~gaussian

// cubic bezier helpers (used by the trails)
function bezPoint(p, s) {
  const u = 1 - s
  return {
    x: u * u * u * p[0].x + 3 * u * u * s * p[1].x + 3 * u * s * s * p[2].x + s * s * s * p[3].x,
    y: u * u * u * p[0].y + 3 * u * u * s * p[1].y + 3 * u * s * s * p[2].y + s * s * s * p[3].y,
  }
}
function bezTangent(p, s) {
  const u = 1 - s
  const x = 3 * u * u * (p[1].x - p[0].x) + 6 * u * s * (p[2].x - p[1].x) + 3 * s * s * (p[3].x - p[2].x)
  const y = 3 * u * u * (p[1].y - p[0].y) + 6 * u * s * (p[2].y - p[1].y) + 3 * s * s * (p[3].y - p[2].y)
  const len = Math.hypot(x, y) || 1
  return { x: x / len, y: y / len }
}

// four-point "anime" sparkle
function drawSparkle(ctx, x, y, r, alpha, color) {
  const k = r * 0.16
  ctx.save()
  ctx.translate(x, y)
  ctx.globalAlpha = alpha
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(0, -r)
  ctx.quadraticCurveTo(k, -k, r, 0)
  ctx.quadraticCurveTo(k, k, 0, r)
  ctx.quadraticCurveTo(-k, k, -r, 0)
  ctx.quadraticCurveTo(-k, -k, 0, -r)
  ctx.fill()
  ctx.restore()
}

export default function GalaxyStream({ intensity = 1, className = '' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const C = CONFIG

    let W = 0
    let H = 0
    let raf = 0
    let visible = true
    let last = performance.now()
    let elapsed = Math.random() * 100

    let galaxy = null // { cx, cy, R }
    let discStars = []
    let discSparkles = []
    let heroStars = []
    let trails = []

    // pick a spiral-arm position in flat disc space
    // frac ∈ (0,1] is the fractional radius; returns { r, theta }
    function armPoint(frac, armIndex, fuzz) {
      const armAngle = armIndex * (TWO_PI / C.arms)
      const spread = fuzz * (0.9 - frac * C.scatter) // arms tighten with radius
      return {
        r: frac * galaxy.R,
        theta: armAngle + frac * C.winding + spread,
      }
    }

    function buildDisc() {
      galaxy = {
        cx: W * C.centerX,
        cy: H * C.centerY,
        R: Math.min(W, H) * C.radius,
      }

      // star body
      const n = Math.round(C.starCount * intensity)
      discStars = []
      for (let i = 0; i < n; i++) {
        const frac = Math.pow(Math.random(), C.coreBias)
        const { r, theta } = armPoint(frac, i % C.arms, Math.random() - 0.5)
        const inner = frac < C.coreFraction
        discStars.push({
          r,
          theta,
          size: (inner ? 1.7 : 1.2) * (0.5 + Math.random() * 1.1),
          alpha: inner ? 0.7 + Math.random() * 0.3 : 0.3 + Math.random() * 0.6,
          tw: 1.4 + Math.random() * 3.2, // twinkle frequency
          phase: Math.random() * TWO_PI,
          color: inner ? pick(BRIGHT) : Math.random() < 0.22 ? pick(BRIGHT) : pick(DEEP),
        })
      }

      // 4-point sparkles seeded along the arms (skip the very core)
      const ns = Math.round(C.sparkleCount * intensity)
      discSparkles = []
      for (let i = 0; i < ns; i++) {
        const frac = 0.15 + Math.pow(Math.random(), 0.7) * 0.85
        const { r, theta } = armPoint(frac, i % C.arms, (Math.random() - 0.5) * 1.3)
        discSparkles.push({
          r,
          theta,
          size: 2.5 + Math.random() * 5,
          tw: 0.4 + Math.random() * 1.1,
          phase: Math.random() * TWO_PI,
          color: pick(BRIGHT),
        })
      }

      // hero stars: big soft-halo highlights anywhere in the disc
      const nh = Math.round(C.heroStarCount * intensity)
      heroStars = []
      for (let i = 0; i < nh; i++) {
        heroStars.push({
          r: (0.3 + Math.random() * 0.65) * galaxy.R,
          theta: Math.random() * TWO_PI,
          size: 7 + Math.random() * 8,
          tw: 0.25 + Math.random() * 0.5,
          phase: Math.random() * TWO_PI,
          color: pick(BRIGHT),
        })
      }
    }

    function makeTrail(pts, width, count, speed) {
      const particles = []
      for (let i = 0; i < count; i++) {
        particles.push({
          s: Math.random(), // position along the curve, 0 → 1
          lane: randn() * 0.6, // sideways offset across the trail
          drift: (Math.random() - 0.5) * 0.05,
          speed: speed * (0.65 + Math.random() * 0.7),
          size: 0.5 + Math.random() * 1.2,
          color: Math.random() < 0.3 ? pick(BRIGHT) : pick(DEEP),
          phase: Math.random() * TWO_PI,
        })
      }
      return { pts, width, particles }
    }

    const jit = (v, amt) => v + (Math.random() - 0.5) * amt

    function buildTrails() {
      if (!C.trails.enabled) {
        trails = []
        return
      }
      const { cx, cy, R } = galaxy
      // two bezier curves from the disc's lower edge to below the section;
      // each has 4 control points: start, two pulls, end
      trails = [
        makeTrail(
          [
            { x: cx - R * 0.1, y: cy + R * 0.3 },
            { x: jit(cx - R * 0.45, R * 0.15), y: cy + R * 0.8 },
            { x: jit(cx - R * 0.25, R * 0.15), y: H * 0.9 },
            { x: cx - R * 0.45, y: H + 40 },
          ],
          Math.max(16, R * 0.1),
          Math.round(C.trails.counts[0] * intensity),
          0.075
        ),
        makeTrail(
          [
            { x: cx + R * 0.35, y: cy + R * 0.35 },
            { x: jit(cx + R * 0.15, R * 0.12), y: cy + R * 0.95 },
            { x: jit(cx + R * 0.4, R * 0.12), y: H * 0.94 },
            { x: cx + R * 0.2, y: H + 40 },
          ],
          Math.max(11, R * 0.06),
          Math.round(C.trails.counts[1] * intensity),
          0.06
        ),
      ]
    }

    function rebuild() {
      const rect = canvas.parentElement.getBoundingClientRect()
      W = Math.max(1, rect.width)
      H = Math.max(1, rect.height)
      canvas.width = W * dpr
      canvas.height = H * dpr
      canvas.style.width = W + 'px'
      canvas.style.height = H + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      buildDisc()
      buildTrails()
    }

    // flat disc-space (r, θ) → screen pixels: squash, then tilt, then place
    function discXY(r, theta, rot) {
      const dx = Math.cos(theta + rot) * r
      const dy = Math.sin(theta + rot) * r * C.squash
      const cosT = Math.cos(C.tilt)
      const sinT = Math.sin(C.tilt)
      return {
        x: galaxy.cx + dx * cosT - dy * sinT,
        y: galaxy.cy + dx * sinT + dy * cosT,
      }
    }

    function drawGlows() {
      const { cx, cy, R } = galaxy
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(C.tilt)
      ctx.scale(1, C.squash)
      // wide violet halo
      let g = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 1.05)
      g.addColorStop(0, 'rgba(140, 130, 240, 0.34)')
      g.addColorStop(0.5, 'rgba(90, 90, 200, 0.14)')
      g.addColorStop(1, 'rgba(90, 90, 200, 0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(0, 0, R * 1.05, 0, TWO_PI)
      ctx.fill()
      // warm core
      g = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.3)
      g.addColorStop(0, 'rgba(255, 242, 214, 0.95)')
      g.addColorStop(0.35, 'rgba(255, 226, 190, 0.4)')
      g.addColorStop(1, 'rgba(255, 226, 190, 0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(0, 0, R * 0.3, 0, TWO_PI)
      ctx.fill()
      ctx.restore()
    }

    function drawStars(t) {
      const rot = t * C.rotationSpeed
      /*for (const s of discStars) {
        const p = discXY(s.r, s.theta, rot)
        ctx.globalAlpha =
          s.alpha * (1 - C.twinkleAmount + C.twinkleAmount * Math.sin(t * s.tw + s.phase))
        ctx.fillStyle = s.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, s.size, 0, TWO_PI)
        ctx.fill()
      }*/
     for (const s of discStars) {
        const p = discXY(s.r, s.theta, rot)
        // sharpen the sine into brief bright "glints" instead of a smooth breathe
        const wave = 0.5 + 0.5 * Math.sin(t * s.tw + s.phase)
        const glint = wave * wave * wave * wave
        ctx.globalAlpha = Math.min(
          1,
          s.alpha * (1 - C.twinkleAmount + C.twinkleAmount * (0.3 + 1.6 * glint))
        )
        ctx.fillStyle = s.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, s.size * (1 + 0.5 * glint), 0, TWO_PI)
        ctx.fill()
      }
      ctx.globalAlpha = 1   // ← add this line back

      for (const h of heroStars) {
        const p = discXY(h.r, h.theta, rot)
        const a = 0.5 + 0.5 * Math.abs(Math.sin(t * h.tw + h.phase))
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, h.size * 2.2)
        g.addColorStop(0, `rgba(238, 240, 255, ${0.5 * a})`)
        g.addColorStop(1, 'rgba(238, 240, 255, 0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(p.x, p.y, h.size * 2.2, 0, TWO_PI)
        ctx.fill()
        ctx.globalAlpha = 0.6 + 0.4 * a
        ctx.fillStyle = h.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, h.size * 0.22, 0, TWO_PI)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      for (const sp of discSparkles) {
        const p = discXY(sp.r, sp.theta, rot)
        const a = 0.25 + 0.75 * Math.abs(Math.sin(t * sp.tw + sp.phase))
        drawSparkle(ctx, p.x, p.y, sp.size * (0.8 + 0.2 * a), a * 0.9, sp.color)
      }
    }

    function drawTrails(t, dt) {
      ctx.lineCap = 'round'
      for (const tr of trails) {
        for (const p of tr.particles) {
          p.s += p.speed * (0.45 + p.s) * dt // accelerate while falling
          if (p.s > 1) {
            p.s -= 1
            p.lane = randn() * 0.6
          }
          p.lane += p.drift * dt
          if (p.lane > 1.4 || p.lane < -1.4) p.drift *= -1

          const taper = 1 - 0.7 * p.s
          const wobble = Math.sin(t * 0.6 + p.phase + p.s * 5) * 0.22
          const off = (p.lane + wobble) * tr.width * taper

          // draw a short streak between s-δ and s
          const ds = Math.min(0.02, 0.006 + p.speed * 0.02)
          const s0 = Math.max(0, p.s - ds)
          const a1 = bezPoint(tr.pts, p.s)
          const t1 = bezTangent(tr.pts, p.s)
          const a0 = bezPoint(tr.pts, s0)
          const t0 = bezTangent(tr.pts, s0)

          const fadeIn = Math.min(1, p.s / 0.1)
          ctx.globalAlpha =
            (0.22 + 0.6 * p.s) * fadeIn * (0.8 + 0.2 * Math.sin(t * 2 + p.phase))
          ctx.strokeStyle = p.color
          ctx.lineWidth = p.size * (0.8 + 0.6 * p.s)
          ctx.beginPath()
          ctx.moveTo(a0.x - t0.y * off, a0.y + t0.x * off)
          ctx.lineTo(a1.x - t1.y * off, a1.y + t1.x * off)
          ctx.stroke()
        }
      }
      ctx.globalAlpha = 1
    }

    function draw(t, dt = 0) {
      ctx.clearRect(0, 0, W, H) // transparent — section gradient shows through
      ctx.globalCompositeOperation = 'lighter' // additive star glow
      drawGlows()
      drawStars(t)
      drawTrails(t, dt)
      ctx.globalCompositeOperation = 'source-over'
    }

    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (visible) {
        elapsed += dt
        draw(elapsed, dt)
      }
      raf = requestAnimationFrame(frame)
    }

    rebuild()
    if (reducedMotion) {
      draw(elapsed) // single static frame
    } else {
      raf = requestAnimationFrame(frame)
    }

    const ro = new ResizeObserver(() => {
      rebuild()
      if (reducedMotion) draw(elapsed)
    })
    ro.observe(canvas.parentElement)

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting // pause when scrolled offscreen
    })
    io.observe(canvas)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
    }
  }, [intensity])

  return <canvas ref={canvasRef} className={`galaxy-canvas ${className}`} aria-hidden="true" />
}
