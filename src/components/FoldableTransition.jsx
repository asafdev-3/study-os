import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { transitionRoute } from '../lib/routeTransition'

// Animate the outgoing DOM before navigation; never mount a duplicate live screen.
export function FoldableTransition() {
  const navigate = useNavigate()
  useEffect(() => {
    function click(event) {
      const link = event.target.closest('a[data-study-transition-link][href]')
      if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target || link.hasAttribute('download')) return
      const url = new URL(link.href)
      if (url.origin !== location.origin || url.pathname === location.pathname) return
      event.preventDefault()
      void transitionRoute(url.pathname, () => navigate(url.pathname + url.search + url.hash))
    }
    document.addEventListener('click', click, true)
    return () => document.removeEventListener('click', click, true)
  }, [navigate])
  return null
}
