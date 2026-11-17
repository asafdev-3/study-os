import { flushSync } from 'react-dom'
import { readPreferences } from './preferences'
import { preloadStudyRoute } from './studyRoutes'

const primaryPaths = ['/dashboard', '/anotacoes', '/chat', '/enem', '/perfil', '/configuracoes']
let navigationRequest = 0
let inFlight = null

function motionDisabled() {
  return readPreferences().reduceMotion ||
    window.matchMedia('(max-width: 767px)').matches ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.hasAttribute('data-study-keyboard')
}

function cleanup(transition) {
  if (inFlight !== transition) return
  inFlight = null
  delete document.documentElement.dataset.studyTransition
}

function stableCrossfade(change) {
  // No browser snapshot support: an immediate change is better than fading into an empty screen.
  if (motionDisabled() || typeof document.startViewTransition !== 'function') {
    change()
    return
  }

  if (inFlight) {
    inFlight.skipTransition()
    cleanup(inFlight)
  }
  const root = document.documentElement
  root.dataset.studyTransition = 'crossfade'
  try {
    const transition = document.startViewTransition(() => {
      // The next page bundle was prefetched before taking either snapshot.
      flushSync(change)
    })
    inFlight = transition
    void transition.finished.then(
      () => cleanup(transition),
      () => cleanup(transition),
    )
  } catch {
    delete root.dataset.studyTransition
    change()
  }
}

/** Within ENEM, never transition the document or the tab bar. */
export function transitionTo(change) {
  change()
}

export async function transitionRoute(path, change) {
  const request = ++navigationRequest

  if (motionDisabled()) {
    stableCrossfade(change)
    return
  }
  // Cold lazy chunks must load while the previous screen is still fully visible.
  // This prevents Suspense's fallback from becoming the incoming snapshot.
  try {
    await preloadStudyRoute(path)
  } catch {
    // The existing screen remains usable; a normal navigation may display its error state.
  }
  if (request !== navigationRequest) return
  stableCrossfade(change)
}

export function routeIndex(path) {
  return primaryPaths.findIndex(route => path.startsWith(route))
}
