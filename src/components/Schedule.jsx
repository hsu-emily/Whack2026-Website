import { useEffect, useRef, useState } from 'react';
import Hourglass from './Hourglass';
import Cloud from './Cloud';

/**
 * Schedule — "Wish upon a Whale" schedule section.
 *
 * A glowing 3D hourglass anchors the center; "day 1" and its itinerary sit
 * to the left, "day 2" and its itinerary to the right. Scrolling pours the
 * water from the top bulb into the bottom.
 */

const DAYS = {
  1: {
    label: 'Day 1',
    date: 'Nov 21, 2026',
    events: [
      { time: '9:30 AM - 11:00 AM', title: 'Check-in'},
      //{ time: '10:00 AM - 11:00 AM', title: 'Breakfast'},
      { time: '11:00 AM - 12:00 PM', title: 'Opening Ceremony'},
      { time: '12:00 PM - 12:30 PM', title: 'Team Formation'},
      { time: '12:00 PM', title: 'Hack Starts'},
      { time: '1:00 PM - 2:30 PM', title: 'Lunch'},
      { time: '2:15 PM - 3:00 PM', title: 'Workshop: Testing AI (LW 413)'},
      { time: '3:00 PM - 3:45 PM', title: 'Workshop: Adaption (LW 413)'},
      { time: '3:15 PM - 4:15 PM', title: 'Workshop: MLH Google AI (LW 210)'},
      { time: '6:00 PM - 8:00 PM', title: 'Dinner'},
      { time: '8:30 PM - 9:30 PM', title: 'Game Night Hack Break'},
    ],
  },
  2: {
    label: 'Day 2',
    date: 'Nov 22, 2026',
    events: [
      { time: '9:30 AM - 10:15 AM', title: 'Workshop: From Hack to Real Product (LW 413)'},
      { time: '12:00 PM', title: 'Hack Ends'},
      { time: '12:00 PM - 2:00 PM', title: 'Brunch'},
      { time: '12:30 PM - 3:00 PM', title: 'Judging'},
      { time: '3:00 PM - 3:30 PM', title: 'Judge Deliberations'},
      { time: '3:30 PM - 4:30 PM', title: 'Closing Ceremony'},
      
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
          <li className="day-col-event" key={e.time + e.title}>
            <span className="day-col-time">{e.time.replace(/\s*-\s*/, ' – ')}</span>
            <span className="day-col-body">
              <span className="day-col-title">{e.title}</span>
              {e.desc && <span className="day-col-desc">{e.desc}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Schedule() {
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
      const pour = Math.min(1, Math.max(0, (raw - 0.12) * 1.9));
      const glow = (0.75 + pour * 0.25).toFixed(3);
      if (el.style.getPropertyValue('--hourglass-glow') !== glow) {
        el.style.setProperty('--hourglass-glow', glow);
      }
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

  // Desktop only: slide the hourglass sideways so it sits exactly midway
  // between the end of day 1's schedule and the start of day 2's, without
  // moving either schedule. Re-measured whenever anything changes size.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const desktop = window.matchMedia('(min-width: 1151px)');
    const frame = stage.querySelector('.hourglass-frame');
    const left = stage.querySelector('.day-col-left');
    const right = stage.querySelector('.day-col-right');
    let raf = 0;
    const measure = () => {
      raf = 0;
      if (!desktop.matches) { frame.style.removeProperty('--hg-shift'); return; }
      const current = parseFloat(frame.style.getPropertyValue('--hg-shift')) || 0;
      const f = frame.getBoundingClientRect();
      const frameCenter = f.left + f.width / 2 - current; // un-shifted position
      const midpoint = (left.getBoundingClientRect().right + right.getBoundingClientRect().left) / 2;
      frame.style.setProperty('--hg-shift', `${(midpoint - frameCenter).toFixed(1)}px`);
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(measure); };
    const ro = new ResizeObserver(schedule);
    [stage, left, right].forEach((el) => ro.observe(el));
    desktop.addEventListener('change', schedule);
    document.fonts?.ready.then(schedule);
    schedule();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      desktop.removeEventListener('change', schedule);
    };
  }, []);

  return (
    <div className="schedule-stage" ref={stageRef}>
      <DayColumn side="left" day={DAYS[1]} hiddenWhenCompact={day !== 1} />

      <div className="hourglass-frame">
        <Hourglass
          style={{ pointerEvents: 'none' }}
        />
        <div className="schedule-art-clouds" aria-hidden="true">
          <Cloud src="cloud-wisp.png" width="64%" className="schedule-art-wisp" />
          <Cloud src="cloud-side.png" width="82%" flip className="schedule-art-left" />
          <Cloud src="cloud-side.png" width="82%" className="schedule-art-right" />
        </div>
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
