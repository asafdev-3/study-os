import { preloadStudyRoute } from './studyRoutes'

const primaryPaths = ['/dashboard', '/anotacoes', '/chat', '/enem', '/perfil', '/configuracoes']

export function transitionTo(change) {
  change()
}

let resetTransition
export function transitionRoute(path, change) {
  const root = document.documentElement
  const reduced = root.dataset.studyMotion === 'reduced' || matchMedia('(prefers-reduced-motion: reduce)').matches
  clearTimeout(resetTransition)
  if (!reduced) {
    root.dataset.studyTransition = 'crossfade'
    resetTransition = setTimeout(() => { delete root.dataset.studyTransition }, 180)
  }
  void preloadStudyRoute(path)?.catch(() => {})
  change()
}

export function routeIndex(path) {
  return primaryPaths.findIndex(route => path.startsWith(route))
}