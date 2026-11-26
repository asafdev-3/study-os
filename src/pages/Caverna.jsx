import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Play, Pause, RotateCcw } from 'lucide-react'

const FOCO_TOTAL = 25 * 60
const PAUSA_TOTAL = 5 * 60
const SEGMENTOS = 32
const isAndroidDevice = () => document.documentElement.classList.contains('is-android')

function lerp(a, b, t) { return a + (b - a) * t }
function hexToRgb(hex) {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]
}
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('')
}

// Paleta Liquid Glass StudyOS: Azul-gelo (#60A5FA) -> Índigo Suave (#A5B4FC)
const COR_A = hexToRgb('#60A5FA')
const COR_B = hexToRgb('#A5B4FC')

function corSegmento(index, total) {
  const t = index / (total - 1)
  return rgbToHex(...[0, 1, 2].map(i => lerp(COR_A[i], COR_B[i], t)))
}

function Caverna() {
  const navigate = useNavigate()
  const android = isAndroidDevice()
  const [modo, setModo] = useState('foco')
  const [segundos, setSegundos] = useState(FOCO_TOTAL)
  const [rodando, setRodando] = useState(false)
  const [concluido, setConcluido] = useState(false)
  const [piscando, setPiscando] = useState(false)
  const [ciclos, setCiclos] = useState(0)
  const deadlineRef = useRef(null)

  const total = modo === 'foco' ? FOCO_TOTAL : PAUSA_TOTAL
  const progresso = 1 - segundos / total
  const segmentosAtivos = Math.floor(progresso * SEGMENTOS)

  useEffect(() => {
    if (!rodando) {
      deadlineRef.current = null
      return
    }
    let blinkTimer = null

    const tick = () => {
      if (!deadlineRef.current) return
      const restante = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000))
      setSegundos(restante)

      if (restante <= 0) {
        clearInterval(interval)
        deadlineRef.current = null
        setRodando(false)
        setConcluido(true)
        if (modo === 'foco') setCiclos(c => Math.min(4, c + 1))

        let count = 0
        blinkTimer = setInterval(() => {
          setPiscando(p => !p)
          count++
          if (count >= 6) clearInterval(blinkTimer)
        }, 300)
      }
    }

    const interval = setInterval(tick, 250)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(interval)
      if (blinkTimer) clearInterval(blinkTimer)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [rodando, modo])

  function toggleTimer() {
    if (concluido) { resetar(); return }
    if (!rodando) deadlineRef.current = Date.now() + segundos * 1000
    setRodando(!rodando)
  }

  function resetar() {
    deadlineRef.current = null
    setRodando(false)
    setConcluido(false)
    setPiscando(false)
    setSegundos(modo === 'foco' ? FOCO_TOTAL : PAUSA_TOTAL)
  }

  function alternarModo(novoModo) {
    deadlineRef.current = null
    setRodando(false)
    setConcluido(false)
    setPiscando(false)
    setModo(novoModo)
    setSegundos(novoModo === 'foco' ? FOCO_TOTAL : PAUSA_TOTAL)
  }

  const min = String(Math.floor(segundos / 60)).padStart(2, '0')
  const sec = String(segundos % 60).padStart(2, '0')
  const cx = 160, cy = 160, raioExterno = 132, raioInterno = 108, gap = 4.5

  function segmentoPath(index) {
    const angleTotal = (2 * Math.PI) / SEGMENTOS
    const angleGap = gap * (Math.PI / 180)
    const startAngle = index * angleTotal - Math.PI / 2 + angleGap / 2
    const endAngle = startAngle + angleTotal - angleGap
    const x1 = cx + raioExterno * Math.cos(startAngle), y1 = cy + raioExterno * Math.sin(startAngle)
    const x2 = cx + raioExterno * Math.cos(endAngle), y2 = cy + raioExterno * Math.sin(endAngle)
    const x3 = cx + raioInterno * Math.cos(endAngle), y3 = cy + raioInterno * Math.sin(endAngle)
    const x4 = cx + raioInterno * Math.cos(startAngle), y4 = cy + raioInterno * Math.sin(startAngle)
    return `M ${x1} ${y1} A ${raioExterno} ${raioExterno} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${raioInterno} ${raioInterno} 0 0 0 ${x4} ${y4} Z`
  }

  return (
    <main
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'max(18px, calc(env(safe-area-inset-top, 0px) + 12px)) 20px max(28px, calc(env(safe-area-inset-bottom, 0px) + 18px))',
        background:
          'radial-gradient(ellipse 85% 55% at 50% 18%, rgba(56, 114, 214, 0.22), transparent 65%), radial-gradient(ellipse 75% 50% at 50% 85%, rgba(99, 102, 241, 0.16), transparent 68%), #08121e',
        color: '#f2f7ff',
      }}
    >
      {/* Topo estilo iOS */}
      <header style={{ width: 'min(100%, 420px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px',
            minHeight: '42px',
            padding: '0 14px',
            borderRadius: '999px',
            background: 'rgba(22, 36, 58, 0.72)',
            border: '1px solid rgba(215, 232, 255, 0.18)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15)',
            color: '#e5f0ff',
            fontSize: '13px',
            fontWeight: 550,
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Sala</span>
        </button>

        <div
          role="group"
          aria-label="Modo de sessão"
          style={{
            display: 'flex',
            gap: '4px',
            padding: '4px',
            borderRadius: '999px',
            background: 'rgba(15, 26, 44, 0.82)',
            border: '1px solid rgba(215, 232, 255, 0.16)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          }}
        >
          {[
            ['foco', 'Foco'],
            ['pausa', 'Pausa'],
          ].map(([id, label]) => {
            const active = modo === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => alternarModo(id)}
                style={{
                  minHeight: '34px',
                  padding: '0 16px',
                  borderRadius: '999px',
                  border: active ? '1px solid rgba(220, 238, 255, 0.32)' : '1px solid transparent',
                  background: active
                    ? 'linear-gradient(145deg, rgba(164, 202, 255, 0.28), rgba(90, 134, 214, 0.26))'
                    : 'transparent',
                  color: active ? '#ffffff' : '#9fb2ce',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </header>

      {/* Mostrador central Liquid Glass */}
      <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
        <div
          style={{
            position: 'relative',
            width: 312,
            height: 312,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 50% 35%, rgba(28, 46, 74, 0.55), rgba(10, 20, 36, 0.72))',
            border: '1px solid rgba(215, 232, 255, 0.14)',
            boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.16), 0 20px 50px rgba(0, 0, 0, 0.35)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <svg width="312" height="312" viewBox="0 0 320 320">
            {Array.from({ length: SEGMENTOS }).map((_, i) => {
              const ativo = i < segmentosAtivos
              const mostrarCor = ativo || (concluido && piscando)
              return (
                <path
                  key={i}
                  d={segmentoPath(i)}
                  fill={mostrarCor ? corSegmento(i, SEGMENTOS) : 'rgba(180, 205, 240, 0.12)'}
                  style={{
                    transition: android ? 'none' : 'fill 0.35s ease',
                    filter: !android && mostrarCor ? `drop-shadow(0 0 5px ${corSegmento(i, SEGMENTOS)}88)` : 'none',
                  }}
                />
              )
            })}
          </svg>

          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#9ec5ff', fontWeight: 600, marginBottom: '4px' }}>
              {concluido ? 'Concluído' : modo === 'foco' ? 'Imersão Total' : 'Descanso'}
            </span>
            <time
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Geist, sans-serif',
                fontSize: '56px',
                fontWeight: 600,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.04em',
                lineHeight: 1.05,
                color: concluido ? '#93c5fd' : '#f7faff',
              }}
            >
              {min}:{sec}
            </time>
            <span style={{ fontSize: '12px', color: '#a8bddb', marginTop: '6px' }}>
              {rodando ? 'Notificações silenciadas' : 'Pronto para começar'}
            </span>
          </div>
        </div>

        {/* Indicador de ciclos */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} aria-label={`${ciclos} de 4 ciclos concluídos`}>
          {[1, 2, 3, 4].map(i => (
            <span
              key={i}
              style={{
                width: i <= Math.max(1, ciclos) ? '18px' : '7px',
                height: '7px',
                borderRadius: '999px',
                background: i <= Math.max(1, ciclos) ? '#7fb2ff' : 'rgba(180, 205, 240, 0.22)',
                transition: 'all 0.25s ease',
              }}
            />
          ))}
        </div>
      </section>

      {/* Controles inferiores */}
      <footer style={{ width: 'min(100%, 420px)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
        <button
          type="button"
          onClick={resetar}
          aria-label="Reiniciar cronômetro"
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            background: 'rgba(22, 36, 58, 0.78)',
            border: '1px solid rgba(215, 232, 255, 0.18)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.14)',
            color: '#c9daf2',
            cursor: 'pointer',
          }}
        >
          <RotateCcw size={19} />
        </button>

        <button
          type="button"
          onClick={toggleTimer}
          aria-label={rodando ? 'Pausar sessão' : 'Iniciar sessão'}
          style={{
            width: '74px',
            height: '74px',
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            background: 'linear-gradient(145deg, #dce9fc, #a8c7fa)',
            border: '1px solid rgba(255, 255, 255, 0.85)',
            boxShadow: '0 10px 28px rgba(59, 130, 246, 0.35), inset 0 1.5px 1px rgba(255, 255, 255, 0.95)',
            color: '#0d1b30',
            cursor: 'pointer',
          }}
        >
          {concluido ? (
            <RotateCcw size={26} />
          ) : rodando ? (
            <Pause size={26} fill="currentColor" />
          ) : (
            <Play size={26} fill="currentColor" style={{ marginLeft: '3px' }} />
          )}
        </button>

        <div style={{ width: '50px', height: '50px' }} aria-hidden="true" />
      </footer>
    </main>
  )
}

export default Caverna