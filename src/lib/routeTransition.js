import { preloadStudyRoute } from './studyRoutes'

const primaryPaths = ['/dashboard', '/anotacoes', '/chat', '/enem', '/perfil', '/configuracoes']

// Pré-carrega as rotas principais em segundo plano quando o navegador estiver ocioso
if (typeof window !== 'undefined') {
  const warmRoutes = () => {
    primaryPaths.forEach((path) => {
      try { void preloadStudyRoute(path) } catch { /* ignore */ }
    })
  }
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(warmRoutes, { timeout: 1800 })
  } else {
    window.setTimeout(warmRoutes, 900)
  }
}

export function transitionTo(change) {
  change()
}

export function transitionRoute(path, change) {
  try { void preloadStudyRoute(path) } catch { /* ignore */ }
  change()
}

export function routeIndex(path) {
  return primaryPaths.findIndex(route => path.startsWith(route))
}