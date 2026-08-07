import { useEffect, useRef, useState } from 'react'
import './index.css'
import whaleJump from './assets/whale_jump.png'
import whaleSleep from './assets/whale_sleep.png'
import pillow from './assets/pillow.png'
import GalaxyStream from './components/GalaxyStream'
import Star from './components/Star'
import Cloud from './components/Cloud'
import Schedule from './components/Schedule'
import WishingWell from './components/WishingWell'

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
        <a href="#register" className="nav-register">Register →</a>
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

        {/* thin cloud wisps up top — squashed + extra-fuzzy so they read as sky streaks */}
        <div className="cloud-layer cloud-layer-top" aria-hidden="true">
          <div className="cloud-drift cloud-left" style={{ position: 'absolute', left: '2%', top: '12%' }}>
            <Cloud colors={['#ffffff', '#eef4ff', '#dbe8ff']} width={425} grain={0.4} fuzziness={54} opacity={0.55}
              drift driftSpeed={17} style={{ transform: 'scaleY(0.55)', transformOrigin: '50% 50%' }} />
          </div>
          <div className="cloud-drift cloud-left" style={{ position: 'absolute', left: '18%', top: '30%' }}>
            <Cloud colors={['#ffffff', '#f0f5ff', '#d5e6ff']} width={300} grain={0.4} fuzziness={56} opacity={0.4}
              drift driftSpeed={21} style={{ transform: 'scaleY(0.5)', transformOrigin: '50% 50%' }} />
          </div>
          <div className="cloud-drift cloud-right" style={{ position: 'absolute', right: '4%', top: '20%' }}>
            <Cloud colors={['#ffffff', '#f3ecff', '#e2d6ff']} width={350} grain={0.4} fuzziness={54} opacity={0.5}
              drift driftSpeed={14} style={{ transform: 'scaleY(0.55)', transformOrigin: '50% 50%' }} />
          </div>
          <div className="cloud-drift cloud-right" style={{ position: 'absolute', right: '22%', top: '8%' }}>
            <Cloud colors={['#ffffff', '#f6efff', '#e8dcff']} width={250} grain={0.4} fuzziness={56} opacity={0.38}
              drift driftSpeed={19} style={{ transform: 'scaleY(0.5)', transformOrigin: '50% 50%' }} />
          </div>
          {/* mid-sky wisps filling out the sides */}
          <div className="cloud-drift cloud-left" style={{ position: 'absolute', left: '8%', top: '46%' }}>
            <Cloud colors={['#ffffff', '#f0f5ff', '#d9e6ff']} width={325} grain={0.4} fuzziness={55} opacity={0.42}
              drift driftSpeed={20} style={{ transform: 'scaleY(0.52)', transformOrigin: '50% 50%' }} />
          </div>
          <div className="cloud-drift cloud-right" style={{ position: 'absolute', right: '10%', top: '42%' }}>
            <Cloud colors={['#ffffff', '#f4edff', '#e3d6ff']} width={300} grain={0.4} fuzziness={56} opacity={0.4}
              drift driftSpeed={16} style={{ transform: 'scaleY(0.52)', transformOrigin: '50% 50%' }} />
          </div>
          {/* extra wisps that only appear on wide screens */}
          <div className="cloud-drift cloud-left cloud-xl" style={{ position: 'absolute', left: '38%', top: '5%' }}>
            <Cloud colors={['#ffffff', '#f0f5ff', '#dbe8ff']} width={375} grain={0.42} fuzziness={55} opacity={0.42}
              drift driftSpeed={24} style={{ transform: 'scaleY(0.5)', transformOrigin: '50% 50%' }} />
          </div>
          <div className="cloud-drift cloud-right cloud-xl" style={{ position: 'absolute', right: '38%', top: '32%' }}>
            <Cloud colors={['#ffffff', '#f3ecff', '#dfd2ff']} width={287} grain={0.42} fuzziness={57} opacity={0.36}
              drift driftSpeed={18} style={{ transform: 'scaleY(0.5)', transformOrigin: '50% 50%' }} />
          </div>
        </div>

        {/* back + mid cloud bank — sits BEHIND the whale */}
        <div className="cloud-bank" aria-hidden="true">
          <div className="cloud-drift cloud-left" style={{ position: 'absolute', left: '-14%', bottom: '-2%' }}>
            <Cloud colors={['#ffffff', '#eaf1ff', '#cddffb']} width={950} grain={0.4} fuzziness={56} opacity={0.75}
              drift driftSpeed={22} style={{ transform: 'scaleY(0.62)', transformOrigin: '50% 100%' }} />
          </div>
          <div className="cloud-drift cloud-right" style={{ position: 'absolute', right: '-14%', bottom: '-2%' }}>
            <Cloud colors={['#ffffff', '#f1eaff', '#d7cbfb']} width={925} grain={0.4} fuzziness={56} opacity={0.75}
              drift driftSpeed={20} style={{ transform: 'scaleY(0.62)', transformOrigin: '50% 100%' }} />
          </div>
          {/* offset puffs filling the gap between back and front layers */}
          <div className="cloud-drift cloud-left" style={{ position: 'absolute', left: '22%', bottom: '2%' }}>
            <Cloud colors={['#ffffff', '#fff2f9', '#ffdcef']} width={550} grain={0.4} fuzziness={54} opacity={0.85}
              drift driftSpeed={21} style={{ transform: 'scaleY(0.6)', transformOrigin: '50% 100%' }} />
          </div>
          <div className="cloud-drift cloud-right" style={{ position: 'absolute', right: '20%', bottom: '0%' }}>
            <Cloud colors={['#ffffff', '#eef6ff', '#cfe6ff']} width={575} grain={0.4} fuzziness={54} opacity={0.85}
              drift driftSpeed={23} style={{ transform: 'scaleY(0.6)', transformOrigin: '50% 100%' }} />
          </div>
          {/* dense fillers so no sky shows through the bed */}
          <div className="cloud-drift cloud-center" style={{ position: 'absolute', left: '50%', bottom: '-6%' }}>
            <Cloud colors={['#ffffff', '#f0f4ff', '#d6e2ff']} width={700} grain={0.4} fuzziness={55} opacity={0.8}
              drift driftSpeed={25} style={{ transform: 'scaleY(0.6)', transformOrigin: '50% 100%' }} />
          </div>
          <div className="cloud-drift cloud-left" style={{ position: 'absolute', left: '4%', bottom: '8%' }}>
            <Cloud colors={['#ffffff', '#f4eefe', '#e2d3fb']} width={500} grain={0.4} fuzziness={55} opacity={0.7}
              drift driftSpeed={19} style={{ transform: 'scaleY(0.58)', transformOrigin: '50% 100%' }} />
          </div>
          <div className="cloud-drift cloud-right" style={{ position: 'absolute', right: '32%', bottom: '7%' }}>
            <Cloud colors={['#ffffff', '#fdf0f8', '#f4d9ec']} width={475} grain={0.4} fuzziness={55} opacity={0.7}
              drift driftSpeed={24} style={{ transform: 'scaleY(0.58)', transformOrigin: '50% 100%' }} />
          </div>
          {/* extra bank puffs that only appear on wide screens */}
          <div className="cloud-drift cloud-left cloud-xl" style={{ position: 'absolute', left: '6%', bottom: '16%' }}>
            <Cloud colors={['#ffffff', '#f2f6ff', '#d8e4ff']} width={475} grain={0.42} fuzziness={55} opacity={0.6}
              drift driftSpeed={26} style={{ transform: 'scaleY(0.58)', transformOrigin: '50% 100%' }} />
          </div>
          <div className="cloud-drift cloud-right cloud-xl" style={{ position: 'absolute', right: '4%', bottom: '20%' }}>
            <Cloud colors={['#ffffff', '#f6f0ff', '#e0d4ff']} width={450} grain={0.42} fuzziness={55} opacity={0.55}
              drift driftSpeed={20} style={{ transform: 'scaleY(0.58)', transformOrigin: '50% 100%' }} />
          </div>
        </div>

        <div className="section-inner title-inner">
          <div className="title-whale-wrap">
            <img src={whaleJump} alt="whale logo" className="title-whale whale-arc" />
          </div>
          <div className="title-text">
            <span className="title-kicker">Whack 2026</span>
            <h1>Wish upon<br />a Whale</h1>
            <span className="title-date">November 20-22, 2026 · Wellesley College</span>
          </div>
        </div>

        {/* front cloud bank — sits IN FRONT of the whale so it rises out of the clouds */}
        <div className="cloud-bank cloud-bank-front" aria-hidden="true">
          <div className="cloud-drift cloud-left" style={{ position: 'absolute', left: '2%', bottom: '-8%' }}>
            <Cloud colors={['#ffffff', '#ffeef7', '#ffd3ea']} width={725} grain={0.4} fuzziness={52} opacity={0.88}
              drift driftSpeed={18} style={{ transform: 'scaleY(0.58)', transformOrigin: '50% 100%' }} />
          </div>
          <div className="cloud-drift cloud-right" style={{ position: 'absolute', right: '0%', bottom: '-10%' }}>
            <Cloud colors={['#ffffff', '#eaf4ff', '#c6e2ff']} width={775} grain={0.4} fuzziness={52} opacity={0.88}
              drift driftSpeed={16} style={{ transform: 'scaleY(0.58)', transformOrigin: '50% 100%' }} />
          </div>
          <div className="cloud-drift cloud-center" style={{ position: 'absolute', left: '50%', bottom: '-14%' }}>
            <Cloud colors={['#ffffff', '#f7fbff', '#e4effd']} width={975} grain={0.35} fuzziness={50} opacity={0.95}
              drift driftSpeed={24} style={{ transform: 'scaleY(0.6)', transformOrigin: '50% 100%' }} />
          </div>
          <div className="cloud-drift cloud-left" style={{ position: 'absolute', left: '18%', bottom: '-11%' }}>
            <Cloud colors={['#ffffff', '#fdf2f9', '#f3dcef']} width={625} grain={0.4} fuzziness={53} opacity={0.9}
              drift driftSpeed={21} style={{ transform: 'scaleY(0.58)', transformOrigin: '50% 100%' }} />
          </div>
          <div className="cloud-drift cloud-right" style={{ position: 'absolute', right: '24%', bottom: '-12%' }}>
            <Cloud colors={['#ffffff', '#eef4ff', '#d3e4ff']} width={600} grain={0.4} fuzziness={53} opacity={0.9}
              drift driftSpeed={19} style={{ transform: 'scaleY(0.58)', transformOrigin: '50% 100%' }} />
          </div>
          <div className="cloud-drift cloud-left cloud-xl" style={{ position: 'absolute', left: '38%', bottom: '-8%' }}>
            <Cloud colors={['#ffffff', '#f6f9ff', '#e2ecff']} width={525} grain={0.42} fuzziness={53} opacity={0.85}
              drift driftSpeed={23} style={{ transform: 'scaleY(0.58)', transformOrigin: '50% 100%' }} />
          </div>
        </div>
      </section>

      {/* ── Section 4 · Schedule ── */}
      <section id="schedule" className="section section-4">
        {/* cloud bed the hourglass rests in */}
        <div className="cloud-layer cloud-layer-bottom" aria-hidden="true">
          <Cloud color="#dfe8fb" width={520} grain={0.42} fuzziness={40} opacity={0.9}
            drift driftSpeed={22}
            style={{ position: 'absolute', left: '-8%', bottom: '-2%' }} />
          <Cloud color="#e6ecff" width={480} grain={0.4} fuzziness={40} opacity={0.88}
            drift driftSpeed={19}
            style={{ position: 'absolute', right: '-6%', bottom: '4%' }} />
          <Cloud color="#eef0ff" width={360} grain={0.4} opacity={0.8}
            drift driftSpeed={16}
            style={{ position: 'absolute', left: '34%', bottom: '-6%' }} />
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
        <div className="well-wrap" style={{ width: '90%', height: '800px', position: 'relative' }}>
            <WishingWell />
        </div>
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
