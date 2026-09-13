import { useEffect, useRef } from 'react'

/**
 * PlanetDrift — small ringed planet for the bottom-left of the Tracks section.
 *
 * Counterpart to GalaxyStream: same transparent-canvas, additive-glow style,
 * same palette. The ring is TILTED THE OPPOSITE WAY to the galaxy disc —
 * the galaxy leans one way (tilt -0.45), this leans the other (+0.5), so the
 * ring sits LOWER on its right side (toward the section's middle) and HIGHER
 * on its left (toward the edge).
 */

// ═══════════════ TUNE ME ═══════════════
const CONFIG = {
  // placement (fractions of the section)
  centerX: 0.18,  // was 0.14 — closer to the section's middle
  centerY: 0.80,  // optional: lift it a touch so the ring's low side clears the bottom edge
  radius: 0.09,   // PLANET radius as fraction of min(W, H)

  // orientation — opposite sign to the galaxy's tilt: -0.45
  tilt: 0.5,      // ring dips right (toward middle), rises left (toward edge)
  squash: 0.3,    // how edge-on the ring looks

ringInner: 1.5, // ring radii as multiples of the planet radius
  ringOuter: 2.4,
  ringCount: 220,
  sparkles: 5,
  surfaceBlobs: 90,  // soft misty patches that make up the planet body
  surfaceDust: 120,  // tiny bright specks on the surface

  rotationSpeed: 0.12, // ring drift, radians/sec (slow)
}

const BRIGHT = ['#eef0ff', '#fff3d8', '#dcd2ff']
const DEEP = ['#7c8ce0', '#5d6fd4', '#9aa8f2', '#b9a7ee']
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

