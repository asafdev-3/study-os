// Dashboard.jsx — tela principal do StudyOS
// Fontes: Geist (sistema), Instrument Serif (NYX), Geist Mono (números)


const plano = [
  { id: 1, tarefa: 'Ler resumo de História',      tempo: '20 min', feito: true  },
  { id: 2, tarefa: 'Refazer exercícios de Física', tempo: '35 min', feito: true  },
  { id: 3, tarefa: 'Revisar flashcards de Inglês', tempo: '15 min', feito: true  },
  { id: 4, tarefa: 'Flashcards de Química',        tempo: '20 min', feito: false },
  { id: 5, tarefa: 'Diário rápido de estudos',     tempo: '5 min',  feito: false },
]

function Dashboard() {
  const feitos = plano.filter(t => t.feito).length


  return (
    <div className="min-h-screen bg-black text-white pb-28 px-5 max-w-sm mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between pt-12 pb-6">
        <div>
          <p className="text-[#a1a1aa] text-xs tracking-widest uppercase mb-1">Qua · 23:47</p>
          <h1 style={{ fontFamily: 'Geist, sans-serif' }} className="text-[28px] font-semibold leading-tight">
            Boa noite, <em style={{ fontFamily: 'Instrument Serif, serif', fontWeight: 400 }}>Asaf</em>
          </h1>
        </div> 
        <div className="w-10 h-10" />
      </div>

      {/* Card NYX — borda gradiente */}
      <div className="relative rounded-2xl p-[1px] mb-6"
        style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1, #22D3A0)' }}>
        <div className="bg-[#0a0a0c] rounded-2xl p-5">
          <p className="text-[10px] tracking-[0.2em] text-[#a1a1aa] uppercase mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#22D3A0] inline-block" />
            NYX OBSERVOU ALGO
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

      {/* Métricas — 2 cards sem streak */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-[#0a0a0c] border border-[#16161b] rounded-2xl p-4">
          <p className="text-[#a1a1aa] text-[10px] tracking-widest uppercase mb-3">Foco Hoje</p>
          <p style={{ fontFamily: 'Geist Mono, monospace' }} className="text-4xl font-medium leading-none">
            1h <span className="text-2xl">42</span>
            <span className="text-[#a1a1aa] text-sm ml-1">min</span>
          </p>
          <p className="text-[#22D3A0] text-xs mt-2">+18%</p>
        </div>
        <div className="bg-[#0a0a0c] border border-[#16161b] rounded-2xl p-4">
          <p className="text-[#a1a1aa] text-[10px] tracking-widest uppercase mb-3">XP Hoje</p>
          <p style={{ fontFamily: 'Geist Mono, monospace' }} className="text-4xl font-medium leading-none">
            +240 <span className="text-[#a1a1aa] text-sm">xp</span>
          </p>
        </div>
      </div>

      {/* Continue de onde parou */}
      <p className="text-[#a1a1aa] text-[10px] tracking-widest uppercase mb-3">Continue de onde parou</p>
      <div className="bg-[#0a0a0c] border border-[#16161b] rounded-2xl p-4 flex items-center justify-between mb-6">
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
      <div className="flex flex-col gap-2 mb-5">
        {plano.map(({ id, tarefa, tempo, feito }) => (
          <div key={id} className="flex items-center justify-between bg-[#0a0a0c] border border-[#16161b] rounded-xl px-4 py-3">
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

      {/* Dica */}
      <p className="text-[#26262e] text-xs text-center">
        ✦ seu pico de foco costuma ser entre 23h e 01h
      </p>

    </div>
  )
}

export default Dashboard