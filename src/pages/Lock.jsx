import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, LockKeyhole } from 'lucide-react'

export default function Lock({ onUnlock }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [agora, setAgora] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setAgora(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  function entrar() {
    onUnlock()
    navigate(location.state?.destino ?? '/dashboard', { replace: true })
  }

  return (
    <main className="study-entry">
      <section className="study-entry-panel">
        <img src="/icons/icon-192.png" alt="StudyOS" width="64" height="64" />
        <p>{agora.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        <time>{agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</time>
        <h1>Sua sessão está pronta</h1>
        <button type="button" className="study-primary" onClick={entrar}>
          <LockKeyhole size={17} aria-hidden="true" /> Continuar <ArrowRight size={17} aria-hidden="true" />
        </button>
      </section>
    </main>
  )
}