export default function PlanetDrift({ intensity = 1, className = '' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const C = CONFIG

    let W = 0, H = 0, raf = 0
    let visible = true
    let last = performance.now()
    let elapsed = Math.random() * 100
    let planet = null // { cx, cy, R }
    let ring = []
    let glints = []

    function rebuild() {
      const rect = canvas.parentElement.getBoundingClientRect()
      W = Math.max(1, rect.width)
      H = Math.max(1, rect.height)
      canvas.width = W * dpr
      canvas.height = H * dpr
      canvas.style.width = W + 'px'
      canvas.style.height = H + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      planet = {
        cx: W * C.centerX,
        cy: H * C.centerY,
        R: Math.min(W, H) * C.radius,
      }

      const n = Math.round(C.ringCount * intensity)
      ring = []
      for (let i = 0; i < n; i++) {
        ring.push({
          // band the particles between inner and outer radius, denser mid-band
          rr: C.ringInner + (C.ringOuter - C.ringInner) * (0.5 + 0.5 * (Math.random() ** 1.6) * (Math.random() < 0.5 ? 1 : -1)),
          theta: Math.random() * TWO_PI,
          size: 0.5 + Math.random() * 1.1,
          alpha: 0.25 + Math.random() * 0.55,
          tw: 1 + Math.random() * 2.5,
          phase: Math.random() * TWO_PI,
          //color: Math.random() < 0.25 ? pick(BRIGHT) : pick(DEEP),
          color: Math.random() < 0.3 ? '#dcecff' : Math.random() < 0.5 ? '#8fb0ff' : '#9aa8f2',
        })
      }

      const ns = Math.round(C.sparkles * intensity)
      glints = []
      for (let i = 0; i < ns; i++) {
        glints.push({
          x: (Math.random() - 0.5) * 6, // planet-radius units around the planet
          y: (Math.random() - 0.5) * 4,
          size: 2 + Math.random() * 4,
          tw: 0.4 + Math.random() * 0.9,
          phase: Math.random() * TWO_PI,
          color: pick(BRIGHT),
        })
      }
            // dreamy surface: misty blobs banded into soft horizontal stripes,
      // plus fine glowing dust
      const nb = Math.round(C.surfaceBlobs * intensity)
      const blobs = []
      for (let i = 0; i < nb; i++) {
        // bias positions into loose latitude bands
        const band = (Math.floor(Math.random() * 4) - 1.5) / 2.2
        const y = band + (Math.random() - 0.5) * 0.28
        const x = (Math.random() * 2 - 1) * Math.sqrt(Math.max(0, 1 - y * y))
        blobs.push({
          x, y,
          size: 0.18 + Math.random() * 0.3, // in planet radii
          alpha: 0.05 + Math.random() * 0.1,
          tw: 0.15 + Math.random() * 0.3,   // very slow shimmer
          phase: Math.random() * TWO_PI,
          drift: (Math.random() - 0.5) * 0.02,
          color: Math.random() < 0.35 ? '#fff3d8' : Math.random() < 0.5 ? '#b9a7ee' : '#9aa8f2',
        })
      }
      const nd = Math.round(C.surfaceDust * intensity)
      const dust = []
      for (let i = 0; i < nd; i++) {
        const a = Math.random() * TWO_PI
        const rr = Math.sqrt(Math.random()) * 0.95
        dust.push({
          x: Math.cos(a) * rr,
          y: Math.sin(a) * rr * 0.9,
          size: 0.35 + Math.random() * 0.9, // px
          alpha: 0.15 + Math.random() * 0.45,
          tw: 1 + Math.random() * 2.4,
          phase: Math.random() * TWO_PI,
          color: pick(BRIGHT),
        })
      }
      planet.blobs = blobs
      planet.dust = dust
      buildRingStreaks()
    }

    // ring space (rr multiples of R, angle) → screen, with squash + tilt
    function ringXY(rr, theta) {
      const r = rr * planet.R
      const dx = Math.cos(theta) * r
      const dy = Math.sin(theta) * r * C.squash
      const cosT = Math.cos(C.tilt)
      const sinT = Math.sin(C.tilt)
      return {
        x: planet.cx + dx * cosT - dy * sinT,
        y: planet.cy + dx * sinT + dy * cosT,
        behind: Math.sin(theta) < 0, // top half of the ellipse passes behind
      }
    }

        // streaky ring: many short arc segments clustered into loose bands, so
    // the ring reads as swept dust lanes rather than drawn circles
    let ringStreaks = []
    function buildRingStreaks() {
      const bands = [
        { rr: 1.62, spread: 0.07, alpha: 0.32, color: '#8fb0ff', n: 42 },
        { rr: 1.84, spread: 0.05, alpha: 0.24, color: '#dcecff', n: 30 },
        { rr: 2.05, spread: 0.09, alpha: 0.30, color: '#7c8ce0', n: 48 },
        { rr: 2.28, spread: 0.04, alpha: 0.18, color: '#b9a7ee', n: 24 },
      ]
      ringStreaks = []
      for (const b of bands) {
        for (let i = 0; i < b.n; i++) {
          ringStreaks.push({
            rr: b.rr + (Math.random() - 0.5) * 2 * b.spread,
            theta: Math.random() * TWO_PI,           // where the streak starts
            len: 0.25 + Math.random() * 0.7,         // arc length, radians
            width: 0.6 + Math.random() * 1.8,        // px
            alpha: b.alpha * (0.5 + Math.random() * 0.7),
            tw: 0.2 + Math.random() * 0.5,           // slow fade in/out
            phase: Math.random() * TWO_PI,
            color: b.color,
          })
        }
      }
    }

    function drawRingStreaksHalf(t, behind) {
      const { cx, cy, R } = planet
      const rot = t * C.rotationSpeed
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(C.tilt)
      ctx.scale(1, C.squash)
      ctx.lineCap = 'round'
      for (const s of ringStreaks) {
        const a0 = s.theta + rot
        const mid = a0 + s.len / 2
        // classify by the streak's midpoint: top of ellipse passes behind
        if ((Math.sin(mid) < 0) !== behind) continue
        //const fade = 0.6 + 0.4 * Math.sin(t * s.tw + s.phase)
                // steady brightness — no twinkle
        // smooth front/back transition: sin(mid) goes 0 at the crossover,
        // so depth eases between 0.25 (behind) and 1 (front) instead of popping
        const depth = 0.25 + 0.75 * Math.max(0, Math.min(1, (Math.sin(mid) + 0.15) / 0.3))
        ctx.globalAlpha = s.alpha * depth
        //ctx.globalAlpha = s.alpha * fade * (behind ? 0.25 : 1)
        ctx.strokeStyle = s.color
        ctx.lineWidth = s.width / C.squash
        ctx.beginPath()
        ctx.arc(0, 0, s.rr * R, a0, a0 + s.len)
        ctx.stroke()
      }
      ctx.globalAlpha = 1
      ctx.restore()
    }

    function drawRingHalf(t, behind) {
      const rot = t * C.rotationSpeed
      for (const p of ring) {
        const pos = ringXY(p.rr, p.theta + rot)
        if (pos.behind !== behind) continue
        const twk = 0.7 + 0.3 * Math.sin(t * p.tw + p.phase)
        ctx.globalAlpha = p.alpha * twk * (behind ? 0.55 : 1) // back half dimmer
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(pos.x, pos.y, p.size, 0, TWO_PI)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }

    function drawPlanet(t) {
      const { cx, cy, R, blobs, dust } = planet

            // wide dreamy halo — cooler, bluer
      let g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 2.6)
      g.addColorStop(0, 'rgba(110, 150, 255, 0.34)')
      g.addColorStop(0.45, 'rgba(90, 120, 235, 0.14)')
      g.addColorStop(1, 'rgba(90, 120, 235, 0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(cx, cy, R * 2.6, 0, TWO_PI)
      ctx.fill()

      // base disc — stronger and bluer so the body clearly reads
      g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R)
      g.addColorStop(0, 'rgba(120, 160, 255, 0.42)')
      g.addColorStop(0.6, 'rgba(85, 115, 225, 0.32)')
      g.addColorStop(0.95, 'rgba(60, 80, 190, 0.18)')
      g.addColorStop(1, 'rgba(60, 80, 190, 0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, TWO_PI)
      ctx.fill()

      // wide dreamy halo — bigger and softer than before
      /*let g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 2.6)
      g.addColorStop(0, 'rgba(140, 130, 240, 0.3)')
      g.addColorStop(0.45, 'rgba(120, 120, 220, 0.12)')
      g.addColorStop(1, 'rgba(120, 120, 220, 0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(cx, cy, R * 2.6, 0, TWO_PI)
      ctx.fill()

      // faint base disc — just enough to suggest a body, mostly transparent
      // so the misty blobs do the work (deliberately NOT a smooth ball)
      g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R)
      g.addColorStop(0, 'rgba(93, 111, 212, 0.22)')
      g.addColorStop(0.8, 'rgba(70, 80, 170, 0.16)')
      g.addColorStop(1, 'rgba(70, 80, 170, 0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, TWO_PI)
      ctx.fill()*/

      // everything on the surface stays inside the disc
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, R * 0.99, 0, TWO_PI)
      ctx.clip()

      // misty banded blobs, slowly sliding sideways like cloud belts
      for (const b of blobs) {
        const shimmer = 0.75 + 0.25 * Math.sin(t * b.tw + b.phase)
        const bx = cx + ((((b.x + t * b.drift) + 1) % 2) - 1) * R
        const by = cy + b.y * R
        const br = b.size * R
        const bg = ctx.createRadialGradient(bx, by, 0, bx, by, br)
        bg.addColorStop(0, b.color)
        bg.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.globalAlpha = b.alpha * shimmer
        ctx.fillStyle = bg
        ctx.beginPath()
        ctx.arc(bx, by, br, 0, TWO_PI)
        ctx.fill()
      }

      // glowing dust specks — same twinkle language as the galaxy stars
      for (const d of dust) {
        ctx.globalAlpha = d.alpha * (0.5 + 0.5 * Math.sin(t * d.tw + d.phase))
        ctx.fillStyle = d.color
        ctx.beginPath()
        ctx.arc(cx + d.x * R, cy + d.y * R, d.size, 0, TWO_PI)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      // warm crescent rim on the galaxy-facing side (upper-right), feathered
      g = ctx.createRadialGradient(
        cx + R * 0.75, cy - R * 0.75, 0,
        cx + R * 0.75, cy - R * 0.75, R * 1.5
      )
      g.addColorStop(0, 'rgba(255, 243, 216, 0.4)')
      g.addColorStop(0.4, 'rgba(255, 243, 216, 0.12)')
      g.addColorStop(1, 'rgba(255, 243, 216, 0)')
      ctx.fillStyle = g
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2)

      ctx.restore()
    }

    function draw(t) {
      ctx.clearRect(0, 0, W, H)
      ctx.globalCompositeOperation = 'lighter'
      //drawRingBandsHalf(true)
      drawRingStreaksHalf(t, true)
      drawRingHalf(t, true)
      drawPlanet(t)
      ctx.globalCompositeOperation = 'source-over'
      //drawRingBandsHalf(false)
      drawRingStreaksHalf(t, false)
      ctx.globalCompositeOperation = 'lighter'
      drawRingHalf(t, false)
      for (const s of glints) {
        const a = 0.25 + 0.75 * Math.abs(Math.sin(t * s.tw + s.phase))
        drawSparkle(
          ctx,
          planet.cx + s.x * planet.R,
          planet.cy + s.y * planet.R,
          s.size, a * 0.85, s.color
        )
      }
      ctx.globalCompositeOperation = 'source-over'
    }

    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (visible) {
        elapsed += dt
        draw(elapsed)
      }
      raf = requestAnimationFrame(frame)
    }

    rebuild()
    if (reducedMotion) {
      draw(elapsed)
    } else {
      raf = requestAnimationFrame(frame)
    }

    const ro = new ResizeObserver(() => {
      rebuild()
      if (reducedMotion) draw(elapsed)
    })
    ro.observe(canvas.parentElement)

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
    })
    io.observe(canvas)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
    }
  }, [intensity])

  return <canvas ref={canvasRef} className={`planet-canvas ${className}`} aria-hidden="true" />
}