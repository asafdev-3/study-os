import { useEffect } from 'react'
import { m as motion, MotionConfig, LazyMotion } from 'framer-motion'
import { pageSpring, softTransition, useStudyReducedMotion } from '../lib/motion'
import { readPreferences } from '../lib/preferences'
import { installFoldBlur } from '../lib/foldBlur'

const loadFeatures = () => import('../lib/motionFeatures').then(module => module.default)
const isAndroid = () => document.documentElement.classList.contains('is-android')

/** Provider raiz — wrap em App.jsx. Define spring como padrão global (desativado no Android). */
export function StudyMotion({ children }) {
  const systemReduced = useStudyReducedMotion()
  const android = isAndroid()
  const reduced = systemReduced || android

  useEffect(() => {
    if (android) return
    return installFoldBlur()
  }, [android])

  useEffect(() => {
    document.documentElement.dataset.studyMotion = reduced ? 'reduced' : 'system'
    const opacity = Number(readPreferences().glassOpacity)
    document.documentElement.style.setProperty('--ios27-glass-alpha', String(Number.isFinite(opacity) ? Math.max(.42, Math.min(.92, opacity)) : .67))
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
- Stable content layer. Page transitions are owned by the route shell,
- never by each new page/header (those overlapping animations caused flashes).
 */
export function PageMotion({ children }) {
  return <div className="study-page-enter">{children}</div>
}

/**
- Variante atmosférica — só opacity, sem posição.
- Usar em conteúdo que não deve "subir" (ex: fundo, imagem de sala).
 */
export function FadeMotion({ children, delay = 0 }) {
  const systemReduced = useStudyReducedMotion()
  const reduced = systemReduced || isAndroid()
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