const loaders = {
  '/dashboard': () => import('../pages/Dashboard'),
  '/chat': () => import('../pages/Chat'),
  '/anotacoes': () => import('../pages/Anotacoes'),
  '/enem': () => import('../pages/EnemScreen'),
  '/perfil': () => import('../pages/Perfil'),
  '/configuracoes': () => import('../pages/Configuracoes'),
  '/nfc': () => import('../pages/NFC'),
}
const pending = new Map()
export const loadStudyRoute = Object.fromEntries(Object.entries(loaders).map(([path, load]) => [path, () => {
  if (!pending.has(path)) pending.set(path, load().catch(error => { pending.delete(path); throw error }))
  return pending.get(path)
}]))
export function preloadStudyRoute(to) {
  const path = (typeof to === 'string' ? to : to?.pathname)?.split(/[?#]/)[0]
  const key = path?.startsWith('/configuracoes/') ? '/configuracoes' : path
  return loadStudyRoute[key]?.()
}
export function warmStudyRoutes() {
  if (navigator.connection?.saveData) return () => {}
  let stopped = false
  const schedule = window.requestIdleCallback
    ? callback => window.requestIdleCallback(callback, { timeout: 3000 })
    : callback => window.setTimeout(callback, 1200)
  const cancel = window.requestIdleCallback ? window.cancelIdleCallback.bind(window) : window.clearTimeout.bind(window)
  let task
  const paths = ['/anotacoes', '/chat', '/enem']
  function next() {
    if (stopped || !paths.length) return
    task = schedule(async () => {
      if (stopped || document.hidden) return
      try { await preloadStudyRoute(paths.shift()) } catch { /* A tap retries a failed preload. */ }
      next()
    })
  }
  next()
  return () => { stopped = true; cancel(task) }
}
