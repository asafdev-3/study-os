import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { preloadStudyRoute } from '../lib/studyRoutes'
import { transitionRoute } from '../lib/routeTransition'

export function FoldableTransition() {
  const navigate = useNavigate()
  const locationKey = useLocation().key
  useEffect(() => {
    let timer
    let request = 0
    function cancel() {
      clearTimeout(timer)
      request++
    }
    function click(event) {
      const link = event.target.closest('a[data-study-transition-link][href]')
      if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target || link.hasAttribute('download')) return
      const url = new URL(link.href)
      if (url.origin !== location.origin || url.pathname === location.pathname) return
      event.preventDefault()

      cancel()
      const current = request
      const destination = url.pathname + url.search + url.hash
      const preload = preloadStudyRoute(url.pathname)
      function open() {
        if (current !== request) return
        cancel()
        void transitionRoute(url.pathname, () => navigate(destination))
      }
      if (preload) {
        timer = setTimeout(open, 100)
        preload.then(open, open)
      } else {
        open()
      }
    }
    document.addEventListener('click', click, true)
    window.addEventListener('popstate', cancel)
    return () => {
      cancel()
      document.removeEventListener('click', click, true)
      window.removeEventListener('popstate', cancel)
    }
  }, [locationKey, navigate])
  return null
}