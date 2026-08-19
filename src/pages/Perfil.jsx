// Perfil.jsx — perfil do usuário com XP, ritmo e conquistas

import Navbar from '../components/Navbar'

const conquistas = [
  { id: 1, nome: 'Coruja',     desc: '10 sessões depois das 23h',          tempo: 'há 2 dias', desbloqueada: true  },
  { id: 2, nome: 'Fôlego',     desc: 'uma semana inteira sem quebrar st...', tempo: 'há 5 dias', desbloqueada: true  },
  { id: 3, nome: 'Cartógrafo', desc: '50 anotações organizadas pela IA',   tempo: 'faltam 3',  desbloqueada: false },
]

// Gera grid de ritmo — 12 semanas x 7 dias
const semanas = Array.from({ length: 12 }, (_, s) =>
  Array.from({ length: 7 }, (_, d) => {
    const rand = Math.random()
    if (rand > 0.85) return 4
    if (rand > 0.65) return 3
    if (rand > 0.45) return 2
    if (rand > 0.25) return 1
    return 0
  })
)
const intensidade = ['bg-[#111111]', 'bg-[#2d1f5e]', 'bg-[#4a3494]', 'bg-[#6b4fc8]', 'bg-[#8B5CF6]']
function Perfil() {
  const xpAtual = 2480
  const xpProximo = 3400
  const pct = (xpAtual / xpProximo) * 100

  return (
    <div className="min-h-screen bg-black text-white pb-32 px-4 max-w-sm mx-auto">

      {/* Avatar + nível */}
      <div className="flex flex-col items-center pt-12 pb-4">
        <div className="relative w-24 h-24 mb-3">
          {/* Anel de progresso SVG */}
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

        {/* XP */}
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
        {conquistas.map(({ id, nome, desc, tempo, desbloqueada }) => (
          <div key={id} className="bg-[#0a0a0c] border border-[#16161b] rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
              ${desbloqueada ? 'bg-[#1a1a1a]' : 'bg-[#0d0d0d] border border-[#1a1a1a]'}`}>
              {desbloqueada ? '★' : '◇'}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${!desbloqueada && 'text-[#a1a1aa]'}`}>{nome}</p>
              <p className="text-[#a1a1aa] text-xs mt-0.5">{desc}</p>
            </div>
            <span className="text-[#a1a1aa] text-xs flex-shrink-0">{tempo}</span>
          </div>
        ))}
      </div>

      <Navbar />
    </div>
  )
}

export default Perfil