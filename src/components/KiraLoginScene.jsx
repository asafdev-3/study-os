import { useEffect, useRef, useState } from 'react'
import kira from '../assets/kira-login.webp'

const lines = [
  'Chamar a Kira',
  'Oi. Vamos estudar juntos?',
  'Quer uma dica? Comece por uma pergunta.',
  'Te encontro no seu caderno.',
]

export default function KiraLoginScene({ reducedMotion }) {
  const avatar = useRef(null)
  const figure = useRef(null)
  const reaction = useRef(null)
  const [line, setLine] = useState(0)

  useEffect(() => {
    const el = avatar.current
    const mouse = window.matchMedia('(hover: hover) and (pointer: fine)')
    const reset = () => el.style.removeProperty('transform')
    function follow(event) {
      if (event.pointerType !== 'mouse' || !mouse.matches) return
      const x = 2 * event.clientX / window.innerWidth - 1
      const y = 2 * event.clientY / window.innerHeight - 1
      el.style.transform = `perspective(650px) translate(${10*x}px, ${6*y}px) rotateY(${14*x}deg) rotateX(${-7*y}deg)`
    }
    if (!reducedMotion) {
      window.addEventListener('pointermove', follow, { passive: true })
      document.documentElement.addEventListener('pointerleave', reset)
      window.addEventListener('blur', reset)
      mouse.addEventListener('change', reset)
    }
    return () => {
      window.removeEventListener('pointermove', follow)
      document.documentElement.removeEventListener('pointerleave', reset)
      window.removeEventListener('blur', reset)
      mouse.removeEventListener('change', reset)
      reaction.current?.cancel()
      reset()
    }
  }, [reducedMotion])

  function greet() {
    setLine(previous => previous % (lines.length - 1) + 1)
    if (reducedMotion || !figure.current?.animate) return
    reaction.current?.cancel()
    reaction.current = figure.current.animate([
      { transform: 'none' },
      { transform: 'translateY(-12px) rotate(-5deg)', offset: 0.34 },
      { transform: 'translateY(1px) rotate(2deg)', offset: 0.75 },
      { transform: 'none' },
    ], { duration: 520, easing: 'ease-in-out' })
  }

  return (
    <div className="kira-scene">
      <button type="button" className="kira-actor" aria-label="Chamar a Kira" onClick={greet}>
        <span className="kira-orbit" aria-hidden="true" />
        <span className="kira-track" ref={avatar}>
          <img src={kira} alt="" width="360" height="240" draggable="false" ref={figure} />
        </span>
        <span className="kira-caption" aria-hidden="true">{lines[line]}</span>
      </button>
      <span className="sr-only" role="status">{line > 0 && lines[line]}</span>
    </div>
  )
}
