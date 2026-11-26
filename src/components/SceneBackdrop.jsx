import { useEffect, useState } from 'react'

const scenes = import.meta.glob('../assets/scenes/*.webp', { eager: true, import: 'default', query: '?url' })

export default function SceneBackdrop({ scene }) {
  const [ready, setReady] = useState('')
  useEffect(() => {
    const narrow = matchMedia('(max-width: 760px)')
    let version = 0
    async function load() {
      const current = ++version
      const url = scenes['../assets/scenes/' + scene + (narrow.matches ? '-small' : '') + '.webp']
      if (!url) return
      const next = new Image()
      next.decoding = 'async'
      next.src = url
      try {
        await next.decode()
        if (current === version) setReady(url)
      } catch { /* Keep the previous scene or the base sky while offline. */ }
    }
    void load()
    narrow.addEventListener('change', load)
    return () => { version++; narrow.removeEventListener('change', load) }
  }, [scene])
  return <div className="study-scenery" aria-hidden="true">
    {ready && <img className="scene-photo" src={ready} alt="" decoding="async" />}
    <div className="scene-light" />
  </div>
}
