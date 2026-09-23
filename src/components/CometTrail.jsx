import { useEffect, useRef } from 'react'

/**
 * CometTrail — comet for the top-left of the Tracks section.
 *
 * The tail is overlapping radial-gradient blobs down a curved spine (all
 * edges are gradient falloffs — nothing crisp), with a brighter head-cone
 * pass over the first stretch so the head fuses into the tail like a real
 * comet photo. Galaxy-style glinting stars + a few soft dust streaks live
 * in and around the glow.
 *
 * The CANVAS EXTENDS ABOVE THE SECTION (EXTEND px) so the tail can reach
 * over the previous section's edge instead of being cut off — pair this
 * with the CSS: .galaxy-section { overflow-x: clip; overflow-y: visible; }
 * and the taller .comet-canvas rule (see notes).
 *
 * SCROLL DRIFT: as the section scrolls into view the whole comet eases
 * down and toward the middle by (driftX, driftY), then STOPS — it tracks
 * section-entry progress (clamped 0→1), not the scroll position forever.
 *
 * Palette: pink/lilac (#F5E2FF page-top + hourglass pastels), keeping
 * galaxy = violet/gold · planet = blue · comet = pink-white.
 */

// ═══════════════ TUNE ME ═══════════════
const CONFIG = {
  headX: 0.38,   // head placement at rest, fractions of the section
  headY: 0.4,
  tailDX: -0.26,   // was -0.30 — less sideways
  tailDY: -0.20,   // was -0.17 — much more rise, so travel is more downward

  // scroll drift: the comet slides ALONG its own path as the section enters.
  // driftTravel is how far back it starts, as a fraction of the path length.
  driftTravel: 0.32,

  headRadius: 0.017,
  coneSpread: 3.1,   // slightly slimmer tail
  tailCurve: 0.09,
  coneLen: 0.45,

  dustCount: 22,
  starCount: 44,
  sparkles: 3,
  flowSpeed: 0.06,
  sway: 0.03,
}

// how far above the section the canvas extends (px) — room for the tail
const EXTEND = 200

const CORE = '#ffffff'
const PINKS = ['#F5E2FF', '#EED6FF', '#dcd2ff']
const DEEP = ['#c9b3f0', '#b9a7ee', '#a99df0']
const TWO_PI = Math.PI * 2
const pick = (arr) => arr[(Math.random() * arr.length) | 0]
// ═══════════════════════════════════════

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

