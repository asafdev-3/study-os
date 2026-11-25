import { useEffect, useState } from 'react'
import kira from '../assets/kira-studyos.webp'

/** Personagem original com ciclo de piscada natural e respiração suave (GPU transform only). */
export function KiraAvatar({ size = 64, hero = false }) {
  const [blinking, setBlinking] = useState(false)

  useEffect(() => {
    let blinkTimeout = null
    let doubleBlinkTimeout = null

    const triggerBlink = () => {
      setBlinking(true)
      blinkTimeout = window.setTimeout(() => {
        setBlinking(false)
        // 30% de chance de dar uma piscada dupla natural
        if (Math.random() < 0.3) {
          doubleBlinkTimeout = window.setTimeout(() => {
            setBlinking(true)
            blinkTimeout = window.setTimeout(() => setBlinking(false), 115)
          }, 140)
        }
      }, 125)
    }

    const interval = window.setInterval(triggerBlink, hero ? 3400 : 4800)
    const initial = window.setTimeout(triggerBlink, 900)

    return () => {
      window.clearInterval(interval)
      window.clearTimeout(initial)
      if (blinkTimeout) window.clearTimeout(blinkTimeout)
      if (doubleBlinkTimeout) window.clearTimeout(doubleBlinkTimeout)
    }
  }, [hero])

  return (
    <span
      className={'study-kira-character' + (hero ? ' study-kira-character--hero' : '')}
      style={{
        '--kira-size': `${size}px`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        transform: blinking ? 'scaleY(0.86) scaleX(1.03)' : 'scaleY(1) scaleX(1)',
        transition: 'transform 110ms cubic-bezier(.32, .72, 0, 1)',
        willChange: 'transform',
      }}
      aria-hidden="true"
    >
      <img
        src={kira}
        alt=""
        width="420"
        height="280"
        decoding="async"
        draggable="false"
        style={{
          filter: blinking ? 'brightness(0.88)' : 'brightness(1.03)',
          transition: 'filter 110ms ease',
        }}
      />
    </span>
  )
}