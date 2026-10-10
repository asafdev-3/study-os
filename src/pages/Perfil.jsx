import { useState } from 'react'
import { X } from 'lucide-react'

const conquistas = [
  {
    id: 1,
    emoji: '🦉',
    nome: 'Coruja',
    desc: '10 sessões depois das 23h',
    detalhe: 'Você completou 10 sessões de estudo após as 23h. Seu pico de foco é noturno — use isso a seu favor.',
    tempo: 'há 2 dias',
    desbloqueada: true,
  },
  {
    id: 2,
    emoji: '🔥',
    nome: 'Fôlego',
    desc: 'Uma semana inteira sem quebrar sequência',
    detalhe: 'Sete dias consecutivos de estudo sem falhar. Consistência é a habilidade mais rara.',
    tempo: 'há 5 dias',
    desbloqueada: true,
  },
  {
    id: 3,
    emoji: '🗺️',
    nome: 'Cartógrafo',
    desc: '50 anotações organizadas pela IA',
    detalhe: 'Organize 50 anotações com a ajuda da Kira para desbloquear. Você está a 3 de lá.',
    tempo: 'faltam 3',
    desbloqueada: false,
  },
]

const semanas = Array.from({ length: 12 }, (_, s) =>
  Array.from({ length: 7 }, (_, d) => {
    const val = ((s * 7 + d) * 2654435761) % 100
    if (val > 85) return 4
    if (val > 65) return 3
    if (val > 45) return 2
    if (val > 25) return 1
    return 0
  })
)

const intensidade = ['bg-[#111111]', 'bg-[#2d1f5e]', 'bg-[#4a3494]', 'bg-[#6b4fc8]', 'bg-[#8B5CF6]']

