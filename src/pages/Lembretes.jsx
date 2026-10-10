import { useState, useRef, useEffect } from 'react'
import { Plus, Check, X, StickyNote, Clock3 } from 'lucide-react'

const filtros = ['Todos', 'Hoje', 'Semana', 'Sem prazo']
const materiasForm = ['Química', 'Cálculo', 'História', 'Inglês', 'Física', 'Vida']

const coresMaterias = {
  Química: '#A8D8D8',
  História: '#F5D08A',
  Inglês: '#C5B8E8',
  Cálculo: '#C8E6A0',
  Vida: '#F4A8A8',
  Física: '#F4A8A8',
}

const postits = [
  {
    id: 1,
    materia: 'QUÍMICA',
    cor: '#A8D8D8',
    texto: 'Refazer exercícios pág. 118',
    prazo: 'amanhã · 08:00',
    feito: false,
  },
  {
    id: 2,
    materia: 'HISTÓRIA',
    cor: '#F5D08A',
    texto: 'Ler capítulo Guerra Fria',
    prazo: 'quinta · noite',
    feito: false,
  },
  {
    id: 3,
    materia: 'INGLÊS',
    cor: '#C5B8E8',
    texto: '20 flashcards phrasal verbs',
    prazo: 'hoje · 23:00',
    feito: false,
  },
  {
    id: 4,
    materia: 'CÁLCULO',
    cor: '#C8E6A0',
    texto: 'Lista 4 — derivadas',
    prazo: 'sexta',
    feito: false,
  },
  {
    id: 5,
    materia: 'VIDA',
    cor: '#F4A8A8',
    texto: 'Levar caderno pra mostra',
    prazo: 'sáb · 14h',
    feito: false,
  },
  {
    id: 6,
    materia: 'FÍSICA',
    cor: '#F4A8A8',
    texto: 'Ver vídeo do MHS',
    prazo: 'quando der',
    feito: true,
  },
]

