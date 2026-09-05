import { useEffect, useRef, useState } from 'react'
import './index.css'
import whaleJump from './assets/logo.png'
import wishingWell from './assets/wishing_well.png'
import whaleSleep from './assets/logo_sleep.png'
import pillow from './assets/pillow.png'
import GalaxyStream from './components/GalaxyStream'
import Star from './components/Star'
import Cloud from './components/Cloud'
import Schedule from './components/Schedule'
//import WishingWell from './components/WishingWell'

function App() {
  const heroRef = useRef(null)
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
      const arcX = p * 320                    // px: drifts right across the hero
      const arcY = -Math.sin(p * Math.PI) * 220 // px: rises to a peak mid-scroll, comes back down
      const arcRot = Math.sin(p * Math.PI) * 16 - p * 8 // tilts up then noses over
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
      <div
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
      </div>
      {/* ── Nav ── */}
      <nav>
        <a href="#hero" className="nav-logo">WHACK 2026</a>
        <ul className="nav-links">
          <li><a href="#schedule">Schedule</a></li>
          <li><a href="#tracks">Tracks</a></li>
          <li><a href="#sponsors">Sponsors</a></li>
          <li><a href="#faq">FAQ</a></li>
        </ul>
        <a href="#register" className="nav-register">Register</a>
      </nav>

      {/* ── Section 1 · Hero ── */}
      <section id="hero" className="section section-1" ref={heroRef}>
        {/* big crescent moon behind everything */}
        <div className="hero-moon" aria-hidden="true" />

        {/* scattered stars */}
        <div className="star-field" aria-hidden="true">
          <span className="sky-star sky-star-y" style={{ left: '58%', top: '22%', '--s': '18px' }} />
          <span className="sky-star" style={{ left: '68%', top: '14%', '--s': '13px' }} />
          <span className="sky-star sky-star-y" style={{ left: '82%', top: '34%', '--s': '15px' }} />
          <span className="sky-star" style={{ left: '20%', top: '52%', '--s': '11px' }} />
          <span className="sky-star sky-star-y" style={{ left: '14%', top: '40%', '--s': '13px' }} />
          <span className="sky-star" style={{ left: '76%', top: '58%', '--s': '10px' }} />
        </div>

        {/* upper-sky clouds — just 3 large, well-spread puffs. A few big opaque
            clouds read as a full sky far cheaper than many small ones. */}
        <div className="cloud-layer cloud-layer-top" aria-hidden="true">
          <div className="cloud-drift cloud-left" style={{ position: 'absolute', left: '-6%', top: '11%' }}>
            <Cloud colors={['#ffffff', '#dbe8ff', '#a9c6f5']} width="clamp(320px, 40vw, 700px)" grain={0.38} fuzziness={46} opacity={0.9}
              drift driftSpeed={17} style={{ transform: 'scaleY(0.66)', transformOrigin: '50% 50%' }} />
          </div>
          <div className="cloud-drift cloud-right" style={{ position: 'absolute', right: '-6%', top: '16%' }}>
            <Cloud colors={['#ffffff', '#ffe0f0', '#f2a9cf']} width="clamp(280px, 36vw, 640px)" grain={0.38} fuzziness={46} opacity={0.88}
              drift driftSpeed={14} style={{ transform: 'scaleY(0.66)', transformOrigin: '50% 50%' }} />
          </div>
          {/* wide-screen only: one extra to fill the upper middle */}
          <div className="cloud-drift cloud-right cloud-xl" style={{ position: 'absolute', right: '38%', top: '5%' }}>
            <Cloud colors={['#ffffff', '#ece0ff', '#c6abee']} width="clamp(240px, 28vw, 520px)" grain={0.4} fuzziness={47} opacity={0.8}
              drift driftSpeed={20} style={{ transform: 'scaleY(0.62)', transformOrigin: '50% 50%' }} />
          </div>
        </div>

        {/* back cloud bank — sits BEHIND the whale. Two wide opaque clouds that
            overlap across the base so no sky shows through, with NO center cloud
            (the single center cloud lives in the front V below). */}
        <div className="cloud-bank" aria-hidden="true">
          <div className="cloud-drift cloud-left" style={{ position: 'absolute', left: '-16%', bottom: '-4%' }}>
            <Cloud colors={['#ffffff', '#eaf1ff', '#cddffb']} width="clamp(720px, 88vw, 1600px)" grain={0.38} fuzziness={44} opacity={0.9}
              drift driftSpeed={22} style={{ transform: 'scaleY(0.78)', transformOrigin: '50% 100%' }} />
          </div>
          <div className="cloud-drift cloud-right" style={{ position: 'absolute', right: '-16%', bottom: '-4%' }}>
            <Cloud colors={['#ffffff', '#f1eaff', '#d7cbfb']} width="clamp(720px, 86vw, 1560px)" grain={0.38} fuzziness={44} opacity={0.9}
              drift driftSpeed={20} style={{ transform: 'scaleY(0.78)', transformOrigin: '50% 100%' }} />
          </div>
        </div>

        <div className="section-inner title-inner">
          <div className="title-whale-wrap">
            <img src={whaleJump} alt="whale logo" className="title-whale whale-arc" />
          </div>
          <div className="title-text">
            <span className="title-kicker">WHACK 2026</span>
            <div className="theme-title">Wish upon<br/>a Whale</div>
            <span className="title-date">November 20-22, 2026 · Wellesley College</span>
          </div>
        </div>

        {/* front cloud BAND — a single continuous puffy strip across the MIDDLE
            of the hero (positioned by `top`, ~half-way down) that the whale
            rises out of. Clouds sit at the SAME height and overlap edge-to-edge
            so the top edge reads as one unbroken, billowy line (reference img). */}
        <div className="cloud-bank cloud-bank-top" aria-hidden="true">
          <div className="cloud-drift cloud-left" style={{ position: 'absolute', left: '-16%', top: '50%' }}>
            <Cloud colors={['#ffffff', '#eef4ff', '#cbdcf7']} width="clamp(560px, 64vw, 1180px)" grain={0.38} fuzziness={44} opacity={1}
              drift driftSpeed={20} style={{ transform: 'scaleY(0.66)', transformOrigin: '50% 50%' }} />
          </div>
          <div className="cloud-drift cloud-left" style={{ position: 'absolute', left: '18%', top: '50%' }}>
            <Cloud colors={['#ffffff', '#f3edff', '#d8cbf5']} width="clamp(520px, 60vw, 1120px)" grain={0.38} fuzziness={44} opacity={1}
              drift driftSpeed={22} style={{ transform: 'scaleY(0.66)', transformOrigin: '50% 50%' }} />
          </div>
          <div className="cloud-drift cloud-right" style={{ position: 'absolute', right: '16%', top: '50%' }}>
            <Cloud colors={['#ffffff', '#eef4ff', '#cfe0fa']} width="clamp(520px, 60vw, 1120px)" grain={0.38} fuzziness={44} opacity={1}
              drift driftSpeed={21} style={{ transform: 'scaleY(0.66)', transformOrigin: '50% 50%' }} />
          </div>
          <div className="cloud-drift cloud-right" style={{ position: 'absolute', right: '-16%', top: '50%' }}>
            <Cloud colors={['#ffffff', '#f3edff', '#d5cbf5']} width="clamp(560px, 64vw, 1180px)" grain={0.38} fuzziness={44} opacity={1}
              drift driftSpeed={19} style={{ transform: 'scaleY(0.66)', transformOrigin: '50% 50%' }} />
          </div>
        </div>
      </section>

      {/* ── Section 4 · Schedule ── */}
      <section id="schedule" className="section section-4">
        {/* cloud bed the hourglass rests in — arranged in a V: high at the
            outer edges, dipping to the center so the glass sits in the trough.
            Cool white-gray so they read as cloud rather than tinted sky. */}
        <div className="cloud-layer cloud-layer-bottom" aria-hidden="true">
          {/* far left — top of the V arm, riding high up the edge */}
          <Cloud colors={['#ffffff', '#f4f6f9', '#c8d0dc']} width="clamp(600px, 72vw, 1320px)" grain={0.4} fuzziness={44} opacity={0.9}
            drift driftSpeed={22}
            style={{ position: 'absolute', left: '-16%', bottom: '30%', transform: 'scaleY(0.72)', transformOrigin: '50% 100%' }} />
          {/* far right — top of the V arm */}
          <Cloud colors={['#ffffff', '#f2f5f8', '#c3ccd9']} width="clamp(560px, 66vw, 1240px)" grain={0.4} fuzziness={44} opacity={0.9}
            drift driftSpeed={19}
            style={{ position: 'absolute', right: '-14%', bottom: '32%', transform: 'scaleY(0.7)', transformOrigin: '50% 100%' }} />
          {/* mid-left — dropping steeply toward the trough */}
          <Cloud colors={['#ffffff', '#f5f7fa', '#ccd4e0']} width="clamp(480px, 56vw, 1040px)" grain={0.4} fuzziness={44} opacity={0.92}
            drift driftSpeed={17}
            style={{ position: 'absolute', left: '-4%', bottom: '6%', transform: 'scaleY(0.7)', transformOrigin: '50% 100%' }} />
          {/* mid-right — dropping steeply toward the trough */}
          <Cloud colors={['#ffffff', '#f3f6f9', '#c9d1de']} width="clamp(450px, 52vw, 980px)" grain={0.4} fuzziness={44} opacity={0.92}
            drift driftSpeed={20}
            style={{ position: 'absolute', right: '-2%', bottom: '8%', transform: 'scaleY(0.7)', transformOrigin: '50% 100%' }} />
          {/* valley floor — dead center, the glass rests in this dip */}
          <Cloud colors={['#ffffff', '#f6f8fa', '#d2d9e4']} width="clamp(520px, 60vw, 1120px)" grain={0.36} fuzziness={42} opacity={0.95}
            drift driftSpeed={16}
            style={{ position: 'absolute', left: '50%', bottom: '-16%', transform: 'translateX(-50%) scaleY(0.72)', transformOrigin: '50% 100%' }} />
        </div>

        <div className="section-inner centered">
          <h1>The Schedule</h1>
          <Schedule />
        </div>
      </section>

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
          <div className="faq">
            {[
              { q: 'Who can participate?', a: 'WHACK is open to all current college and university students. No matter your major, background, or experience level — everyone is welcome.' },
              { q: 'Do I need a team?', a: "You can apply solo or with a team of up to 4. If you are flying solo, we'll have a team-forming event Friday evening so you won't be alone for long." },
              { q: 'Is it free to attend?', a: 'Yes! Registration, meals, snacks, swag, and workshop access are all completely free. We also provide travel reimbursements for qualifying applicants.' },
              { q: 'What should I bring?', a: 'Laptop, chargers, any hardware you plan to use, and a sleeping bag if you want to crash on-site. We handle the rest.' },
              { q: 'Are beginners welcome?', a: 'Absolutely. We have beginner-friendly workshops and a dedicated mentorship team to help you get unstuck and ship something you are proud of.' },
              { q: 'When do applications open?', a: 'Applications open January 15, 2026. Decisions are rolling, so apply early for the best chance of acceptance.' },
            ].map((item) => (
              <div className="faq-item" key={item.q}>
                <div className="faq-q">{item.q}</div>
                <div className="faq-a">{item.a}</div>
              </div>
            ))}
          </div>
        </div>
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
            <img src={whaleSleep} alt="Sleeping Whale" className="register-whale" />
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
