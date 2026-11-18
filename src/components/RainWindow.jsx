import autumnNight from '../assets/autumn-rain.webp'
import autumnNightMobile from '../assets/autumn-rain-mobile.webp'
import './RainWindow.css'

// Percentages position the beads on the pane; larger drops occasionally slide.
const beads = [
  [6, 17, 7], [10, 47, 3], [17, 32, 11], [29, 8, 5], [37, 78, 6],
  [44, 20, 4], [54, 58, 9], [62, 14, 6], [68, 84, 4], [76, 33, 7],
  [82, 67, 12], [88, 12, 5], [92, 40, 8], [96, 73, 4], [24, 90, 8],
]

export default function RainWindow({ still }) {
  return (
    <div className="rain-window" aria-hidden="true" data-still={still || undefined}>
      <picture>
        <source media="(max-width: 760px)" srcSet={autumnNightMobile} />
        <img src={autumnNight} alt="" width="1672" height="941" fetchPriority="high" />
      </picture>
      <div className="rain-wind">
        <span className="rain-sheet rain-far" />
        <span className="rain-sheet rain-near" />
      </div>
      {beads.map(([x, y, size], index) => (
        <i key={x} className={size >= 8 ? 'rain-bead rain-runner' : 'rain-bead'} style={{
          left: x + '%', top: y + '%', width: size, height: size * 1.42,
          animationDelay: -index * 1.79 + 's', animationDuration: (17 + index % 5) + 's',
        }} />
      ))}
    </div>
  )
}
