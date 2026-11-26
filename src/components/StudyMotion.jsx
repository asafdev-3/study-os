import { useEffect } from 'react'
import { m as motion, MotionConfig, LazyMotion, domMax } from 'framer-motion'
import { pageSpring, softTransition, useStudyReducedMotion } from '../lib/motion'
import { useLocation } from 'react-router-dom'
import { readPreferences } from '../lib/preferences'

const isAndroid = () => document.documentElement.classList.contains('is-android')

export function StudyMotion({ children }) {
  const systemReduced = useStudyReducedMotion()
  const reduced = systemReduced

  useEffect(() => {
    const syncPrefs = () => {
      document.documentElement.dataset.studyMotion = reduced ? 'reduced' : 'system'
      const opacity = Number(readPreferences().glassOpacity)
      const alpha = Number.isFinite(opacity) ? Math.max(.42, Math.min(.92, opacity)) : .64
      document.documentElement.style.setProperty('--ios27-glass-alpha', String(alpha))
    }
    syncPrefs()
    window.addEventListener('studyos:preferences', syncPrefs)
    return () => window.removeEventListener('studyos:preferences', syncPrefs)
  }, [reduced])

  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig
        reducedMotion={reduced ? 'always' : 'never'}
        transition={reduced ? { duration: 0 } : pageSpring}
      >
        {children}
      </MotionConfig>
    </LazyMotion>
  )
}

export function PageMotion({ children }) {
  const { pathname } = useLocation()
  const reduced = useStudyReducedMotion()
  return (
    <motion.div key={pathname} className="study-page-enter"
      initial={reduced ? false : { opacity: .86 }}
      animate={{ opacity: 1 }}
      transition={reduced ? { duration: 0 } : softTransition}>
      {children}
    </motion.div>
  )
}

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