function ModalNovoPostit({ onClose }) {
  const [texto, setTexto] = useState('')
  const [materia, setMateria] = useState(null)
  const [prazo, setPrazo] = useState('')
  const [visivel, setVisivel] = useState(false)

  const textoRef = useRef(null)

  useEffect(() => {
    requestAnimationFrame(() => {
      setVisivel(true)
    })

    setTimeout(() => {
      textoRef.current?.focus()
    }, 300)
  }, [])

  function fechar() {
    setVisivel(false)

    setTimeout(() => {
      onClose()
    }, 180)
  }

  function handleSalvar() {
    if (!texto.trim()) return
    fechar()
  }

  const corAtual = materia
    ? coresMaterias[materia]
    : '#8B5CF6'

  const habilitado = texto.trim().length > 0

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{
        opacity: visivel ? 1 : 0,
        transition: 'opacity 180ms ease',
      }}
    >
      {/* BACKDROP */}
      <div
        className="absolute inset-0"
        onClick={fechar}
        style={{
          background: 'rgba(0,0,0,0.68)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          zIndex: 0,
        }}
      />

      {/* GLOW */}
      <div
        className="absolute w-[260px] h-[260px] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(139,92,246,.13), transparent 68%)',
          filter: 'blur(25px)',
          zIndex: 1,
        }}
      />

      {/* MODAL */}
      <div
        className="
          relative
          w-full
          max-w-[370px]
          rounded-[28px]
          border border-white/[0.08]
          overflow-hidden
        "
        style={{
          zIndex: 10,
          pointerEvents: 'auto',

          background: 'rgba(12,12,15,0.97)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',

          boxShadow:
            '0 30px 90px rgba(0,0,0,.75), inset 0 1px 0 rgba(255,255,255,.05)',

          opacity: visivel ? 1 : 0,

          transform: visivel
            ? 'translateY(0) scale(1)'
            : 'translateY(12px) scale(.965)',

          transition:
            'opacity 220ms cubic-bezier(.22,1,.36,1), transform 260ms cubic-bezier(.22,1,.36,1)',
        }}
      >

        {/* HEADER */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div>
            <p className="text-sm font-medium text-white">
              Novo post-it
            </p>

            <p className="text-[10px] text-zinc-600 mt-1">
              algo que você não pode esquecer
            </p>
          </div>

          <button
            type="button"
            onClick={fechar}
            className="
              w-8 h-8
              rounded-full
              flex items-center justify-center
              bg-white/[0.04]
              border border-white/[0.06]
              text-zinc-500
            "
          >
            <X size={15} />
          </button>
        </div>

        <div className="h-px bg-white/[0.05]" />

        {/* PREVIEW */}
        <div className="px-5 pt-5">
          <div
            className="rounded-[20px] p-4 min-h-[110px]"
            style={{
              background: materia
                ? `${coresMaterias[materia]}12`
                : 'rgba(255,255,255,.025)',

              border: `1px solid ${
                materia
                  ? `${coresMaterias[materia]}30`
                  : 'rgba(255,255,255,.055)'
              }`,
            }}
          >
            {materia && (
              <p
                className="text-[9px] tracking-[0.18em] uppercase mb-2"
                style={{
                  color: coresMaterias[materia],
                }}
              >
                ● {materia}
              </p>
            )}

            <p className="text-[15px] text-white leading-relaxed">
              {texto || (
                <span className="text-zinc-700">
                  seu lembrete aparece aqui...
                </span>
              )}
            </p>

            {prazo && (
              <p className="text-[10px] text-zinc-500 mt-4">
                {prazo}
              </p>
            )}
          </div>
        </div>

        {/* MATÉRIA */}
        <div className="px-5 pt-4">
          <p className="text-[9px] text-zinc-600 tracking-[0.18em] uppercase mb-2">
            Matéria
          </p>

          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            {materiasForm.map(m => {
              const selecionada = materia === m

              return (
                <button
                  type="button"
                  key={m}
                  onClick={() =>
                    setMateria(selecionada ? null : m)
                  }
                  className="
                    flex-shrink-0
                    px-3 py-1.5
                    rounded-full
                    text-[11px]
                  "
                  style={{
                    background: selecionada
                      ? `${coresMaterias[m]}16`
                      : 'rgba(255,255,255,.025)',

                    border: `1px solid ${
                      selecionada
                        ? `${coresMaterias[m]}65`
                        : 'rgba(255,255,255,.06)'
                    }`,

                    color: selecionada
                      ? coresMaterias[m]
                      : '#71717a',
                  }}
                >
                  {m}
                </button>
              )
            })}
          </div>
        </div>

        {/* INPUT */}
        <div className="px-5 pt-4">
          <textarea
            ref={textoRef}
            value={texto}
            onChange={e => setTexto(e.target.value)}
            placeholder="O que precisa lembrar?"
            className="
              w-full
              h-[82px]
              resize-none
              rounded-2xl
              bg-white/[0.025]
              border border-white/[0.06]
              px-4 py-3
              text-[16px]
              text-white
              outline-none
              placeholder:text-zinc-700
              focus:border-violet-500/40
              transition
            "
            style={{
              WebkitAppearance: 'none',
              touchAction: 'manipulation',
            }}
          />

          <div className="flex justify-end mt-1.5">
            <span className="text-[9px] text-zinc-700">
              {texto.length}/160
            </span>
          </div>
        </div>

        {/* PRAZO */}
        <div className="px-5 pt-2">
          <input
            type="text"
            value={prazo}
            onChange={e => setPrazo(e.target.value)}
            placeholder="hoje · 23h"
            className="
              w-full
              rounded-2xl
              bg-white/[0.025]
              border border-white/[0.06]
              px-4 py-3.5
              text-[16px]
              text-zinc-300
              outline-none
              placeholder:text-zinc-700
              focus:border-violet-500/40
            "
            style={{
              WebkitAppearance: 'none',
              touchAction: 'manipulation',
            }}
          />
        </div>

        {/* AÇÕES */}
        <div className="grid grid-cols-[1fr_1.35fr] gap-2.5 px-5 pt-5 pb-5">
          <button
            type="button"
            onClick={fechar}
            className="
              h-11
              rounded-2xl
              border border-white/[0.06]
              bg-white/[0.025]
              text-sm
              text-zinc-500
            "
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSalvar}
            disabled={!habilitado}
            className="
              h-11
              rounded-2xl
              text-sm
              font-medium
              transition
            "
            style={{
              color: habilitado ? '#fff' : '#52525b',

              background: habilitado
                ? 'linear-gradient(135deg,#7C3AED,#6366F1,#20B98B)'
                : 'rgba(255,255,255,.035)',
            }}
          >
            Colar post-it
          </button>
        </div>
      </div>
    </div>
  )
}

