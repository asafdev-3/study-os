import { useSyncExternalStore } from 'react'
import { readPreferences } from './preferences'

function subscribe(callback) {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)')
  media.addEventListener('change', callback)
  window.addEventListener('studyos:preferences', callback)
  window.addEventListener('storage', callback)
  return () => {
    media.removeEventListener('change', callback)
    window.removeEventListener('studyos:preferences', callback)
    window.removeEventListener('storage', callback)
  }
}

function snapshot() {
  return readPreferences().reduceMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function useStudyReducedMotion() {
  return useSyncExternalStore(subscribe, snapshot, () => true)
}

// Presets de spring 120Hz (somente transform + opacity, assentamento rápido)
export const pageSpring = { type: 'spring', stiffness: 460, damping: 38, mass: 0.65 }
export const cardSpring = { type: 'spring', stiffness: 440, damping: 36, mass: 0.7 }
export const microSpring = { type: 'spring', stiffness: 560, damping: 40, mass: 0.55 }
export const softTransition = { duration: 0.16, ease: [.22, 1, .36, 1] }