function ModalConquista({ conquista, onClose }) {
  const [visivel, setVisivel] = useState(true)

  function fechar() {
    setVisivel(false)
    setTimeout(onClose, 200)
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50"
        style={{
          background: 'rgba(0,0,0,0.72)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          opacity: visivel ? 1 : 0,
          transition: 'opacity 200ms ease',
        }}
        onClick={fechar}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center px-6 pointer-events-none">
        <div
          className="w-full max-w-sm pointer-events-auto"
          style={{
            background: 'rgba(16,16,20,0.97)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '28px',
            boxShadow: '0 30px 80px rgba(0,0,0,0.8)',
            opacity: visivel ? 1 : 0,
            transform: visivel ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.96)',
            transition: 'opacity 220ms cubic-bezier(.22,1,.36,1), transform 260ms cubic-bezier(.22,1,.36,1)',
          }}
        >
          {/* header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#1f1f27]">
            <span className="text-xs tracking-[0.2em] text-zinc-500 uppercase">Conquista</span>
            <button onClick={fechar} className="text-zinc-600 hover:text-zinc-400 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* corpo */}
          <div className="px-5 py-6 flex flex-col items-center text-center">
            {/* ícone */}
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-4"
              style={{
                background: conquista.desbloqueada
                  ? 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(34,211,160,0.10))'
                  : 'rgba(255,255,255,0.03)',
                border: conquista.desbloqueada
                  ? '1px solid rgba(139,92,246,0.3)'
                  : '1px solid rgba(255,255,255,0.06)',
                filter: conquista.desbloqueada ? 'none' : 'grayscale(1) opacity(0.4)',
              }}
            >
              {conquista.emoji}
            </div>

            {/* badge */}
            {conquista.desbloqueada ? (
              <span className="text-[10px] tracking-[0.2em] text-[#22D3A0] uppercase mb-2">
                ✦ Desbloqueada · {conquista.tempo}
              </span>
            ) : (
              <span className="text-[10px] tracking-[0.2em] text-zinc-600 uppercase mb-2">
                ◇ Bloqueada · {conquista.tempo}
              </span>
            )}

            <h2 className="text-xl font-semibold mb-1">{conquista.nome}</h2>
            <p className="text-zinc-500 text-sm mb-4">{conquista.desc}</p>
            <p className="text-zinc-400 text-sm leading-relaxed">{conquista.detalhe}</p>
          </div>

          {/* footer */}
          <div className="px-5 pb-6">
            <button
              onClick={fechar}
              className="w-full py-3 rounded-2xl text-sm font-medium transition-all"
              style={{
                background: conquista.desbloqueada
                  ? 'linear-gradient(135deg, #8B5CF6, #6366F1)'
                  : 'rgba(255,255,255,0.05)',
                color: conquista.desbloqueada ? '#fff' : '#a1a1aa',
              }}
            >
              {conquista.desbloqueada ? 'Compartilhar conquista' : 'Entendido'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function Perfil() {
  const [conquistaSelecionada, setConquistaSelecionada] = useState(null)

  const xpAtual = 2480
  const xpProximo = 3400
  const pct = (xpAtual / xpProximo) * 100

  return (
    <div className="min-h-screen bg-black text-white pb-32 px-4 max-w-sm mx-auto">

      {/* Avatar + nível */}
      <div className="flex flex-col items-center pt-12 pb-4">
        <div className="relative w-24 h-24 mb-3">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="44" fill="none" stroke="#1a1a1a" strokeWidth="6" />
            <circle cx="48" cy="48" r="44" fill="none"
              stroke="url(#grad)" strokeWidth="6"
              strokeDasharray={`${2 * Math.PI * 44}`}
              strokeDashoffset={`${2 * Math.PI * 44 * (1 - pct / 100)}`}
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#22D3A0" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-semibold">AV</span>
            <span className="text-[#a1a1aa] text-[9px] tracking-widest">NÍVEL</span>
            <span className="text-xs font-medium">07</span>
          </div>
        </div>

        <h1 className="text-2xl font-semibold">Asaf</h1>
        <p className="text-[#a1a1aa] text-xs tracking-widest mt-0.5">@VITOR · NOTURNO</p>

        <p className="text-[#a1a1aa] text-xs mt-3">
          <span style={{ fontFamily: 'Geist Mono, monospace' }} className="text-white">2 480</span>
          {' '}/ 3 400 xp
          <span className="text-[#26262e] mx-2">·</span>
          faltam 920 pro nível 8
        </p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {[
          { icon: '◎', valor: '12', label: 'DIAS\nSEGUIDOS' },
          { icon: '⚡', valor: '47', label: 'SESSÕES' },
          { icon: '△', valor: '18', label: 'ÁRVORES\nPLANTADAS' },
        ].map(({ icon, valor, label }) => (
          <div key={label} className="bg-[#0a0a0c] border border-[#16161b] rounded-2xl p-4 flex flex-col gap-1">
            <span className="text-[#a1a1aa] text-sm">{icon}</span>
            <span style={{ fontFamily: 'Geist Mono, monospace' }} className="text-3xl font-medium">{valor}</span>
            <span className="text-[#a1a1aa] text-[9px] tracking-widest whitespace-pre-line">{label}</span>
          </div>
        ))}
      </div>

      {/* Ritmo */}
      <p className="text-[#a1a1aa] text-[10px] tracking-widest uppercase mb-3">Seu ritmo · últimas 12 semanas</p>
      <div className="bg-[#0a0a0c] border border-[#16161b] rounded-2xl p-4 mb-6">
        <div className="flex gap-1">
          {semanas.map((semana, s) => (
            <div key={s} className="flex flex-col gap-1">
              {semana.map((nivel, d) => (
                <div key={d} className={`w-4 h-4 rounded-sm ${intensidade[nivel]}`} />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-[#a1a1aa] text-[10px]">menos</span>
          <div className="flex gap-1">
            {intensidade.map((c, i) => (
              <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
            ))}
          </div>
          <span className="text-[#a1a1aa] text-[10px]">mais</span>
        </div>
      </div>

      {/* Conquistas */}
      <p className="text-[#a1a1aa] text-[10px] tracking-widest uppercase mb-3">Conquistas recentes</p>
      <div className="flex flex-col gap-2">
        {conquistas.map((conquista) => (
          <button
            key={conquista.id}
            onClick={() => setConquistaSelecionada(conquista)}
            className="bg-[#0a0a0c] border border-[#16161b] rounded-2xl px-4 py-3 flex items-center gap-3 text-left w-full transition-all active:scale-[0.98]"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg
              ${conquista.desbloqueada ? 'bg-[#1a1a1a]' : 'bg-[#0d0d0d] border border-[#1a1a1a] opacity-40'}`}>
              {conquista.emoji}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${!conquista.desbloqueada && 'text-[#a1a1aa]'}`}>{conquista.nome}</p>
              <p className="text-[#a1a1aa] text-xs mt-0.5">{conquista.desc}</p>
            </div>
            <span className="text-[#a1a1aa] text-xs flex-shrink-0">{conquista.tempo}</span>
          </button>
        ))}
      </div>

      {/* Modal */}
      {conquistaSelecionada && (
        <ModalConquista
          conquista={conquistaSelecionada}
          onClose={() => setConquistaSelecionada(null)}
        />
      )}
    </div>
  )
}

export default Perfil