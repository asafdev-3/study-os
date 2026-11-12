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

// ── Presets de spring para sensação iOS/120Hz ────────────────────────────────
// Regra: apenas transform + opacity. Sem width/height/border-radius animados.

/** Transição de página — suave, física de iOS ProMotion */
export const pageSpring = { type: 'spring', stiffness: 260, damping: 28, mass: 0.9 }

/** Cards e modais — levemente mais rígido */
export const cardSpring = { type: 'spring', stiffness: 320, damping: 32, mass: 0.8 }

/** Micro-interações — chips, badges, ícones */
export const microSpring = { type: 'spring', stiffness: 480, damping: 38, mass: 0.6 }

/** Fallback duration-based para efeitos atmosféricos (blur, opacity puro) */
export const softTransition = { duration: 0.22, ease: [.22, 1, .36, 1] }
