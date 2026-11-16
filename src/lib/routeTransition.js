import { readPreferences } from './preferences'
const paths = ['/dashboard', '/anotacoes', '/chat', '/enem', '/perfil', '/configuracoes']
let cancelCurrent
export function transitionTo(change, nextIndex, prevIndex, target) {
  cancelCurrent?.()
  if (readPreferences().reduceMotion || matchMedia('(prefers-reduced-motion: reduce)').matches) { change(); return }
  const content = target ?? document.querySelector('main') ?? document.querySelector('.study-page-enter')
  if (!content?.animate) { change(); return }
  const direction = nextIndex >= prevIndex ? 1 : -1
  const glass = document.createElement('div')
  glass.className = 'study-route-blur'
  glass.setAttribute('aria-hidden', 'true')
  glass.style.setProperty('--blur-direction', direction > 0 ? 'to right' : 'to left')
  document.body.append(glass)
  const previousWillChange = content.style.willChange
  content.style.willChange = 'transform, filter'
  const baseTransform = getComputedStyle(content).transform
  const base = baseTransform === 'none' ? '' : baseTransform + ' '
  const outgoing = content.animate([
    { transform: base + 'perspective(1200px) rotateY(0deg) scale(1)', filter: 'blur(0px) brightness(1)' },
    { transform: `${base}perspective(1200px) rotateY(${-4 * direction}deg) scale(.985)`, filter: 'blur(12px) brightness(.92)' },
  ], { duration: 180, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' })
  const veil = glass.animate([{ opacity: 0 }, { opacity: 1, offset: .43 }, { opacity: 0 }],
    { duration: 420, easing: 'cubic-bezier(.22,1,.36,1)' })
  let cancelled = false
  const cleanup = () => {
    cancelled = true; outgoing.cancel(); veil.cancel(); glass.remove()
    content.style.willChange = previousWillChange
    if (cancelCurrent === cleanup) cancelCurrent = undefined
  }
  cancelCurrent = cleanup
  outgoing.finished.then(() => {
    if (cancelled) return
    outgoing.cancel(); content.style.willChange = previousWillChange
    change()
  }).catch(() => {})
  veil.finished.then(cleanup).catch(() => {})
}
export function transitionRoute(path, change) {
  const index = value => paths.findIndex(route => value.startsWith(route))
  transitionTo(change, index(path), index(location.pathname))
}
