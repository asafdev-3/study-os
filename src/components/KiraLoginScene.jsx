import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, m as motion, useSpring } from 'framer-motion'
import blink from '../assets/kira-blink.webp'
import turnClip from '../assets/kira-turn.webp'
import noteClip from '../assets/kira-note.webp'
import eyesClosed from '../assets/kira-private.webp'
import resting from '../assets/kira-rest.webp'

const greetings = [
  'Oi, eu sou a Kira. Vamos estudar?',
  'Chuva lá fora. O que vamos estudar?',
  'Uma dica? Transforme sua dúvida em uma pergunta.',
  'Quando entrar, me chama na aba Kira.',
]
const turnSpring = { stiffness: 170, damping: 25, mass: 0.7 }
const gestures = {
  turn: { src: turnClip, duration: 1800 },
  note: { src: noteClip, duration: 1417 },
}
const bubbleTransition = { duration: 0.22, ease: [0.22, 1, 0.36, 1] }

export default function KiraLoginScene({ reducedMotion, creating, focusedField }) {
  const [line, setLine] = useState(0)
  const speech = line === 0 && creating ? 'Vamos preparar seu espaço de estudo?' : greetings[line]
  const privateField = focusedField === 'password' || focusedField === 'confirmPassword'
  const gaze = privateField ? 'away' : focusedField ? 'form' : 'free'
  const [gesture, setGesture] = useState(null)
  const restore = useRef(null)
  const active = !privateField && !reducedMotion ? gestures[gesture] : null
  const image = privateField ? eyesClosed : reducedMotion ? resting : active?.src || blink
  useEffect(() => () => clearTimeout(restore.current), [gesture, privateField, reducedMotion])
  const turn = useSpring(0, turnSpring)
  const tilt = useSpring(0, turnSpring)
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
    if (reducedMotion) {
      turn.jump(0)
      tilt.jump(0)
    } else if (gaze !== 'free') {
      turn.set(gaze === 'away' ? -15 : 10)
      tilt.set(gaze === 'away' ? -4 : 2)
    } else {
      center()
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
    }
  }, [turn, tilt, reducedMotion, gaze])

  function greet() {
    const next = (line + 1) % greetings.length
    setLine(next)
    if (!reducedMotion) setGesture(next % 2 ? 'turn' : 'note')
  }

  function settleAfterPlayback() {
    clearTimeout(restore.current)
    if (active) restore.current = setTimeout(() => setGesture(null), active.duration)
  }

  return (
    <div className="kira-scene" data-gaze={gaze} data-still={reducedMotion || undefined}>
      <button type="button" className="kira-actor" aria-label="Chamar a Kira" onClick={greet}>
        <span className="kira-stage" aria-hidden="true">
          <span className="kira-orbit" />
          <motion.span className="kira-track" style={{ rotateX: tilt, rotateY: turn }}>
            <img className="kira-frame" src={image} width="312" height="264" alt=""
              draggable="false" onLoad={settleAfterPlayback}
              onError={event => {
                if (event.currentTarget.src !== new URL(resting, document.baseURI).href) event.currentTarget.src = resting
              }} />
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
