import { useEffect, useRef, useState } from 'react'
import StarrySky from '@gura_ame/starry-sky'
import '@gura_ame/starry-sky/dist/StarrySky.css'
import './index.css'
import whaleJump from './assets/logo.png'
import turtle from './assets/turtle.png'
import wishingWell from './assets/wishing_well.png'
import whaleSleep from './assets/logo_sleep.png'
import mermaid from './assets/mermaid.png'
import pillow from './assets/pillow.png'
import GalaxyStream from './components/GalaxyStream'
import Star from './components/Star'
import Cloud from './components/Cloud'
import Schedule from './components/Schedule'
//import WishingWell from './components/WishingWell'
import Waves from './components/Waves'

// StarrySky regenerates every star whenever this prop changes identity, and App
// re-renders on every scroll tick — so this MUST be a stable module-level
// constant, never an inline array literal, or the sky reshuffles as you scroll.
const METEOR_INTERVAL = [4000, 10000]

function App() {
  const heroRef = useRef(null)
  const navRef = useRef(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight
      if (totalHeight > 0) {
        const progress = window.scrollY / totalHeight
        setScrollProgress(progress)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Drive the full-page sky gradient (body::before): give it the document's
  // height and slide it up by the scroll offset, so the six colour stops
  // stretch across the entire scroll rather than repeating per viewport.
  useEffect(() => {
    let raf = 0
    const apply = () => {
      raf = 0
      const docH = document.documentElement.scrollHeight
      document.body.style.setProperty('--doc-h', docH + 'px')
      document.body.style.setProperty('--sky-shift', window.scrollY + 'px')

      // The ramp's first stop (#F5E2FF → #192C67) runs over the top 17% of the
      // page. Nav text stays dark while the viewport top is in the paler
      // ~40% of that stretch, then flips to light as the sky turns navy.
      const paleZone = docH * 0.17 * 0.42
      navRef.current?.classList.toggle('nav-on-light', window.scrollY < paleZone)
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(apply) }
    apply()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    const ro = new ResizeObserver(onScroll)
    ro.observe(document.body)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      ro.disconnect()
    }
  }, [])

  const leftPosition = 85 - 280 * scrollProgress * (1 - scrollProgress)
  const topPosition = 50 + (scrollProgress * 20)

  // Part the hero clouds as you scroll down: 0 (closed) → 1 (fully parted).
  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return
    let raf = 0
    const update = () => {
      raf = 0
      const h = hero.offsetHeight || 1
      // progress through the hero's own scroll span
      const p = Math.min(1, Math.max(0, window.scrollY / (h * 0.85)))
      hero.style.setProperty('--part', p.toFixed(3))

      // big scroll-driven whale arc: sweeps up-and-over along a parabola.
      const arcX = p * 40                    // px: drifts right across the hero
      const arcY = -Math.sin(p * Math.PI) * 80 // px: rises to a peak mid-scroll, comes back down
      const arcRot = Math.sin(p * Math.PI) * 6 - p * 3 // tilts up then noses over
      hero.style.setProperty('--whale-x', arcX.toFixed(1) + 'px')
      hero.style.setProperty('--whale-y', arcY.toFixed(1) + 'px')
      hero.style.setProperty('--whale-rot', arcRot.toFixed(2) + 'deg')

    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <>
      {/* ── Floating Scrolling Star ── */}
      {/* <div
        className="scrolling-star"
        style={{
          position: 'fixed',
          left: `${leftPosition}vw`,
          top: `${topPosition}vh`,
          transform: 'translate(-50%, -50%)',
          width: '240px',  // Provides enough clipping margins for 3D bloom trails
          height: '240px', 
          pointerEvents: 'none',
          zIndex: 100,
        }}
      >
        < Star />
      </div> */}
      {/* ── Nav ── */}
      <nav ref={navRef}>
        <a href="#hero" className="nav-logo">WHACK 2026</a>
        <ul className="nav-links">
          <li><a href="#schedule">Schedule</a></li>
          <li><a href="#tracks">Tracks</a></li>
          <li><a href="#sponsors">Sponsors</a></li>
          <li><a href="#faq">FAQ</a></li>
        </ul>
        <a href="#register" className="nav-register">Register</a>
      </nav>

      {/* ── Sky band: hero + schedule share ONE star field ──
          .sky-stars is an absolutely-positioned frame spanning both sections;
          inside it the field is position:fixed so the stars stay perfectly
          still while the page scrolls past, and the frame's mask fades it
          out at the bottom of the schedule. Moon/forest are off:
          the hero has its own crescent moon and clouds. */}
      <div className="sky-band">
        <div className="sky-stars" aria-hidden="true">
          <div className="sky-stars-field">
            <StarrySky starCount={300} meteorInterval={METEOR_INTERVAL} showMoon={false} showForest={false} />
          </div>
        </div>

      {/* ── Section 1 · Hero ── */}
      <section id="hero" className="section section-1" ref={heroRef}>
        {/* big crescent moon behind everything */}
        <div className="hero-moon" aria-hidden="true" />

        {/* upper-sky wisps — two thin white streaks, each cut off by the screen
            edge (left one bleeds off the left, right one off the right). Both
            slide slightly RIGHT as you scroll (see .cloud-nudge-right). */}
        <div className="cloud-layer cloud-layer-top" aria-hidden="true">
          <div className="cloud-drift cloud-left" style={{ position: 'absolute', left: '-14%', top: '14%' }}>
            <Cloud src="cloud-wisp.png" width="clamp(320px, 36vw, 640px)" opacity={0.95} drift driftSpeed={17} />
          </div>
          <div className="cloud-drift cloud-right" style={{ position: 'absolute', right: '-12%', top: '7%' }}>
            <Cloud src="cloud-wisp.png" width="clamp(260px, 28vw, 520px)" opacity={0.95} drift driftSpeed={14} />
          </div>
          {/* mid-sky pair under the whale: white puff bleeding off the left,
              big blue cloud bleeding off the right */}
          <div className="cloud-drift cloud-left" style={{ position: 'absolute', left: '-8%', top: '42%' }}>
            <Cloud src="cloud-white.png" width="clamp(360px, 42vw, 760px)" drift driftSpeed={19} />
          </div>
          <div className="cloud-drift cloud-right" style={{ position: 'absolute', right: '-10%', top: '38%' }}>
            <Cloud src="cloud-big.png" width="clamp(640px, 76vw, 1400px)" drift driftSpeed={21} />
          </div>
        </div>

        {/* FRONT layer — above the whale, below the title text. Flipped big
            cloud on the left, overlapping the white cloud behind the whale. */}
        <div className="cloud-layer cloud-layer-front" aria-hidden="true">
          <div className="cloud-drift cloud-left" style={{ position: 'absolute', left: '-12%', top: '48%' }}>
            <Cloud src="cloud-big.png" flip width="clamp(560px, 66vw, 1200px)" drift driftSpeed={23} />
          </div>
        </div>

        {/* TOPMOST cloud layer — two side clouds forming the lowest band,
            above every other cloud but still below the title text. */}
        <div className="cloud-layer cloud-layer-frontmost" aria-hidden="true">
          {/* centered wide cloud, rendered first so it sits UNDER the two side clouds */}
          <div className="cloud-drift cloud-center" style={{ position: 'absolute', left: '50%', top: '60%' }}>
            <Cloud src="cloud.png" width="clamp(560px, 64vw, 1200px)" drift driftSpeed={20} />
          </div>
          <div className="cloud-drift cloud-left" style={{ position: 'absolute', left: '-26%', top: '58%' }}>
            <Cloud src="cloud-side.png" flip width="clamp(540px, 62vw, 1140px)" drift driftSpeed={18} />
          </div>
          <div className="cloud-drift cloud-right" style={{ position: 'absolute', right: '-22%', top: '56%' }}>
            <Cloud src="cloud-side.png" width="clamp(540px, 62vw, 1140px)" drift driftSpeed={24} />
          </div>
        </div>

        <div className="section-inner title-inner">
          <div className="title-whale-wrap">
            <img src={whaleJump} alt="whale logo" className="title-whale whale-arc" />
            <img src={turtle} alt="" className="hero-turtle" aria-hidden="true" />
          </div>
          <div className="title-text">
            <span className="title-kicker">WHACK 2026</span>
            <div className="theme-title">Wish upon<br/>a Whale</div>
            <span className="title-date">November 20-22, 2026 · Wellesley College</span>
          </div>
        </div>

      </section>

      {/* ── Section 4 · Schedule ── */}
      <section id="schedule" className="section section-4">
        <div className="section-inner centered">
          <h1>The Schedule</h1>
          <Schedule />
        </div>
      </section>
      </div>{/* /sky-band */}

      {/* ── Section 5 · Tracks ── */}
      <section id="tracks" className="section section-5 galaxy-section">
        <GalaxyStream variant="galaxy" />
        <div className="section-inner centered">
          <h1>Tracks</h1>
          <div className="tracks">
            <div className="track-card first">
              <div className="track-name">Better Worlds: Dreaming of a better future</div>
              <div className="track-desc">Design solutions that reimagine society. Tackle challenges like accessibility, education, sustainability, and equity to turn hopeful visions into meaningful change for communities around the world.</div>
            </div>
            <div className="track-card">
              <div className="track-name">Beyond Reality: Imagining far and wide</div>
              <div className="track-desc">Push the boundaries of technology. Build cutting-edge tools, platforms, or systems that explore what’s next—whether it’s AI, VR/AR, cybersecurity, or entirely new ways of thinking.</div>
            </div>
            <div className="track-card">
              <div className="track-name">In Your Wildest Dreams: Open category</div>
              <div className="track-desc">No rules, no limits. Let your creativity run free and bring your most imaginative ideas to life. Could be practical, playful or completely out-of-the-box.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 6 · Sponsors ── */}
      <section id="sponsors" className="section section-6">
        <div className="section-inner centered">
          <h1>Sponsors</h1>
          <div className="sponsor-tiers">
            <div className="sponsor-tier-label">Platinum</div>
            <div className="sponsor-row">
              <span className="sponsor-pill">Anthropic</span>
              <span className="sponsor-pill">GitHub</span>
            </div>
            <div className="sponsor-tier-label">Gold</div>
            <div className="sponsor-row">
              <span className="sponsor-pill">Figma</span>
              <span className="sponsor-pill">Vercel</span>
              <span className="sponsor-pill">MongoDB</span>
            </div>
            <div className="sponsor-tier-label">Silver</div>
            <div className="sponsor-row">
              <span className="sponsor-pill">Twilio</span>
              <span className="sponsor-pill">Cloudflare</span>
              <span className="sponsor-pill">Notion</span>
              <span className="sponsor-pill">Linear</span>
            </div>
          </div>
          <div className="sponsors-illustration" aria-hidden="true">
            <img src={wishingWell} alt="" className="sponsors-well" />
          </div>
        {/*<div className="well-wrap" style={{ width: '90%', height: '800px', position: 'relative' }}>
            <WishingWell />
        </div>*/}
        </div>
        <p className="section-lead">
            Interested in sponsoring?{' '}
            <a href="mailto:sponsor@whack.ucsc.edu" style={{ color: 'white' }}>Reach out →</a>
        </p>
      </section>

      {/* ── Section 7 · FAQ ── */}
      <section id="faq" className="section section-7">
        <div className="section-inner">
          <h1>Frequently Asked Questions</h1>
          <p className="section-lead">
            Here are the most common questions we get. Still curious?{' '}
            <a href="mailto:hello@whack.ucsc.edu" style={{ color: 'white' }}>Email us →</a>
          </p>
        </div>
        <Waves
          items={[
            { q: 'Who can participate?', a: 'WHACK is open to all current college and university students. As long as you are enrolled in a degree-seeking program, you can attend.' },
            { q: 'Do I need a team?', a: "You can apply solo or with a team of up to 4. We also have a team-forming event on Friday evening to help you mingle and find teammates. Once you're in, you can also check out our discord to meet people in advance!" },
            { q: 'Is it free to attend?', a: 'Everything is free! (Including registration, meals, snacks, swag, and workshop access).' },
            { q: 'Does WHACK reimburse travel?', a: "We unfortunately do not reimburse travel." },
            { q: 'Where can I stay?', a: "We'll have designated sleeping areas in the Tishman Commons of the Lulu Chow Wang Center, where WHACK will be hosted." },
            { q: 'Will there be food?', a: "We'll provide three meals on Saturday and two meals on Sunday (breakfast and lunch)." },
            { q: "What if I've never hacked before?", a: 'You can still attend! We welcome beginners, especially first-time hackers. If you find yourself struggling, we have beginner-friendly workshops and a dedicated mentorship team to help you with any questions.' },
          ]}
        />
      </section>

      {/* ── Section 8 · Register CTA ── */}
      <section id="register" className="section section-8">
        <div className="section-inner register-inner">
          <div className="register-content">
            <h2>Ready to build?</h2>
            <p className="section-lead">
              Applications for WHACK 2026 open August 15. Spots are limited —
              get on the list and be first to know.
            </p>
            <a href="mailto:hello@whack.ucsc.edu" className="btn-white">Apply for WHACK 2026</a>
          </div>

          <div className="register-illustration" aria-hidden="true">
            <img src={pillow} alt="" className="register-pillow" />
            {/* <img src={whaleSleep} alt="Sleeping Whale" className="register-whale" /> */}
            <img src={mermaid} alt="" className="register-mermaid"/>
          </div>
        </div>
      </section>

      <footer>
        © 2026 WHACK Hackathon · Wellesley College · Made with love and too much coffee
      </footer>
    </>
  )
}

export default App
