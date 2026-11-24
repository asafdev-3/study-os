import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, m as motion, useSpring } from 'framer-motion'
import blink from '../assets/kira-blink.webp'
import eyesClosed from '../assets/kira-private.webp'
import resting from '../assets/kira-rest.webp'
import './KiraLoginScene.css'

const greetings = [
  'Oi, eu sou a Kira. Vamos estudar?',
  'Chuva lá fora. Foco aqui dentro.',
  'Qual assunto quer entender hoje?',
  'Um passo de cada vez. Por onde começamos?',
  'Quer revisar uma matéria?',
  'Uma pergunta bem feita muda o estudo.',
  'O ENEM fica mais simples com prática.',
  'Quando entrar, me chama na aba Kira.',
]

const faceSpring = { stiffness: 220, damping: 28, mass: 0.7 }
const bubbleTransition = { duration: 0.2, ease: [0.22, 1, 0.36, 1] }
const eyeTransition = { duration: 0.24, ease: [0.22, 1, 0.36, 1] }
const idleTransition = { duration: 5.5, ease: 'easeInOut', repeat: Infinity }

export default function KiraLoginScene({ reducedMotion, creating, focusedField }) {
  const [line, setLine] = useState(0)
  const speech = line === 0 && creating ? 'Vamos preparar seu espaço de estudo?' : greetings[line]
  const privateField = focusedField === 'password' || focusedField === 'confirmPassword'
  const gaze = privateField ? 'away' : focusedField ? 'form' : 'free'
  const tapTimer = useRef(null)
  const yaw = useSpring(0, faceSpring)
  const pitch = useSpring(0, faceSpring)
  const lift = useSpring(0, faceSpring)

  // Never swap resting/turning animation sources on tap: the clips have
  // different framing and transparency, producing a visible "jump".
  // Keep the blink animation mounted and spring-animate one stable character.
  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
    const reset = () => {
      yaw.set(0)
      pitch.set(0)
      lift.set(0)
    }
    const follow = event => {
      if (event.pointerType !== 'mouse' || !fine.matches) return
      yaw.set((2 * event.clientX / window.innerWidth - 1) * 6)
      pitch.set((1 - 2 * event.clientY / window.innerHeight) * 3)
    }

    clearTimeout(tapTimer.current)
    if (reducedMotion) {
      yaw.jump(0)
      pitch.jump(0)
      lift.jump(0)
    } else if (gaze === 'away') {
      yaw.set(-7)
      pitch.set(1)
      lift.set(0)
    } else if (gaze === 'form') {
      yaw.set(3)
      pitch.set(1)
      lift.set(0)
    } else {
      reset()
      if (fine.matches) window.addEventListener('pointermove', follow, { passive: true })
      window.addEventListener('blur', reset)
      fine.addEventListener('change', reset)
    }

    return () => {
      window.removeEventListener('pointermove', follow)
      window.removeEventListener('blur', reset)
      fine.removeEventListener('change', reset)
      clearTimeout(tapTimer.current)
    }
  }, [gaze, reducedMotion, yaw, pitch, lift])

  function greet() {
    setLine(previous => (previous + 1) % greetings.length)
    if (reducedMotion || gaze !== 'free') return
    clearTimeout(tapTimer.current)
    // Small, physically damped gesture on touch and desktop. One stable asset.
    yaw.set(line % 2 ? -6 : 6)
    pitch.set(-2)
    lift.set(-3)
    tapTimer.current = setTimeout(() => {
      yaw.set(0)
      pitch.set(0)
      lift.set(0)
    }, 460)
  }

  return (
    <div className="kira-scene" data-gaze={gaze} data-still={reducedMotion || undefined}>
      <button type="button" className="kira-actor" aria-label="Chamar a Kira" onClick={greet}>
        <span className="kira-stage" aria-hidden="true">
          <motion.span className="kira-track" style={{ rotateX: pitch, rotateY: yaw, y: lift }}>
            <motion.span
              className="kira-breath"
              animate={reducedMotion ? { y: 0 } : { y: [0, -2, 0] }}
              transition={reducedMotion ? { duration: 0 } : idleTransition}
            >
              <span className="kira-image-stack">
                <img className="kira-frame" src={reducedMotion ? resting : blink}
                  width="294" height="248" alt="" draggable="false"
                  onError={event => {
                    if (event.currentTarget.src !== new URL(resting, document.baseURI).href) event.currentTarget.src = resting
                  }} />
                <motion.img className="kira-frame kira-frame--private"
                  src={eyesClosed} width="294" height="248" alt="" draggable="false"
                  initial={false}
                  animate={{ opacity: privateField ? 1 : 0 }}
                  transition={reducedMotion ? { duration: 0 } : eyeTransition}
                />
              </span>
            </motion.span>
          </motion.span>
        </span>
        <span className="kira-bubble" aria-hidden="true">
          <span className="kira-speaker">Kira</span>
          <span className="kira-speech">
            <span className="kira-speech-size">{greetings[3]}</span>
            <AnimatePresence initial={false} mode="sync">
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
