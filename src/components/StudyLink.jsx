import { Link } from 'react-router-dom'
import { loadStudyRoute } from '../lib/studyRoutes'

export function StudyLink({ as: Component = Link, to, ...props }) {
  function preload() {
    const load = loadStudyRoute[to]
    if (load) void load().catch(() => {})
  }

  return <Component {...props} to={to}
    onPointerDown={preload} onPointerEnter={preload} onFocus={preload} />
}
