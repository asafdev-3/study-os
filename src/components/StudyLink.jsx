import { Link } from 'react-router-dom'
import { preloadStudyRoute } from '../lib/studyRoutes'

export function StudyLink({ as: Component = Link, to, onPointerDown, onPointerEnter, onFocus, ...props }) {
  function preload() { void preloadStudyRoute(to)?.catch(() => {}) }
  return <Component {...props} to={to}
    onPointerDown={event => { preload(); onPointerDown?.(event) }}
    onPointerEnter={event => { preload(); onPointerEnter?.(event) }}
    onFocus={event => { preload(); onFocus?.(event) }} />
}
