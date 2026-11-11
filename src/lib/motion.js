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
export const softTransition = { duration: .22, ease: [.22, 1, .36, 1] }
