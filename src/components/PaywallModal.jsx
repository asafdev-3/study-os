import { useEffect, useRef } from 'react'
import { ArrowRight, X } from 'lucide-react'
import { StudyLink } from './StudyLink'
import kiraImage from '../assets/kira-studyos.webp'
import { KIRA_DAILY_LIMIT } from '../lib/groq'

export default function PaywallModal() {
  const dialog = useRef(null)

  useEffect(() => {
    const element = dialog.current
    function open() {
      if (!element.open) element.showModal()
    }

    window.addEventListener('studyos:kira-limit', open)
    return () => window.removeEventListener('studyos:kira-limit', open)
  }, [])

  function close() {
    dialog.current.close()
  }

  return (
    <dialog ref={dialog} className="study-paywall" aria-labelledby="study-paywall-title">
      <div className="study-paywall-panel">
        <button type="button" onClick={close} className="study-paywall-close" aria-label="Fechar">
          <X size={21} aria-hidden="true" />
        </button>
        <img src={kiraImage} alt="" width="48" height="48" loading="lazy" />
        <h2 id="study-paywall-title">Limite diário da Kira</h2>
        <p>Você usou as {KIRA_DAILY_LIMIT} mensagens de hoje. O limite renova à meia-noite, no horário de Brasília.</p>
        <StudyLink to="/upgrade" className="study-primary" onClick={close}>
          Ver planos <ArrowRight size={16} aria-hidden="true" />
        </StudyLink>
        <button type="button" className="study-paywall-later" onClick={close}>Agora não</button>
      </div>
    </dialog>
  )
}
