import { useEffect } from 'react'
import { m as motion, MotionConfig, LazyMotion } from 'framer-motion'
import { pageSpring, softTransition, useStudyReducedMotion } from '../lib/motion'

const loadFeatures = () => import('../lib/motionFeatures').then(module => module.default)

/** Provider raiz — wrap em App.jsx. Define spring como padrão global. */
export function StudyMotion({ children }) {
  const reduced = useStudyReducedMotion()
  useEffect(() => {
    document.documentElement.dataset.studyMotion = reduced ? 'reduced' : 'system'
  }, [reduced])
  return (
    <LazyMotion features={loadFeatures}>
      <MotionConfig
        reducedMotion={reduced ? 'always' : 'never'}
        transition={reduced ? { duration: 0 } : pageSpring}
      >
        {children}
      </MotionConfig>
    </LazyMotion>
  )
}

/**
 * Wrapper de página — spring de entrada com y:10→0 + opacity:0.9→1.
 * Apenas transform + opacity: zero layout recalc, composited pelo GPU.
 * 120Hz ProMotion sente a física da spring em cada frame.
 */
export function PageMotion({ children }) {
  const reduced = useStudyReducedMotion()
  return (
    <motion.div
      className="study-page-enter"
      initial={reduced ? false : { opacity: 0.9, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduced ? { duration: 0 } : pageSpring}
      style={{ willChange: 'transform, opacity' }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Variante atmosférica — só opacity, sem posição.
 * Usar em conteúdo que não deve "subir" (ex: fundo, imagem de sala).
 */
export function FadeMotion({ children, delay = 0 }) {
  const reduced = useStudyReducedMotion()
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={reduced ? { duration: 0 } : { ...softTransition, delay }}
    >
      {children}
    </motion.div>
  )
}
