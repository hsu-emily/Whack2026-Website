import './index.css'
import whaleJump from './assets/whale_jump.png'

function App() {
  return (
    <>
      {/* ── Nav ── */}
      <nav>
        <a href="#hero" className="nav-logo">WHACK 2026</a>
        <ul className="nav-links">
          <li><a href="#about">About</a></li>
          <li><a href="#stats">By the Numbers</a></li>
          <li><a href="#schedule">Schedule</a></li>
          <li><a href="#prizes">Prizes</a></li>
          <li><a href="#sponsors">Sponsors</a></li>
          <li><a href="#faq">FAQ</a></li>
        </ul>
        <a href="#register" className="nav-register">Register →</a>
      </nav>

      {/* ── Section 1 · Hero ── */}
      <section id="hero" className="section section-1">
        <div className="section-inner title-inner">
          <img src={whaleJump} alt="whale logo" className="title-whale" />
          <div className="title-text">
            <span className="eyebrow">November 10-12, 2026 · Wellesley College</span>
            <h1>Build Something<br />That Matters.</h1>
            <p className="section-lead">
              WHACK is a 36-hour hackathon where students, designers, and engineers
              come together to turn bold ideas into working products.
            </p>
            <div className="hero-actions">
              <a href="#register" className="btn-primary">Apply Now</a>
              <a href="#about" className="btn-outline">Learn More</a>
            </div>
          </div>

        </div>
      </section>

      {/* ── Section 2 · About ── */}
      <section id="about" className="section section-2">
        <div className="section-inner">
          <span className="eyebrow">What is WHACK?</span>
          <h2>36 hours. Infinite possibilities.</h2>
          <p className="section-lead">
            WHACK brings together curious minds from across the country for a
            weekend of hacking, learning, and community. No experience required —
            just bring your ideas.
          </p>
          <div className="cards">
            <div className="card">
              <div className="card-icon">🛠</div>
              <h3>Build</h3>
              <p>Prototype anything — apps, hardware, art, tools. If you can dream it, you can hack it.</p>
            </div>
            <div className="card">
              <div className="card-icon">🧠</div>
              <h3>Learn</h3>
              <p>Workshops, mentors, and tech talks from industry leaders throughout the weekend.</p>
            </div>
            <div className="card">
              <div className="card-icon">🤝</div>
              <h3>Connect</h3>
              <p>Network with 400+ students, founders, and engineers from across the region.</p>
            </div>
            <div className="card">
              <div className="card-icon">🚀</div>
              <h3>Launch</h3>
              <p>Demo your project to judges and sponsors. Real prizes, real feedback, real impact.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3 · Stats ── */}
      <section id="stats" className="section section-3">
        <div className="section-inner centered">
          <span className="eyebrow">By the Numbers</span>
          <h2>WHACK 2025 by the numbers</h2>
          <p className="section-lead">
            Every year WHACK grows bigger. Here's a snapshot of what we accomplished together last year.
          </p>
          <div className="stats">
            <div className="stat">
              <div className="stat-number">450+</div>
              <div className="stat-label">Hackers</div>
            </div>
            <div className="stat">
              <div className="stat-number">36h</div>
              <div className="stat-label">Hacking time</div>
            </div>
            <div className="stat">
              <div className="stat-number">120</div>
              <div className="stat-label">Projects</div>
            </div>
            <div className="stat">
              <div className="stat-number">$30K</div>
              <div className="stat-label">In prizes</div>
            </div>
            <div className="stat">
              <div className="stat-number">40+</div>
              <div className="stat-label">Workshops</div>
            </div>
            <div className="stat">
              <div className="stat-number">25+</div>
              <div className="stat-label">Sponsors</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 4 · Schedule ── */}
      <section id="schedule" className="section section-4">
        <div className="section-inner">
          <span className="eyebrow">Schedule</span>
          <h2>Weekend at a glance</h2>
          <p className="section-lead">
            From check-in to closing ceremonies, every moment is designed to fuel your creativity.
          </p>
          <div className="timeline">
            {[
              { time: 'Fri 6pm',  title: 'Check-in & Opening', desc: 'Pick up your badge, grab dinner, and meet your fellow hackers.' },
              { time: 'Fri 9pm',  title: 'Hacking Begins',      desc: 'The clock starts. Team up, ideate, and start building.' },
              { time: 'Sat 10am', title: 'Morning Workshops',   desc: 'AI/ML, web dev, hardware, design thinking and more.' },
              { time: 'Sat 3pm',  title: 'Sponsor Expo',        desc: 'Meet reps from top tech companies. Snag swag and opportunities.' },
              { time: 'Sat 8pm',  title: 'Midnight Snacks',     desc: 'Keep the energy up with food, games, and mini-challenges.' },
              { time: 'Sun 9am',  title: 'Submissions Due',     desc: 'Final commits, demos recorded. Time to clean up your README.' },
              { time: 'Sun 1pm',  title: 'Demos & Judging',     desc: 'Present your project to judges and the whole WHACK community.' },
              { time: 'Sun 4pm',  title: 'Closing Ceremony',    desc: 'Awards, announcements, and a look ahead to WHACK 2027.' },
            ].map((item) => (
              <div className="timeline-item" key={item.time}>
                <div className="timeline-time">{item.time}</div>
                <div className="timeline-content">
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 5 · Prizes ── */}
      <section id="prizes" className="section section-5">
        <div className="section-inner centered">
          <span className="eyebrow">Prizes</span>
          <h2>Win big. Build bigger.</h2>
          <p className="section-lead">
            Over $30,000 in prizes across general tracks and sponsor challenges.
          </p>
          <div className="prizes">
            <div className="prize-card first">
              <div className="prize-rank">Grand Prize</div>
              <div className="prize-amount">$5,000</div>
              <div className="prize-desc">Best overall hack of the weekend, judged across all tracks.</div>
            </div>
            <div className="prize-card">
              <div className="prize-rank">2nd Place</div>
              <div className="prize-amount">$2,500</div>
              <div className="prize-desc">Runner-up with strong technical execution and presentation.</div>
            </div>
            <div className="prize-card">
              <div className="prize-rank">3rd Place</div>
              <div className="prize-amount">$1,000</div>
              <div className="prize-desc">Third place with outstanding creativity and impact.</div>
            </div>
            <div className="prize-card">
              <div className="prize-rank">Best Beginner</div>
              <div className="prize-amount">$1,000</div>
              <div className="prize-desc">Top project from a first-time hacker team.</div>
            </div>
            <div className="prize-card">
              <div className="prize-rank">Best Design</div>
              <div className="prize-amount">$750</div>
              <div className="prize-desc">Outstanding UX, accessibility, and visual craftsmanship.</div>
            </div>
            <div className="prize-card">
              <div className="prize-rank">Best Social Impact</div>
              <div className="prize-amount">$750</div>
              <div className="prize-desc">Project with the most meaningful real-world impact.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 6 · Sponsors ── */}
      <section id="sponsors" className="section section-6">
        <div className="section-inner centered">
          <span className="eyebrow">Sponsors</span>
          <h2>Backed by the best.</h2>
          <p className="section-lead">
            WHACK is made possible by industry partners who believe in the next
            generation of builders. Interested in sponsoring?{' '}
            <a href="mailto:sponsor@whack.ucsc.edu" style={{ color: 'white' }}>Reach out →</a>
          </p>
          <div className="sponsor-tiers">
            <div className="sponsor-tier-label">Platinum</div>
            <div className="sponsor-row">
              <span className="sponsor-pill lg">Anthropic</span>
              <span className="sponsor-pill lg">GitHub</span>
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
        </div>
      </section>

      {/* ── Section 7 · FAQ ── */}
      <section id="faq" className="section section-7">
        <div className="section-inner">
          <span className="eyebrow">FAQ</span>
          <h2>Got questions?</h2>
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
        <div className="section-inner centered">
          <span className="eyebrow">Join Us</span>
          <h2>Ready to build?</h2>
          <p className="section-lead">
            Applications for WHACK 2026 open August 15. Spots are limited —
            get on the list and be first to know.
          </p>
          <a href="mailto:hello@whack.ucsc.edu" className="btn-white">Apply for WHACK 2026</a>
        </div>
      </section>

      <footer>
        © 2026 WHACK Hackathon · Wellesley College · Made with love and too much coffee
      </footer>
    </>
  )
}

export default App
