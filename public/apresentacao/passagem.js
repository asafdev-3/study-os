(() => {
  const root = document.documentElement
  const key = 'studyos:passage'
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
  const landing = root.hasAttribute('data-study-landing')

  function motionAllowed() {
    try {
      return !reducedMotion.matches && !JSON.parse(localStorage.getItem('studyos:preferences') || '{}')?.reduceMotion
    } catch {
      return !reducedMotion.matches
    }
  }

  function cover() {
    const layer = document.createElement('div')
    layer.id = 'studyos-passage'
    layer.setAttribute('aria-hidden', 'true')
    const image = new Image(64, 64)
    image.src = '/icons/icon-192.png'
    image.alt = ''
    layer.append(image)
    document.body.append(layer)
    return layer
  }

  if (landing) {
    addEventListener('pageshow', () => {
      delete root.dataset.studyPassage
      document.getElementById('studyos-passage')?.remove()
    })
    document.addEventListener('click', event => {
      const link = event.target.closest('a[data-open-studyos]')
      if (!link || link.target || event.defaultPrevented || event.button ||
          event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !motionAllowed()) return
      if (root.dataset.studyPassage) { event.preventDefault(); return }
      const destination = new URL(link.href)
      if (destination.origin !== location.origin) return
      try {
        sessionStorage.setItem(key, JSON.stringify({ url: destination.pathname + destination.search, time: Date.now() }))
      } catch { return }

      event.preventDefault()
      const layer = cover()
      layer.getBoundingClientRect()
      root.dataset.studyPassage = 'leaving'
      setTimeout(() => location.assign(destination.href), 180)
    })
    return
  }

  let entry
  try {
    entry = JSON.parse(sessionStorage.getItem(key))
    sessionStorage.removeItem(key)
  } catch { return }
  if (!motionAllowed() || entry?.url !== location.pathname + location.search || Date.now() - entry.time > 15000) return

  root.dataset.studyPassage = 'arriving'
  const layer = cover()
  const observer = new MutationObserver(() => {
    if (document.querySelector('main, .study-upgrade, .study-room')) reveal()
  })
  const timeout = setTimeout(reveal, 3200)
  observer.observe(document.getElementById('root'), { childList: true, subtree: true })

  function reveal() {
    observer.disconnect()
    clearTimeout(timeout)
    requestAnimationFrame(() => {
      root.dataset.studyPassage = 'revealing'
      setTimeout(() => {
        layer.remove()
        delete root.dataset.studyPassage
      }, 440)
    })
  }
})()
