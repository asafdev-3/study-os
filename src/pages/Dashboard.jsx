// Dashboard.jsx — redesign estilo Pierre

import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'

const plano = [
  { id: 1, tarefa: 'Ler resumo de História',       tempo: '20 min', feito: true  },
  { id: 2, tarefa: 'Refazer exercícios de Física',  tempo: '35 min', feito: true  },
  { id: 3, tarefa: 'Revisar flashcards de Inglês',  tempo: '15 min', feito: true  },
  { id: 4, tarefa: 'Flashcards de Química',         tempo: '20 min', feito: false },
  { id: 5, tarefa: 'Diário rápido de estudos',      tempo: '5 min',  feito: false },
]

function Dashboard() {
  const navigate = useNavigate()
  const scrollRef = useRef(null)
  const feitos = plano.filter(t => t.feito).length

  const { scrollY } = useScroll({ container: scrollRef })

  const heroHeight = useTransform(scrollY, [0, 180], [260, 100])
  const heroOpacity = useTransform(scrollY, [0, 140], [1, 0])
  const heroScale  = useTransform(scrollY, [0, 180], [1, 1.06])
  const cardY      = useTransform(scrollY, [0, 180], [0, -40])

  return (
    <div
      ref={scrollRef}
      className="h-screen overflow-y-auto bg-black text-white max-w-sm mx-auto relative"
      style={{ scrollbarWidth: 'none' }}
    >

      {/* ── HERO ── */}
      <motion.div
        style={{ height: heroHeight }}
        className="relative overflow-hidden flex-shrink-0"
      >
        <motion.div
          style={{ scale: heroScale, opacity: heroOpacity }}
          className="absolute inset-0"
        >
          <div
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse 80% 60% at 20% 40%, rgba(139,92,246,0.55) 0%, transparent 65%),
                radial-gradient(ellipse 60% 50% at 80% 30%, rgba(34,211,160,0.35) 0%, transparent 60%),
                radial-gradient(ellipse 50% 70% at 50% 80%, rgba(99,102,241,0.3) 0%, transparent 55%),
                #000
              `,
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              backgroundSize: '128px',
            }}
          />
          {[...Array(18)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: i % 3 === 0 ? 2 : 1,
                height: i % 3 === 0 ? 2 : 1,
                top: `${8 + (i * 17) % 70}%`,
                left: `${5 + (i * 23) % 90}%`,
                opacity: 0.15 + (i % 5) * 0.07,
              }}
            />
          ))}
        </motion.div>

        <div
          className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, #000)' }}
        />

        {/* Avatar esquerda */}
        <motion.button
          style={{ opacity: heroOpacity }}
          onClick={() => navigate('/perfil')}
          className="absolute top-14 left-5 w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
          style={{
            background: 'linear-gradient(135deg, #8B5CF6, #22D3A0)',
            opacity: heroOpacity,
          }}
        >
          AV
        </motion.button>

        {/* Texto hero */}
        <motion.div
          style={{ opacity: heroOpacity }}
          className="absolute bottom-8 left-5 right-5"
        >
          <p className="text-[#a1a1aa] text-[10px] tracking-[0.2em] uppercase mb-1">
            Seg · 08 set
          </p>
          <h1 className="text-[32px] font-semibold leading-tight">
            Boa noite,{' '}
            <em style={{ fontFamily: 'Instrument Serif, serif', fontWeight: 400 }}>
              Asaf
            </em>
          </h1>
        </motion.div>
      </motion.div>

      {/* ── CONTEÚDO ── */}
      <motion.div
        style={{ y: cardY }}
        className="relative z-10 px-4 pb-32"
      >

        {/* Card Kira */}
        <div
          className="relative rounded-2xl p-[1px] mb-5"
          style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1, #22D3A0)' }}
        >
          <div className="bg-[#0a0a0c] rounded-2xl p-5">
            <p className="text-[10px] tracking-[0.2em] text-[#a1a1aa] uppercase mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#22D3A0] inline-block" />
              KIRA OBSERVOU ALGO
            </p>
            <p className="text-[17px] font-medium leading-snug mb-2">
              Você revisou{' '}
              <em style={{ fontFamily: 'Instrument Serif, serif' }}>Química</em>
              {' '}três vezes esta semana. Amanhã tem prova.
            </p>
            <p className="text-[#a1a1aa] text-sm mb-5">
              Que tal 20 min de flashcards antes de dormir?
            </p>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 bg-[#f4f4f5] text-black text-sm font-medium px-4 py-2 rounded-xl">
                ⚡ Começar agora
              </button>
              <button className="text-sm text-[#a1a1aa] border border-[#26262e] px-4 py-2 rounded-xl">
                Depois
              </button>
            </div>
          </div>
        </div>

        {/* Continue de onde parou */}
        <p className="text-[#a1a1aa] text-[10px] tracking-widest uppercase mb-3">Continue de onde parou</p>
        <div className="bg-[#0a0a0c] border border-[#16161b] rounded-2xl p-4 flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#16161b] rounded-xl flex items-center justify-center text-base">📄</div>
            <div>
              <p className="text-sm font-medium">Reações de oxirredução — ca...</p>
              <p className="text-[#a1a1aa] text-xs mt-0.5">Química · lida há 4h · 3 min restantes</p>
            </div>
          </div>
          <span className="text-[#a1a1aa] text-lg">›</span>
        </div>

        {/* Plano da noite */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-[#a1a1aa] text-[10px] tracking-widest uppercase">Plano da noite</p>
          <p className="text-[#a1a1aa] text-xs">{feitos} de {plano.length}</p>
        </div>
        <div className="flex flex-col gap-2 mb-6">
          {plano.map(({ id, tarefa, tempo, feito }) => (
            <div
              key={id}
              className="flex items-center justify-between bg-[#0a0a0c] border border-[#16161b] rounded-xl px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0
                  ${feito ? 'bg-violet-600 border-violet-600' : 'border-[#26262e]'}`}>
                  {feito && <span className="text-white text-[10px]">✓</span>}
                </div>
                <span className={`text-sm ${feito ? 'line-through text-[#a1a1aa]' : 'text-[#f4f4f5]'}`}>
                  {tarefa}
                </span>
              </div>
              <span className="text-[#a1a1aa] text-xs ml-3 flex-shrink-0">{tempo}</span>
            </div>
          ))}
        </div>

        <p className="text-[#26262e] text-xs text-center">
          ✦ seu pico de foco costuma ser entre 23h e 01h
        </p>
      </motion.div>
    </div>
  )
}

export default Dashboard