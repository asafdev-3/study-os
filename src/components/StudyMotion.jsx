import { useEffect } from 'react'
import { m as motion, MotionConfig, LazyMotion } from 'framer-motion'
import { softTransition, useStudyReducedMotion } from '../lib/motion'

const loadFeatures = () => import('../lib/motionFeatures').then(module => module.default)

export function StudyMotion({ children }) {
  const reduced = useStudyReducedMotion()
  useEffect(() => { document.documentElement.dataset.studyMotion = reduced ? 'reduced' : 'system' }, [reduced])
  return <LazyMotion features={loadFeatures}><MotionConfig reducedMotion={reduced ? 'always' : 'never'} transition={reduced ? { duration: 0 } : softTransition}>{children}</MotionConfig></LazyMotion>
}
export function PageMotion({ children }) {
  const reduced = useStudyReducedMotion()
  return <motion.div className="study-page-enter" initial={reduced ? false : { opacity: .88 }}
    animate={{ opacity: 1 }} transition={reduced ? { duration: 0 } : softTransition}>{children}</motion.div>
}
