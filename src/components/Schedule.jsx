import { useEffect, useRef, useState } from 'react';
import Hourglass from './Hourglass';

/**
 * Schedule — "Wish upon a Whale" schedule section.
 *
 * A glowing 3D hourglass anchors the section; script heading above,
 * "day 1" / "day 2" flanking the glass. Selecting a day flows its events
 * into the panel below and fills the hourglass to reflect where that day
 * sits in the weekend.
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

export default function Schedule() {
  const [day, setDay] = useState(1);
  const [pour, setPour] = useState(0);
  const stageRef = useRef(null);
  const active = DAYS[day];

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
    <>
      <div className="schedule-stage" ref={stageRef}>
        <button
          className={`day-tab day-tab-left ${day === 1 ? 'is-active' : ''}`}
          onClick={() => setDay(1)}
        >
          day 1
        </button>

        <div className="hourglass-frame">
          <Hourglass
            progress={pour}
            style={{ pointerEvents: 'none' }}
          />
        </div>

        <button
          className={`day-tab day-tab-right ${day === 2 ? 'is-active' : ''}`}
          onClick={() => setDay(2)}
        >
          day 2
        </button>
      </div>

      <div className="day-panel" key={day}>
        <div className="day-panel-head">
          <span className="day-panel-label">{active.label}</span>
          <span className="day-panel-date">{active.date}</span>
        </div>
        <ul className="day-events">
          {active.events.map((e) => (
            <li className="day-event" key={e.time}>
              <span className="day-event-time">{e.time}</span>
              <span className="day-event-body">
                <span className="day-event-title">{e.title}</span>
                <span className="day-event-desc">{e.desc}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
