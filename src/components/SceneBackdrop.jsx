import rain from '../assets/autumn-rain.webp'
import mobileRain from '../assets/autumn-rain-mobile.webp'

export default function SceneBackdrop({ scene }) {
  return <div className="study-scenery" aria-hidden="true" data-room={scene}>
    <picture>
      <source media="(max-width: 760px)" srcSet={mobileRain} />
      <img className="scene-photo" src={rain} alt="" width="1672" height="941" decoding="async" />
    </picture>
    <div className="scene-light" />
  </div>
}
