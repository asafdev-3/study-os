import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { m, useSpring, useTransform } from 'framer-motion'
import { ProgressiveBlur } from './ProgressiveBlur'
import { useStudyReducedMotion } from '../lib/motion'

function Fold() {
  const [finished, setFinished] = useState(false)
  const angle = useSpring(50, { stiffness: 260, damping: 28 })
  const opposite = useTransform(angle, value => -value)
  const opacity = useTransform(angle, [0, 50], [0, 0.55])
  useEffect(() => {
    const unsubscribe = angle.on("animationComplete", () => setFinished(true))
    const frame = requestAnimationFrame(() => angle.set(0))
    return () => { cancelAnimationFrame(frame); unsubscribe() }
  }, [angle])

  if (finished) return null
  return createPortal(<div className="study-fold" aria-hidden="true">
    <m.div className="study-fold-half study-fold-top" style={{ rotateX: angle, opacity }} />
    <m.div className="study-fold-half study-fold-bottom" style={{ rotateX: opposite, opacity }} />
    <ProgressiveBlur angle={angle} />
  </div>, document.body)
}

export function FoldableTransition({ screen }) {
  const reduced = useStudyReducedMotion()
  return reduced ? null : <Fold key={screen} />
}
