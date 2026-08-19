// Lembretes.jsx — post-its por matéria

import { useState } from 'react'
import { Plus, Check } from 'lucide-react'

const filtros = ['Todos', 'Hoje', 'Semana', 'Sem prazo']

const postits = [
  { id: 1, materia: 'QUÍMICA',  cor: '#A8D8D8', texto: 'Refazer exercícios pág. 118', prazo: 'amanhã · 08:00', feito: false },
  { id: 2, materia: 'HISTÓRIA', cor: '#F5D08A', texto: 'Ler capítulo Guerra Fria',     prazo: 'quinta · noite',  feito: false },
  { id: 3, materia: 'INGLÊS',   cor: '#C5B8E8', texto: '20 flashcards phrasal verbs',  prazo: 'hoje · 23:00',   feito: false },
  { id: 4, materia: 'CÁLCULO',  cor: '#C8E6A0', texto: 'Lista 4 — derivadas',          prazo: 'sexta',          feito: false },
  { id: 5, materia: 'VIDA',     cor: '#F4A8A8', texto: 'Levar caderno pra mostra',     prazo: 'sáb · 14h',      feito: false },
  { id: 6, materia: 'FÍSICA',   cor: '#F4A8A8', texto: 'Ver vídeo do MHS',             prazo: 'quando der',     feito: true  },
]

function Lembretes() {
  const [ativo, setAtivo] = useState('Todos')
  const [itens, setItens] = useState(postits)

  function toggleFeito(id) {
    setItens(prev => prev.map(p => p.id === id ? { ...p, feito: !p.feito } : p))
  }

  return (
    <div className="min-h-screen bg-black text-white pb-32 px-4 max-w-sm mx-auto">

      {/* Header */}
      <div className="flex items-end justify-between pt-12 pb-1">
        <div>
          <h1 className="text-3xl font-semibold">Post-its</h1>
          <p style={{ fontFamily: 'Instrument Serif, serif' }} className="text-[#a1a1aa] text-sm italic mt-0.5">
            cole na parede da sua noite
          </p>
        </div>
        <span className="text-[#a1a1aa] text-xs mb-1">{itens.filter(i => !i.feito).length} abertos</span>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mt-4 mb-5">
        {filtros.map(f => (
          <button
            key={f}
            onClick={() => setAtivo(f)}
            className={`px-3 py-1.5 rounded-full text-xs border transition
              ${ativo === f ? 'bg-white text-black border-white' : 'text-[#a1a1aa] border-[#26262e]'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grid post-its */}
      <div className="grid grid-cols-2 gap-3">
        {itens.map(({ id, materia, cor, texto, prazo, feito }) => (
          <div
            key={id}
            className="relative rounded-2xl p-4 flex flex-col justify-between min-h-[160px]"
            style={{ 
               backgroundColor: cor,
              transform: `rotate(${id % 2 === 0 ? (id * 0.8) : -(id * 0.7)}deg)`,
            }}
            >
            {/* Clipe de papel */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-4 bg-black/20 rounded-sm" />

            <div>
              <p className="text-[10px] tracking-widest text-black/50 uppercase mb-2">{materia}</p>
              <p className={`text-sm font-medium text-black leading-snug ${feito ? 'line-through opacity-50' : ''}`}>
                {texto}
              </p>
            </div>

            <div className="flex items-center justify-between mt-4">
              <p className="text-[10px] text-black/50">{prazo}</p>
              <button
                onClick={() => toggleFeito(id)}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition
                  ${feito ? 'bg-black/30 border-black/30' : 'border-black/30 bg-transparent'}`}
              >
                {feito && <Check size={12} className="text-black" />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Dica NFC */}
      <p className="text-[#a1a1aa] text-[10px] text-center mt-5">
        — aproxime o celular do NFC pra colar um post-it rapidinho
      </p>

      {/* FAB */}
      <button
        className="fixed bottom-24 right-6 w-12 h-12 rounded-full flex items-center justify-center shadow-xl"
        style={{ background: 'linear-gradient(135deg, #8B5CF6, #22D3A0)' }}
      >
        <Plus size={22} className="text-white" />
      </button>

    </div>
  )
}

export default Lembretes