export default function CometTrail({ intensity = 1, className = '' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const C = CONFIG

    let W = 0, H = 0, raf = 0      // W/H = SECTION size (placement basis)
    let CH = 0                     // canvas height = H + EXTEND
    let visible = false
    let last = performance.now()
    let elapsed = Math.random() * 100
    let comet = null
    let dust = []
    let tailStars = []
    let glints = []
    let drift = 0                  // eased scroll progress, 0 → 1, clamped

    function rebuild() {
      const rect = canvas.parentElement.getBoundingClientRect()
      W = Math.max(1, rect.width)
      H = Math.max(1, rect.height)
      CH = H + EXTEND
      canvas.width = W * dpr
      canvas.height = CH * dpr
      canvas.style.width = W + 'px'
      canvas.style.height = CH + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const phone = W < 680
      // +EXTEND: all y coords are in CANVAS space (0 = EXTEND px above section)
      const hx = W * (phone ? 0.3 : C.headX)
      const hy = H * (phone ? 0.12 : C.headY) + EXTEND
      const tx = hx + W * C.tailDX * (phone ? 0.8 : 1)
      const ty = hy + H * C.tailDY * (phone ? 0.6 : 1)
      const mx = (hx + tx) / 2
      const my = (hy + ty) / 2
      const nx = -(ty - hy)
      const ny = tx - hx
      comet = {
        hx, hy, tx, ty,
        px: mx + nx * C.tailCurve,
        py: my + ny * C.tailCurve,
        R: Math.min(W, H) * C.headRadius * (phone ? 1.4 : 1),
      }

      const n = Math.round(C.dustCount * intensity)
      dust = []
      for (let i = 0; i < n; i++) {
        dust.push({
          s: Math.random(),
          lane: (Math.random() - 0.5) * 1.6,
          speed: C.flowSpeed * (0.6 + Math.random() * 0.8),
          len: 0.06 + Math.random() * 0.12,
          width: 0.6 + Math.random() * 1.4,
          color: Math.random() < 0.4 ? pick(PINKS) : pick(DEEP),
        })
      }

      const ns = Math.round(C.starCount * intensity)
      tailStars = []
      for (let i = 0; i < ns; i++) {
        tailStars.push({
          s: 0.05 + Math.random() * 0.95,
          lane: (Math.random() - 0.5) * 2.9,
          size: 0.6 + Math.random() * 1.3,
          alpha: 0.4 + Math.random() * 0.5,
          tw: 1.4 + Math.random() * 3.2,
          phase: Math.random() * TWO_PI,
          color: Math.random() < 0.45 ? '#eef0ff' : Math.random() < 0.5 ? '#fff3d8' : '#dcd2ff',
        })
      }

      const ng = Math.round(C.sparkles * intensity)
      glints = []
      for (let i = 0; i < ng; i++) {
        glints.push({
          s: 0.2 + Math.random() * 0.6,
          lane: (Math.random() - 0.5) * 2.4,
          size: 2 + Math.random() * 3,
          tw: 0.4 + Math.random() * 0.8,
          phase: Math.random() * TWO_PI,
          color: pick(PINKS),
        })
      }
    }

    // ── scroll drift: section-entry progress, eased + clamped ──
    function updateDrift() {
      const rect = canvas.parentElement.getBoundingClientRect()
      const vh = window.innerHeight || 1
      // starts as the section enters, finishes once you've scrolled ~40%
      // of a viewport PAST the section top — i.e. while you're looking at it
      const raw = Math.min(1, Math.max(0, (vh - rect.top) / (vh * 0.9)))
      drift = raw * raw * (3 - 2 * raw)
    }
    
    let scrollRaf = 0
    const onScroll = () => {
      if (!scrollRaf) scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0
        updateDrift()
        if (reducedMotion) draw(elapsed) // keep static frame in sync
      })
    }

        function spine(s, t) {
      // slide the whole comet back along its own curve while drift < 1;
      // the quadratic extrapolates cleanly outside [0,1], so the shifted
      // comet stays on the same parabola it will travel down
      const ss = s + (1 - drift) * C.driftTravel
      const u = 1 - ss
      const bx = u * u * comet.hx + 2 * u * ss * comet.px + ss * ss * comet.tx
      const by = u * u * comet.hy + 2 * u * ss * comet.py + ss * ss * comet.ty
      const dx = 2 * u * (comet.px - comet.hx) + 2 * ss * (comet.tx - comet.px)
      const dy = 2 * u * (comet.py - comet.hy) + 2 * ss * (comet.ty - comet.py)
      const len = Math.hypot(dx, dy) || 1
      const sway = Math.sin(t * 0.4 + s * 2) * C.sway * s * comet.R * 8
      return {
        x: bx + (-dy / len) * sway,
        y: by + (dx / len) * sway,
        nx: -dy / len,
        ny: dx / len,
      }
    }

    function coneW(s) {
      return comet.R * (0.9 + C.coneSpread * Math.pow(s, 0.75))
    }

    function tailXY(s, lane, t) {
      const p = spine(s, t)
      const off = lane * coneW(s)
      return { x: p.x + p.nx * off, y: p.y + p.ny * off }
    }

    function drawTailGlow(t) {
      const STEPS = 26
      for (let i = 0; i <= STEPS; i++) {
        const s = i / STEPS
        const p = spine(s, t)
        const r = coneW(s) * 1.9
        const fade = Math.pow(1 - s, 0.8)
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r)
        g.addColorStop(0, `rgba(255, 250, 255, ${0.075 * fade + 0.015})`)
        g.addColorStop(0.4, `rgba(245, 226, 255, ${0.045 * fade + 0.008})`)
        g.addColorStop(1, 'rgba(220, 210, 255, 0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(p.x, p.y, r, 0, TWO_PI)
        ctx.fill()
      }
    }

    function drawHeadCone(t) {
      const STEPS = 20
      for (let i = 0; i <= STEPS; i++) {
        const q = i / STEPS
        const s = Math.pow(q, 1.35) * C.coneLen
        const p = spine(s, t)
        const r = coneW(s) * 1.25
        const fade = Math.pow(1 - q, 1.5)
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r)
        g.addColorStop(0, `rgba(255, 255, 255, ${0.36 * fade + 0.025})`)
        g.addColorStop(0.45, `rgba(255, 240, 255, ${0.17 * fade + 0.012})`)
        g.addColorStop(1, 'rgba(245, 226, 255, 0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(p.x, p.y, r, 0, TWO_PI)
        ctx.fill()
      }
      // nucleus follows the spine so it rides the drift with everything else
      const hp = spine(0, t)
      const { R } = comet
      const breathe = 1 + 0.04 * Math.sin(t * 0.8)
      const g = ctx.createRadialGradient(hp.x, hp.y, 0, hp.x, hp.y, R * 1.3 * breathe)
      g.addColorStop(0, 'rgba(255, 255, 255, 0.7)')
      g.addColorStop(0.5, 'rgba(255, 240, 255, 0.28)')
      g.addColorStop(1, 'rgba(245, 226, 255, 0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(hp.x, hp.y, R * 1.3 * breathe, 0, TWO_PI)
      ctx.fill()
    }

    function draw(t, dt = 0) {
      ctx.clearRect(0, 0, W, CH)
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'

      drawTailGlow(t)
      drawHeadCone(t)

      ctx.lineCap = 'round'
      for (const d of dust) {
        d.s += d.speed * dt
        if (d.s > 1) {
          d.s = 0
          d.lane = (Math.random() - 0.5) * 1.6
        }
        const a = tailXY(Math.max(0, d.s - d.len), d.lane, t)
        const b = tailXY(d.s, d.lane, t)
        ctx.globalAlpha = (0.14 - 0.1 * d.s) * Math.min(1, d.s / 0.06)
        ctx.strokeStyle = d.color
        ctx.lineWidth = d.width
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
      }
      ctx.globalAlpha = 1

      for (const s of tailStars) {
        const p = tailXY(s.s, s.lane, t)
        const wave = 0.5 + 0.5 * Math.sin(t * s.tw + s.phase)
        const glint = wave * wave * wave * wave
        ctx.globalAlpha = Math.min(1, s.alpha * (0.4 + 1.1 * glint) * (1 - 0.35 * s.s))
        ctx.fillStyle = s.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, s.size * (1 + 0.5 * glint), 0, TWO_PI)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      for (const s of glints) {
        const a = 0.25 + 0.75 * Math.abs(Math.sin(t * s.tw + s.phase))
        const p = tailXY(s.s, s.lane, t)
        drawSparkle(ctx, p.x, p.y, s.size, a * 0.7, s.color)
      }
      ctx.globalCompositeOperation = 'source-over'
      ctx.restore()
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
    updateDrift()
    if (reducedMotion) {
      draw(elapsed)
    }

    window.addEventListener('scroll', onScroll, { passive: true })

    const ro = new ResizeObserver(() => {
      rebuild()
      updateDrift()
      if (reducedMotion) draw(elapsed)
    })
    ro.observe(canvas.parentElement)

    const syncPlayback = () => {
      cancelAnimationFrame(raf)
      raf = 0
      if (visible && !document.hidden && !reducedMotion) {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    }
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      syncPlayback()
    }, { rootMargin: `${EXTEND}px 0px 0px 0px` })
    io.observe(canvas)
    document.addEventListener('visibilitychange', syncPlayback)

    return () => {
      cancelAnimationFrame(raf)
      cancelAnimationFrame(scrollRaf)
      window.removeEventListener('scroll', onScroll)
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', syncPlayback)
    }
  }, [intensity])

  return <canvas ref={canvasRef} className={`comet-canvas ${className}`} aria-hidden="true" />
}
