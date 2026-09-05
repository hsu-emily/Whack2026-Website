import { useState } from 'react'
import Layer1 from '../assets/wave/Layer1.png'
import Layer2 from '../assets/wave/Layer2.png'
import Layer3 from '../assets/wave/Layer3.png'
import Layer4 from '../assets/wave/Layer4.png'
import Layer5 from '../assets/wave/Layer5.png'
import Layer6 from '../assets/wave/Layer6.png'
import Layer7 from '../assets/wave/Layer7.png'

// Stacked bottom → top so each later layer paints over the one before it.
const LAYERS = [Layer1, Layer2, Layer3, Layer4, Layer5, Layer6, Layer7]

function Waves({ items = [] }) {
  const [openIndex, setOpenIndex] = useState(null)

  return (
    <div className="waves-faq">
      <div className="waves-art" aria-hidden="true">
        {LAYERS.map((src, i) => (
          <img key={i} src={src} alt="" className="waves-art-layer" />
        ))}
      </div>

      <div className="waves-scrim" aria-hidden="true" />

      <div className="waves-list">
        {items.map((item, i) => {
          const isOpen = openIndex === i
          return (
            <div key={i} className={`wave-q-row${isOpen ? ' is-open' : ''}`}>
              <button
                type="button"
                className="wave-q-btn"
                aria-expanded={isOpen}
                onClick={() => setOpenIndex(isOpen ? null : i)}
              >
                <span className="wave-q">{item.q}</span>
              </button>
              <div className="wave-answer-wrap">
                <div className="wave-answer-inner">
                  <p className="wave-a">{item.a}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Waves
