import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, m as motion, useSpring, useTransform } from 'framer-motion'
import kira from '../assets/kira-login.webp'

const greetings = [
  'Oi, eu sou a Kira. Vamos estudar?',
  'Por onde você quer começar hoje?',
  'Uma dica? Transforme sua dúvida em uma pergunta.',
  'Quando entrar, me chama na aba Kira.',
]
const turnSpring = { stiffness: 170, damping: 25, mass: 0.7 }
const nodSpring = { stiffness: 280, damping: 18, mass: 0.55 }
const bubbleTransition = { duration: 0.22, ease: [0.22, 1, 0.36, 1] }

export default function KiraLoginScene({ reducedMotion, creating }) {
  const [line, setLine] = useState(0)
  const speech = line === 0 && creating ? 'Vamos preparar seu espaço de estudo?' : greetings[line]
  const release = useRef(null)
  const turn = useSpring(0, turnSpring)
  const tilt = useSpring(0, turnSpring)
  const lift = useSpring(0, nodSpring)
  const nod = useTransform(lift, [0, 1], [0, -8])
  const lean = useTransform(lift, [0, 1], [0, -3])

  useEffect(() => {
    const mouse = window.matchMedia('(hover: hover) and (pointer: fine)')
    function center() {
      turn.set(0)
      tilt.set(0)
    }
    function follow(event) {
      if (event.pointerType !== 'mouse' || !mouse.matches) return
      turn.set((2 * event.clientX / window.innerWidth - 1) * 13)
      tilt.set((1 - 2 * event.clientY / window.innerHeight) * 6)
    }
    if (!reducedMotion) {
      window.addEventListener('pointermove', follow, { passive: true })
      window.addEventListener('blur', center)
      document.documentElement.addEventListener('pointerleave', center)
      mouse.addEventListener('change', center)
    }
    return () => {
      window.removeEventListener('pointermove', follow)
      window.removeEventListener('blur', center)
      document.documentElement.removeEventListener('pointerleave', center)
      mouse.removeEventListener('change', center)
      clearTimeout(release.current)
      turn.jump(0)
      tilt.jump(0)
      lift.jump(0)
    }
  }, [turn, tilt, lift, reducedMotion])

  function greet() {
    setLine(previous => (previous + 1) % greetings.length)
    if (reducedMotion) return
    clearTimeout(release.current)
    lift.set(1)
    release.current = setTimeout(() => lift.set(0), 155)
  }

  return (
    <div className="kira-scene" data-still={reducedMotion || undefined}>
      <button type="button" className="kira-actor" aria-label="Chamar a Kira" onClick={greet}>
        <span className="kira-stage" aria-hidden="true">
          <span className="kira-orbit" />
          <motion.span className="kira-track" style={{ rotateX: tilt, rotateY: turn }}>
            <motion.span className="kira-figure" style={{ y: nod, rotate: lean }}>
              <span className="kira-face">
                <img src={kira} alt="" width="360" height="240" draggable="false" />
                <span className="kira-eye kira-eye-left" />
                <span className="kira-eye kira-eye-right" />
              </span>
            </motion.span>
          </motion.span>
        </span>
        <span className="kira-bubble" aria-hidden="true">
          <span className="kira-speaker">Kira</span>
          <span className="kira-speech">
            <span className="kira-speech-size">{greetings[2]}</span>
            <AnimatePresence initial={false}>
              <motion.span key={speech}
                initial={reducedMotion ? false : { opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reducedMotion ? 0 : -2 }}
                transition={reducedMotion ? { duration: 0 } : bubbleTransition}
              >{speech}</motion.span>
            </AnimatePresence>
          </span>
        </span>
      </button>
      <span className="sr-only" role="status">{speech}</span>
    </div>
  )
}
