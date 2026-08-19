// Anotacoes.jsx — lista de anotações com OCR via câmera

import { useState } from 'react'
import { Search, Camera, Sparkles } from 'lucide-react'
import Navbar from '../components/Navbar'

const materias = ['Tudo', 'Química', 'Cálculo', 'História', 'Inglês', 'Física']

const notas = [
  {
    id: 1, materia: 'QUÍMICA', cor: '#4ADE80',
    titulo: 'Oxirredução',
    preview: 'NOX, agente redutor vs oxidante. Sempre: quem perde elétron oxida…',
    tempo: '1d'
  },
  {
    id: 2, materia: 'HISTÓRIA', cor: '#FBBF24',
    titulo: 'Guerra Fria',
    preview: '1947–1991. Blocos. Doutrina Truman ↔ Plano Marshall.',
    tempo: '1d'
  },
  {
    id: 3, materia: 'INGLÊS', cor: '#A78BFA',
    titulo: 'Phrasal Verbs',
    preview: 'set aside, set out to…',
    tempo: '3d'
  },
  {
    id: 4, materia: 'CÁLCULO', cor: '#60A5FA',
    titulo: 'Regra do produto',
    preview: '(fg)\' = f\'g + fg\'',
    tempo: 'agora'
  },
  {
    id: 5, materia: 'FÍSICA', cor: '#F87171',
    titulo: 'MHS',
    preview: 'pêndulo simples, T = 2π√(L/g)',
    tempo: '3d'
  },
]

function Anotacoes() {
  const [ativa, setAtiva] = useState('Tudo')
  const [tooltip, setTooltip] = useState(false)

  const filtradas = ativa === 'Tudo' ? notas : notas.filter(n => n.materia.toLowerCase() === ativa.toLowerCase())

  return (
    <div className="min-h-screen bg-black text-white pb-32 px-4 max-w-sm mx-auto">

      {/* Header */}
      <div className="flex items-end justify-between pt-12 pb-4">
        <h1 className="text-3xl font-semibold">Anotações</h1>
        <span className="text-[#a1a1aa] text-xs mb-1">47 no total</span>
      </div>

      {/* Busca */}
      <div className="flex items-center bg-[#0a0a0c] border border-[#16161b] rounded-xl px-4 py-3 gap-3 mb-5">
        <Search size={15} className="text-[#a1a1aa]" />
        <input
          placeholder="buscar em todas as anotações..."
          className="bg-transparent text-sm text-white outline-none w-full placeholder-[#a1a1aa]"
        />
        <span className="text-[#a1a1aa] text-xs border border-[#26262e] rounded px-1.5 py-0.5">⌘K</span>
      </div>

      {/* Capturada agora */}
      <p className="text-[#a1a1aa] text-[10px] tracking-widest uppercase mb-3">Capturada agora</p>
      <div className="bg-[#0a0a0c] border border-[#16161b] rounded-2xl p-4 flex gap-4 mb-5">
        <div className="w-20 h-20 bg-[#16161b] rounded-xl flex-shrink-0 flex items-center justify-center text-[10px] text-[#a1a1aa] text-center px-1">
          caderno foto
        </div>
        <div className="flex flex-col justify-between">
          <div>
            <p className="text-[10px] text-[#4ADE80] tracking-widest mb-1">● CÁLCULO · RECONHECIDO</p>
            <p style={{ fontFamily: 'Instrument Serif, serif' }} className="text-base italic">Regra do produto</p>
            <p style={{ fontFamily: 'Geist Mono, monospace' }} className="text-sm mt-1">(fg)' = f'g + fg'</p>
          </div>
          <p className="text-[#a1a1aa] text-xs flex items-center gap-1">
            <Sparkles size={11} /> Nyx sugere 4 flashcards
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
        {materias.map(m => (
          <button
            key={m}
            onClick={() => setAtiva(m)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm border transition
              ${ativa === m
                ? 'bg-white text-black border-white'
                : 'bg-transparent text-[#a1a1aa] border-[#26262e]'}`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Grid de notas */}
      <div className="columns-2 gap-3">
        {filtradas.map(({ id, materia, cor, titulo, preview, tempo }) => (
          <div key={id} className="bg-[#0a0a0c] border border-[#16161b] rounded-2xl p-4 mb-3 break-inside-avoid">
            <p className="text-[10px] tracking-widest mb-2 flex items-center gap-1" style={{ color: cor }}>
              ● {materia}
            </p>
            <p className="text-sm font-medium mb-1">{titulo}</p>
            <p className="text-[#a1a1aa] text-xs leading-relaxed">{preview}</p>
            <p className="text-[#26262e] text-[10px] mt-3">{tempo}</p>
          </div>
        ))}
      </div>

      {/* FAB câmera — canto inferior direito */}
      <div className="fixed bottom-24 right-6 flex flex-col items-end gap-2">
        {tooltip && (
          <div className="bg-[#1a1a1a] border border-[#26262e] rounded-2xl px-4 py-3 text-sm text-white flex items-center gap-2 shadow-xl">
            <Sparkles size={14} className="text-violet-400" />
            Mandar foto do exercício
          </div>
        )}
        <button
          onClick={() => setTooltip(!tooltip)}
          style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1, #22D3A0)', padding: '2px' }}
          className="w-14 h-14 rounded-full"
        >
          <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
            <Camera size={22} className="text-white" />
          </div>
        </button>
      </div>

      <Navbar />
    </div>
  )
}

export default Anotacoes