import { useCallback, useRef } from 'react'
import { useSpring, useMotionValueEvent } from 'framer-motion'
import { useStudyReducedMotion } from './motion'

// Only two viewport values animate; no React render or per-message layout animation.
export function useViewportSpring(elementRef, prefix) {
  const reduced = useStudyReducedMotion()
  const initialized = useRef(false)
  const height = useSpring(0, { stiffness: 300, damping: 30 })
  const top = useSpring(0, { stiffness: 300, damping: 30 })
  useMotionValueEvent(height, 'change', value => {
    elementRef.current?.style.setProperty(`--${prefix}-height`, `${value}px`)
  })
  useMotionValueEvent(top, 'change', value => {
    elementRef.current?.style.setProperty(`--${prefix}-top`, `${value}px`)
  })
  return useCallback((nextHeight, nextTop) => {
    const immediate = reduced || !initialized.current
    if (immediate) {
      height.jump(nextHeight); top.jump(nextTop)
      elementRef.current?.style.setProperty(`--${prefix}-height`, `${nextHeight}px`)
      elementRef.current?.style.setProperty(`--${prefix}-top`, `${nextTop}px`)
    } else { height.set(nextHeight); top.set(nextTop) }
    initialized.current = true
  }, [height, top, elementRef, prefix, reduced])
}
