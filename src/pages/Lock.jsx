import { useEffect, useRef, useState } from 'react'
import { Check, Fingerprint, Moon, Sun } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

const HOLD_DURATION = 800

const timeFormat = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })
const dateFormat = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: 'numeric', month: 'long' })

export default function Lock({ onUnlock }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [now, setNow] = useState(() => new Date())
  const [phase, setPhase] = useState('idle')
  const frame = useRef(0)
  const active = useRef(null)
  const ring = useRef(null)
  const completed = useRef(false)
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
      cancelAnimationFrame(frame.current)
      active.current = null
      document.removeEventListener('visibilitychange', update)
    }
  }, [])

  function cancel() {
    if (!active.current || completed.current) return
    active.current = null
    clearTimeout(timer.current)
    cancelAnimationFrame(frame.current)
    ring.current?.style.setProperty('stroke-dashoffset', '100')
    setPhase('cancelled')
  }

  useEffect(() => {
    const hide = () => { if (document.hidden) cancel() }
    window.addEventListener('blur', cancel)
    document.addEventListener('visibilitychange', hide)
    return () => {
      window.removeEventListener('blur', cancel)
      document.removeEventListener('visibilitychange', hide)
    }
  }, [])

  function start(source) {
    if (active.current || completed.current) return
    active.current = { source, start: performance.now() }
    setPhase('scan')
    ring.current?.style.setProperty('stroke-dashoffset', '100')
    function finish() {
      if (!active.current || completed.current) return
      const elapsed = performance.now() - active.current.start
      if (elapsed < HOLD_DURATION) {
        timer.current = setTimeout(finish, HOLD_DURATION - elapsed)
        return
      }
      completed.current = true
      active.current = null
      cancelAnimationFrame(frame.current)
      ring.current?.style.setProperty('stroke-dashoffset', '0')
      setPhase('confirmed')
      timer.current = setTimeout(() => {
        onUnlock()
        navigate(location.state?.destino ?? '/dashboard', { replace: true })
      }, 180)
    }
    function paint() {
      if (!active.current) return
      const progress = Math.min(1, (performance.now() - active.current.start) / HOLD_DURATION)
      ring.current?.style.setProperty('stroke-dashoffset', String(100 * (1 - progress)))
      frame.current = requestAnimationFrame(paint)
    }
    frame.current = requestAnimationFrame(paint)
    timer.current = setTimeout(finish, HOLD_DURATION)
  }

  function pointerDown(event) {
    if (!event.isPrimary || event.button !== 0) return
    event.preventDefault()
    window.getSelection()?.removeAllRanges()
    event.currentTarget.focus({ preventScroll: true })
    event.currentTarget.setPointerCapture(event.pointerId)
    start(event.pointerId)
  }

  function pointerEnd(event) {
    if (active.current?.source === event.pointerId) cancel()
  }

  function pointerMove(event) {
    if (active.current?.source !== event.pointerId) return
    const box = event.currentTarget.getBoundingClientRect()
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) cancel()
  }

  return (
    <main className="study-lock" data-phase={phase}>
      <header className="study-lock-brand"><img src="/icons/icon-192.png" alt="StudyOS" width="58" height="58" /></header>
      <div className="study-lock-clock">
        <p><DayIcon size={15} aria-hidden="true" />{dateFormat.format(now)}</p>
        <time dateTime={now.toISOString()}>{timeFormat.format(now)}</time>
      </div>
      <div className="study-lock-action" onContextMenu={(event) => event.preventDefault()}>
        <button type="button" aria-label="Entrar no StudyOS" onPointerDown={pointerDown}
          onPointerUp={pointerEnd} onPointerLeave={pointerEnd} onPointerCancel={pointerEnd}
          onLostPointerCapture={pointerEnd} onPointerMove={pointerMove} onBlur={cancel}
          onContextMenu={(event) => event.preventDefault()}
          onKeyDown={(event) => {
            if (![' ', 'Enter'].includes(event.key)) return
            event.preventDefault()
            if (!event.repeat) start('keyboard')
          }}
          onKeyUp={(event) => {
            if (![' ', 'Enter'].includes(event.key)) return
            event.preventDefault()
            if (active.current?.source === 'keyboard') cancel()
          }}
          aria-describedby="study-lock-status"
          style={{ WebkitUserSelect: 'none', userSelect: 'none', touchAction: 'none', WebkitTouchCallout: 'none' }}>
          <span className="study-lock-scan-frame" aria-hidden="true"><i /><i /><i /><i /><span /></span>
          <svg className="study-lock-ring" viewBox="0 0 88 88" aria-hidden="true">
            <defs><linearGradient id="study-lock-accent"><stop stopColor="#8b7cff" /><stop offset="1" stopColor="#5ce1c2" /></linearGradient></defs>
            <circle cx="44" cy="44" r="41" className="study-lock-ring-track" />
            <circle ref={ring} style={{ strokeDashoffset: 100 }} cx="44" cy="44" r="41" pathLength="100" className="study-lock-ring-progress" />
          </svg>
          {phase === 'confirmed' ? <Check size={28} strokeWidth={1.7} aria-hidden="true" /> : <Fingerprint size={32} strokeWidth={1.5} aria-hidden="true" />}
        </button>
        <p id="study-lock-status" role="status">{phase === 'confirmed' ? 'Leitura concluída!' : phase === 'scan' ? 'Escaneando... Mantenha pressionado' : phase === 'cancelled' ? 'Cancelado! Segure até o fim para concluir' : 'Segure um instante para entrar'}</p>
      </div>
    </main>
  )
}
