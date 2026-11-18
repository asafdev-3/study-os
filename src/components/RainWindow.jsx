import { useRef } from 'react'
import WetGlass from './WetGlass'
import autumnNight from '../assets/autumn-rain.webp'
import autumnNightMobile from '../assets/autumn-rain-mobile.webp'
import './RainWindow.css'

// A handful of heavier drops loosen and slide between the stationary beads.
const runners = [
  [8, 17, 5], [20, 54, 7], [41, 8, 4], [64, 69, 6], [83, 22, 7], [94, 60, 5],
]

export default function RainWindow({ still }) {
  const photoRef = useRef(null)
  return (
    <div className="rain-window" aria-hidden="true" data-still={still || undefined}>
      <picture>
        <source media="(max-width: 760px)" srcSet={autumnNightMobile} />
        <img ref={photoRef} src={autumnNight} alt="" width="1672" height="941" fetchPriority="high" />
      </picture>
      <div className="rain-wind">
        <span className="rain-sheet rain-far" />
        <span className="rain-sheet rain-near" />
      </div>
      <WetGlass photoRef={photoRef} />
      {runners.map(([x, y, size], index) => (
        <i key={x} className="rain-runner" style={{
          left: x + '%', top: y + '%', width: size, height: size * 1.42,
          animationDelay: -index * 1.79 + 's', animationDuration: (17 + index % 5) + 's',
        }} />
      ))}
    </div>
  )
}
