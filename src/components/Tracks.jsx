/**
 * Tracks — "Wish upon a Whale" tracks section.
 *
 * Script heading with a CSS galaxy glowing to the right and a star-bulleted
 * list of tracks. Each track expands its blurb on hover/focus.
 */

const TRACKS = [
  {
    name: 'Track 1',
    title: 'Dreamscapes',
    desc: 'Build something whimsical — games, art, and generative worlds.',
  },
  {
    name: 'Track 2',
    title: 'Constellations',
    desc: 'Connect people and data — social tools, maps, and networks.',
  },
  {
    name: 'Track 3',
    title: 'Deep Currents',
    desc: 'Tackle the hard stuff — AI/ML, systems, and infrastructure.',
  },
];

export default function Tracks() {
  return (
    <div className="tracks-stage">
      <ul className="track-list">
        {TRACKS.map((t) => (
          <li className="track-item" key={t.name}>
            <span className="track-star" aria-hidden="true">★</span>
            <span className="track-body">
              <span className="track-name">{t.name}</span>
              <span className="track-title">{t.title}</span>
              <span className="track-desc">{t.desc}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="galaxy" aria-hidden="true">
        <div className="galaxy-core" />
        <div className="galaxy-arm galaxy-arm-a" />
        <div className="galaxy-arm galaxy-arm-b" />
        <div className="galaxy-dust" />
      </div>
    </div>
  );
}
