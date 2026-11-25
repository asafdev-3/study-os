import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { transitionRoute } from '../lib/routeTransition'

const isAndroid = () => document.documentElement.classList.contains('is-android')

// Animate the outgoing DOM before navigation on iOS/Desktop; navigate immediately on Android.
export function FoldableTransition() {
  const navigate = useNavigate()
  useEffect(() => {
    function click(event) {
      const link = event.target.closest('a[data-study-transition-link][href]')
      if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target || link.hasAttribute('download')) return
      const url = new URL(link.href)
      if (url.origin !== location.origin || url.pathname === location.pathname) return
      event.preventDefault()

      // No Android, evita captura/blur de DOM em tela cheia para manter 60fps
      if (isAndroid()) {
        navigate(url.pathname + url.search + url.hash)
        return
      }

      void transitionRoute(url.pathname, () => navigate(url.pathname + url.search + url.hash))
    }
    document.addEventListener('click', click, true)
    return () => document.removeEventListener('click', click, true)
  }, [navigate])
  return null
}