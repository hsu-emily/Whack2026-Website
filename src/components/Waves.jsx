import { Fragment, useState } from 'react'
import Layer1 from '../assets/wave/Layer1.png'
import Layer2 from '../assets/wave/Layer2.png'
import Layer3 from '../assets/wave/Layer3.png'
import Layer4 from '../assets/wave/Layer4.png'
import Layer4_1 from '../assets/wave/Layer4.1.png'
import Layer5 from '../assets/wave/Layer5.png'
import Layer5_1 from '../assets/wave/Layer5.1.png'
import Layer6 from '../assets/wave/Layer6.png'
import Layer6_1 from '../assets/wave/Layer6.1.png'
import Layer7 from '../assets/wave/Layer7.png'
import Layer7_1 from '../assets/wave/Layer7.1.png'
import Layer8 from '../assets/wave/Layer8.png'
import Layer8_1 from '../assets/wave/Layer8.1.png'

// Stacked bottom → top so each later layer paints over the one before it.
// A ".1" file is a companion detail for its numbered layer (e.g. Layer4.1
// goes with Layer4) and always animates together with it.
const LAYER_GROUPS = [
  { main: Layer1 },
  { main: Layer2 },
  { main: Layer3 },
  { main: Layer4, extra: Layer4_1 },
  { main: Layer5, extra: Layer5_1 },
  { main: Layer6, extra: Layer6_1 },
  { main: Layer7, extra: Layer7_1 },
  { main: Layer8, extra: Layer8_1 },
]

function Waves({ items = [], heading, children }) {
  const [openIndex, setOpenIndex] = useState(null)

  // Questions are linked to layers in reverse: question 1 → the last layer
  // (Layer8), question 2 → the second-to-last, and so on, leaving Layer1 as
  // the permanent base. Opening a question slides its layer away along with
  // every layer above it; layers below stay put.
  const activeTiedLayerIndex = openIndex === null ? null : LAYER_GROUPS.length - 1 - openIndex

  return (
    <div className="waves-faq">
      <div className="waves-art" aria-hidden="true">
        {LAYER_GROUPS.map((layer, i) => {
          const isHidden = activeTiedLayerIndex !== null && i >= activeTiedLayerIndex
          const wrapClassName = `waves-art-layer-wrap${isHidden ? ' is-hidden' : ''}`
          // Layer1 is the seabed floor and stays still; every other layer sways.
          const isStill = i === 0
          // Stagger each layer's sway so they don't all crash in sync.
          const mainStyle = isStill
            ? { animation: 'none' }
            : { animationDelay: `${-(i * 0.7)}s`, animationDuration: `${8 + (i % 4)}s` }
          const extraStyle = { animationDelay: `${-(i * 0.7 + 0.35)}s`, animationDuration: `${8 + (i % 4)}s` }
          return (
            <Fragment key={i}>
              <div className={wrapClassName}>
                <img src={layer.main} alt="" className="waves-art-layer" style={mainStyle} />
              </div>
              {layer.extra && (
                <div className={wrapClassName}>
                  <img src={layer.extra} alt="" className="waves-art-layer" style={extraStyle} />
                </div>
              )}
            </Fragment>
          )
        })}
      </div>

      <div className="waves-scrim" aria-hidden="true" />

      <div className="waves-list">
        {heading && <h1>{heading}</h1>}
        {children}
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
