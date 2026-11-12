import { useEffect, useRef, useState } from 'react'
import { Check, Fingerprint, Moon, Sun } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { readPreferences } from '../lib/preferences'

const timeFormat = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })
const dateFormat = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: 'numeric', month: 'long' })

export default function Lock({ onUnlock }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [now, setNow] = useState(() => new Date())
  const [phase, setPhase] = useState('idle')
  const confirmTimer = useRef(0)
  const timer = useRef(0)
  const DayIcon = now.getHours() >= 6 && now.getHours() < 18 ? Sun : Moon

  useEffect(() => {
    let timeout
    function update() {
      const date = new Date()
      setNow(date)
      clearTimeout(timeout)
      timeout = setTimeout(update, 60_000 - date.getTime() % 60_000)
    }
    update()
    document.addEventListener('visibilitychange', update)
    return () => {
      clearTimeout(timeout)
      clearTimeout(timer.current)
      clearTimeout(confirmTimer.current)
      document.removeEventListener('visibilitychange', update)
    }
  }, [])

  function enter() {
    if (phase !== 'idle') return
    const reduce = readPreferences().reduceMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const destination = location.state?.destino ?? '/dashboard'
    function unlock() {
      onUnlock()
      navigate(destination, { replace: true })
    }
    if (reduce) unlock()
    else {
      setPhase('scan')
      confirmTimer.current = setTimeout(() => setPhase('confirmed'), 440)
      timer.current = setTimeout(unlock, 620)
    }
  }

  return (
    <main className="study-lock" data-phase={phase}>
      <header className="study-lock-brand"><img src="/icons/icon-192.png" alt="StudyOS" width="58" height="58" /></header>
      <div className="study-lock-clock">
        <p><DayIcon size={15} aria-hidden="true" />{dateFormat.format(now)}</p>
        <time dateTime={now.toISOString()}>{timeFormat.format(now)}</time>
      </div>
      <div className="study-lock-action">
        <button type="button" aria-label="Entrar no StudyOS" onClick={enter} disabled={phase !== 'idle'}>
          <span className="study-lock-scan-frame" aria-hidden="true"><i /><i /><i /><i /><span /></span>
          <svg className="study-lock-ring" viewBox="0 0 88 88" aria-hidden="true">
            <defs><linearGradient id="study-lock-accent"><stop stopColor="#8b7cff" /><stop offset="1" stopColor="#5ce1c2" /></linearGradient></defs>
            <circle cx="44" cy="44" r="41" className="study-lock-ring-track" />
            <circle cx="44" cy="44" r="41" pathLength="100" className="study-lock-ring-progress" />
          </svg>
          {phase === 'confirmed' ? <Check size={28} strokeWidth={1.7} aria-hidden="true" /> : <Fingerprint size={32} strokeWidth={1.5} aria-hidden="true" />}
        </button>
        <p role="status">{phase === 'confirmed' ? 'Acesso liberado' : phase === 'scan' ? 'Abrindo StudyOS…' : 'Toque para entrar'}</p>
      </div>
    </main>
  )
}