function Lembretes() {
  const [ativo, setAtivo] = useState('Todos')
  const [itens, setItens] = useState(postits)
  const [sheetAberto, setSheetAberto] = useState(false)

  function toggleFeito(id) {
    setItens(prev =>
      prev.map(p =>
        p.id === id
          ? { ...p, feito: !p.feito }
          : p
      )
    )
  }

  return (
    <div className="min-h-screen bg-black text-white pb-32 px-4 max-w-sm mx-auto">
      <div className="flex items-end justify-between pt-12 pb-1">
        <div>
          <h1 className="text-3xl font-semibold">
            Post-its
          </h1>

          <p
            style={{ fontFamily: 'Instrument Serif, serif' }}
            className="text-[#a1a1aa] text-sm italic mt-0.5"
          >
            cole na parede da sua noite
          </p>
        </div>

        <span className="text-[#a1a1aa] text-xs mb-1">
          {itens.filter(i => !i.feito).length} abertos
        </span>
      </div>

      <div className="flex gap-2 mt-4 mb-5">
        {filtros.map(f => (
          <button
            key={f}
            onClick={() => setAtivo(f)}
            className={`
              px-3 py-1.5
              rounded-full
              text-xs
              border
              transition
              ${
                ativo === f
                  ? 'bg-white text-black border-white'
                  : 'text-[#a1a1aa] border-[#26262e]'
              }
            `}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {itens.map(
          ({ id, materia, cor, texto, prazo, feito }) => (
            <div
              key={id}
              className="relative rounded-2xl p-4 flex flex-col justify-between min-h-[160px]"
              style={{
                backgroundColor: cor,
                transform: `rotate(${
                  id % 2 === 0
                    ? id * 0.8
                    : -(id * 0.7)
                }deg)`,
              }}
            >
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-4 bg-black/20 rounded-sm" />

              <div>
                <p className="text-[10px] tracking-widest text-black/50 uppercase mb-2">
                  {materia}
                </p>

                <p
                  className={`
                    text-sm
                    font-medium
                    text-black
                    leading-snug
                    ${
                      feito
                        ? 'line-through opacity-50'
                        : ''
                    }
                  `}
                >
                  {texto}
                </p>
              </div>

              <div className="flex items-center justify-between mt-4">
                <p className="text-[10px] text-black/50">
                  {prazo}
                </p>

                <button
                  onClick={() => toggleFeito(id)}
                  className={`
                    w-6 h-6
                    rounded-full
                    border-2
                    flex
                    items-center
                    justify-center
                    transition
                    ${
                      feito
                        ? 'bg-black/30 border-black/30'
                        : 'border-black/30 bg-transparent'
                    }
                  `}
                >
                  {feito && (
                    <Check
                      size={12}
                      className="text-black"
                    />
                  )}
                </button>
              </div>
            </div>
          )
        )}
      </div>

      <p className="text-[#a1a1aa] text-[10px] text-center mt-5">
        — aproxime o celular do NFC pra colar um
        post-it rapidinho
      </p>

      <button
        onClick={() => setSheetAberto(true)}
        className="
          fixed
          bottom-24 right-6
          w-12 h-12
          rounded-full
          flex
          items-center
          justify-center
          shadow-xl
          transition-transform
          active:scale-90
        "
        style={{
          background:
            'linear-gradient(135deg, #8B5CF6, #6366F1, #22D3A0)',
        }}
      >
        <Plus size={22} className="text-white" />
      </button>

      {sheetAberto && (
        <ModalNovoPostit
          onClose={() => setSheetAberto(false)}
        />
      )}
    </div>
  )
}

export default Lembretes