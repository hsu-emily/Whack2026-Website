import { useEffect, useRef, useState } from 'react';
import Hourglass from './Hourglass';

/**
 * Schedule — "Wish upon a Whale" schedule section.
 *
 * A glowing 3D hourglass anchors the center; "day 1" and its itinerary sit
 * to the left, "day 2" and its itinerary to the right. Scrolling pours the
 * water from the top bulb into the bottom.
 */

const DAYS = {
  1: {
    label: 'day 1',
    date: 'Nov 10, 2026',
    events: [
      { time: '4:00 PM', title: 'Check-in & Badges', desc: 'Arrive, grab your lanyard, and settle in.' },
      { time: '6:00 PM', title: 'Opening Ceremony', desc: 'Kickoff, sponsor intros, and the theme reveal.' },
      { time: '7:30 PM', title: 'Team Formation', desc: 'Find your crew or fly solo — mentors on hand.' },
      { time: '9:00 PM', title: 'Hacking Begins', desc: 'The clock starts. Wish upon a whale and build.' },
      { time: '11:00 PM', title: 'Midnight Snacks', desc: 'Late-night fuel and a cozy mini-game break.' },
    ],
  },
  2: {
    label: 'day 2',
    date: 'Nov 12, 2026',
    events: [
      { time: '9:00 AM', title: 'Morning Workshops', desc: 'AI/ML, design, and hardware deep-dives.' },
      { time: '12:00 PM', title: 'Sponsor Expo', desc: 'Meet the teams behind the tools you love.' },
      { time: '3:00 PM', title: 'Submissions Due', desc: 'Final commits in. Polish that README.' },
      { time: '4:30 PM', title: 'Demos & Judging', desc: 'Show the whole harbor what you made.' },
      { time: '6:00 PM', title: 'Closing Ceremony', desc: 'Awards, wishes granted, and goodbyes.' },
    ],
  },
};

function DayColumn({ side, day, hiddenWhenCompact }) {
  return (
    <div className={`day-col day-col-${side}${hiddenWhenCompact ? ' compact-hidden' : ''}`}>
      <div className="day-col-head">
        <span className="day-col-label">{day.label}</span>
        <span className="day-col-date">{day.date}</span>
      </div>
      <ul className="day-col-events">
        {day.events.map((e) => (
          <li className="day-col-event" key={e.time}>
            <span className="day-col-time">{e.time}</span>
            <span className="day-col-body">
              <span className="day-col-title">{e.title}</span>
              <span className="day-col-desc">{e.desc}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Schedule() {
  const [pour, setPour] = useState(0);
  // Small screens collapse the flanking itineraries into a day toggle below
  // the glass; `day` picks which itinerary shows there. On wide screens both
  // columns render and the toggle is hidden, so this state has no effect.
  const [day, setDay] = useState(1);
  const stageRef = useRef(null);

  // Scroll-driven pour: as the hourglass travels up through the viewport,
  // water drips from the top bulb into the bottom. 0 = just entered view,
  // 1 = fully poured (shortly before it scrolls out the top).
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = stageRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const raw = (vh - rect.top) / (vh + rect.height);
      setPour(Math.min(1, Math.max(0, (raw - 0.12) * 1.9)));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div className="schedule-stage" ref={stageRef}>
      <DayColumn side="left" day={DAYS[1]} hiddenWhenCompact={day !== 1} />

      <div className="hourglass-frame">
        <Hourglass
          progress={pour}
          style={{ pointerEvents: 'none' }}
        />
      </div>

      {/* only visible on small screens, below the glass */}
      <div className="day-toggle" role="tablist" aria-label="Schedule day">
        {[1, 2].map((n) => (
          <button
            key={n}
            role="tab"
            aria-selected={day === n}
            className={`day-toggle-btn ${day === n ? 'is-active' : ''}`}
            onClick={() => setDay(n)}
          >
            {DAYS[n].label}
          </button>
        ))}
      </div>

      <DayColumn side="right" day={DAYS[2]} hiddenWhenCompact={day !== 2} />
    </div>
  );
}
