import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const CONFETE_CORES = ['#8B5CF6', '#6366F1', '#22D3A0', '#a78bfa', '#34d399']
const CONFETES = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  delay: Math.random() * 0.4,
  dur: 0.9 + Math.random() * 0.6,
  size: 4 + Math.random() * 4,
  cor: CONFETE_CORES[Math.floor(Math.random() * CONFETE_CORES.length)],
  rot: Math.random() * 360,
  drift: (Math.random() - 0.5) * 80,
  shape: Math.random() > 0.5 ? 'rect' : 'circle',
}))

export default function Sucesso() {
  const navigate = useNavigate()
  const [go, setGo] = useState(false)
  const [confetes, setConfetes] = useState(false)

  useEffect(() => {
    const t0 = setTimeout(() => setGo(true), 80)
    const t1 = setTimeout(() => setConfetes(true), 950)
    return () => { clearTimeout(t0); clearTimeout(t1) }
  }, [])

  return (
    <div style={{
      minHeight: '100vh', background: '#000',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '0 28px 48px', maxWidth: 390,
      margin: '0 auto', fontFamily: 'Geist, sans-serif',
      position: 'relative', overflow: 'hidden',
    }}>
      <style>{`
        @keyframes drawCircle {
          from { stroke-dashoffset: 314; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes drawCheck {
          from { stroke-dashoffset: 1; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes fadeCheck {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fall {
          0%   { opacity: 1; transform: translateY(-10px) rotate(0deg) translateX(0); }
          100% { opacity: 0; transform: translateY(500px) rotate(var(--r)) translateX(var(--d)); }
        }

        .anel { stroke-dasharray: 314; stroke-dashoffset: 314; }
        .anel.go { animation: drawCircle 0.6s cubic-bezier(0.4,0,0.2,1) forwards; }

        .check { opacity: 0; stroke-dasharray: 1; stroke-dashoffset: 1; }
        .check.go {
          animation:
            fadeCheck 0.01s linear 0.52s forwards,
            drawCheck 0.38s cubic-bezier(0.6,0,0.35,1) 0.52s forwards;
        }

        .t1 { opacity:0; } .t1.go { animation: fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) 0.92s forwards; }
        .t2 { opacity:0; } .t2.go { animation: fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) 1.02s forwards; }
        .t3 { opacity:0; } .t3.go { animation: fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) 1.12s forwards; }
        .t4 { opacity:0; } .t4.go { animation: fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) 1.26s forwards; }
      `}</style>

      {/* Confetes */}
      {confetes && CONFETES.map(({ id, x, delay, dur, size, cor, rot, drift, shape }) => (
        <div key={id} style={{
          position: 'fixed', top: 0, left: `${x}%`,
          width: size, height: shape === 'rect' ? size * 0.4 : size,
          borderRadius: shape === 'circle' ? '50%' : 2,
          background: cor, opacity: 0, pointerEvents: 'none', zIndex: 20,
          '--r': `${rot}deg`, '--d': `${drift}px`,
          animation: `fall ${dur}s ease-in ${delay}s forwards`,
        }} />
      ))}

      {/* Anel — Face ID style */}
      <div style={{ marginBottom: 52 }}>
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="#8B5CF6" />
              <stop offset="50%"  stopColor="#6366F1" />
              <stop offset="100%" stopColor="#22D3A0" />
            </linearGradient>
          </defs>

          {/* Trilha */}
          <circle cx="60" cy="60" r="50" stroke="#111" strokeWidth="2.5" fill="none" />

          {/* Anel desenhado */}
          <circle
            className={`anel ${go ? 'go' : ''}`}
            cx="60" cy="60" r="50"
            stroke="url(#g)" strokeWidth="2.5"
            fill="none" strokeLinecap="round"
            transform="rotate(-90 60 60)"
          />

          {/* Check dentro do anel — aparece ao terminar */}
          <path
            className={`check ${go ? 'go' : ''}`}
            d="M38 62L52 76L82 44"
            stroke="url(#g)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength="1"
          />
        </svg>
      </div>

      {/* Texto — sempre no DOM, só opacity muda */}
      <div style={{ width: '100%', textAlign: 'center' }}>
        <p className={`t1 ${go ? 'go' : ''}`} style={{
          fontSize: 10, letterSpacing: '0.22em',
          color: '#22D3A0', textTransform: 'uppercase', marginBottom: 12,
        }}>
          PRO ATIVADO
        </p>

        <h1 className={`t2 ${go ? 'go' : ''}`} style={{
          fontSize: 26, fontWeight: 600, color: '#f4f4f5',
          lineHeight: 1.25, marginBottom: 10,
        }}>
          Sem limites agora.{' '}
          <em style={{ fontFamily: 'Instrument Serif, serif', fontWeight: 400, color: '#a78bfa' }}>
            De verdade.
          </em>
        </h1>

        <p className={`t3 ${go ? 'go' : ''}`} style={{
          fontSize: 14, color: '#a1a1aa', lineHeight: 1.65,
          maxWidth: 270, margin: '0 auto 40px',
        }}>
          Obrigado por confiar no StudyOS. Kira tá aqui, sem freio, sempre que você precisar.
        </p>

        <div className={`t4 ${go ? 'go' : ''}`}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              width: '100%', padding: '15px 0', borderRadius: 18,
              background: 'linear-gradient(135deg, #8B5CF6, #6366F1 55%, #22D3A0)',
              border: 'none', cursor: 'pointer',
              fontSize: 15, fontWeight: 600, color: '#fff',
              marginBottom: 14, fontFamily: 'Geist, sans-serif',
            }}
          >
            Ir estudar
          </button>
          <p style={{ fontSize: 11, color: '#3f3f46' }}>
            Estudantes PRO terminam 2× mais rápido. Só isso.
          </p>
        </div>
      </div>
    </div>
  )
}