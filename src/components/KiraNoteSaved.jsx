import { useEffect, useState } from 'react'
import { useStudyReducedMotion } from '../lib/motion'
import noteSavedClip from '../assets/kira-note.webp'
import kiraRest from '../assets/kira-rest.webp'
import './KiraNoteSaved.css'

// Só montar após confirmação da gravação no banco.
export default function KiraNoteSaved({ saveId }) {
  const reducedMotion = useStudyReducedMotion()
  const [visibleId, setVisibleId] = useState(null)

  useEffect(() => {
    if (!saveId) return undefined
    const start = requestAnimationFrame(() => setVisibleId(saveId))
    const end = setTimeout(() => setVisibleId(null), reducedMotion ? 2200 : 1700)
    return () => {
      cancelAnimationFrame(start)
      clearTimeout(end)
    }
  }, [saveId, reducedMotion])

  if (visibleId !== saveId) return null
  return (
    <div className="kira-note-saved" role="status" aria-live="polite">
      <img key={saveId} src={reducedMotion ? kiraRest : noteSavedClip} alt="" width="104" height="88" />
      <span>Anotação salva</span>
    </div>
  )
}
