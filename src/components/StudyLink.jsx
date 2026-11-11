import { Link } from 'react-router-dom'
import { loadStudyRoute } from '../lib/studyRoutes'
import { readPreferences } from '../lib/preferences'

export function StudyLink({ as: Component = Link, to, ...props }) {
  function preload() {
    const load = loadStudyRoute[to]
    if (load) void load().catch(() => {})
  }

  const reduce = readPreferences().reduceMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches
  return <Component {...props} to={to} viewTransition={!reduce}
    onPointerDown={preload} onPointerEnter={preload} onFocus={preload} />
}
