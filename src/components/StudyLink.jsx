import { Link } from 'react-router-dom'
import { preloadStudyRoute } from '../lib/studyRoutes'

export function StudyLink({ as: Component = Link, to, state, replace, onPointerDown, onPointerEnter, onFocus, ...props }) {
  // Preserve router state (e.g. Kira's suggested prompt). Only plain links may be intercepted.
  const animated = !state && !replace && typeof to === 'string'
    && /^\/(dashboard|anotacoes|chat|enem|perfil|configuracoes|lembretes)([/?#]|$)/.test(to)
  function preload() { void preloadStudyRoute(to)?.catch(() => {}) }
  return <Component {...props} to={to} state={state} replace={replace}
    data-study-transition-link={animated ? '' : undefined}
    onPointerDown={event => { preload(); onPointerDown?.(event) }}
    onPointerEnter={event => { preload(); onPointerEnter?.(event) }}
    onFocus={event => { preload(); onFocus?.(event) }} />
}
