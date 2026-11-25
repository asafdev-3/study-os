import { useState, useRef, useEffect } from 'react'
import { m as motion, AnimatePresence } from 'framer-motion'
import { Plus, Check, X, Trash2, StickyNote } from 'lucide-react'
import { cardSpring, useStudyReducedMotion } from '../lib/motion'

const filtros = ['Todos', 'Hoje', 'Semana', 'Sem prazo']
const materiasForm = ['Química', 'Cálculo', 'História', 'Inglês', 'Física', 'Redação', 'Vida']

const coresMaterias = {
  Química: '#A8D8D8',
  História: '#F5D08A',
  Inglês: '#C5B8E8',
  Cálculo: '#C8E6A0',
  Física: '#93C5FD',
  Redação: '#FBCFE8',
  Vida: '#F4A8A8',
}

function ModalNovoPostit({ onClose, onSalvar }) {
  const [texto, setTexto] = useState('')
  const [materia, setMateria] = useState(null)
  const [prazo, setPrazo] = useState('')
  const [visivel, setVisivel] = useState(false)
  const textoRef = useRef(null)

  useEffect(() => {
    requestAnimationFrame(() => setVisivel(true))
    const t = setTimeout(() => textoRef.current?.focus(), 220)
    return () => clearTimeout(t)
  }, [])

  function fechar() {
    setVisivel(false)
    setTimeout(onClose, 180)
  }

  function handleSalvar() {
    if (!texto.trim()) return
    onSalvar({ texto: texto.trim(), materia, prazo })
    fechar()
  }

  const habilitado = texto.trim().length > 0

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{ opacity: visivel ? 1 : 0, transition: 'opacity 180ms ease' }}
    >
      <div
        className="absolute inset-0"
        onClick={fechar}
        style={{
          background: 'rgba(4, 10, 20, 0.72)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      />

      <div
        className="relative w-full max-w-[400px] rounded-[28px] overflow-hidden"
        style={{
          zIndex: 10,
          background: 'linear-gradient(155deg, rgba(28, 44, 70, 0.84), rgba(13, 23, 40, 0.92))',
          border: '1px solid rgba(226, 240, 255, 0.22)',
          backdropFilter: 'blur(24px) saturate(185%)',
          WebkitBackdropFilter: 'blur(24px) saturate(185%)',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.24), 0 24px 60px rgba(0, 0, 0, 0.45)',
          transform: visivel ? 'translateY(0) scale(1)' : 'translateY(14px) scale(0.96)',
          transition: 'transform 240ms cubic-bezier(.22,1,.36,1)',
        }}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div>
            <p className="text-[15px] font-semibold text-white">Novo post-it</p>
            <p className="text-[12px] text-[#9eb3d1] mt-0.5">Fixe um lembrete rápido no seu mural</p>
          </div>
          <button
            type="button"
            onClick={fechar}
            aria-label="Fechar"
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white/[0.08] border border-white/[0.14] text-[#c8daf4]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 pt-1">
          <div
            className="rounded-[20px] p-4 min-h-[104px]"
            style={{
              background: materia ? `${coresMaterias[materia]}18` : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${materia ? `${coresMaterias[materia]}45` : 'rgba(226, 240, 255, 0.14)'}`,
            }}
          >
            {materia && (
              <p className="text-[10px] font-semibold tracking-[0.14em] uppercase mb-1.5" style={{ color: coresMaterias[materia] }}>
                ● {materia}
              </p>
            )}
            <p className="text-[15px] text-white leading-relaxed">
              {texto || <span className="text-[#7b90b0]">Seu lembrete aparece aqui…</span>}
            </p>
            {prazo && <p className="text-[11px] text-[#9eb3d1] mt-3">{formatarPrazo(prazo)}</p>}
          </div>
        </div>

        <div className="px-5 pt-4">
          <p className="text-[10px] font-semibold text-[#9eb3d1] tracking-[0.14em] uppercase mb-2">Matéria</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {materiasForm.map((m) => {
              const selecionada = materia === m
              return (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMateria(selecionada ? null : m)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium transition"
                  style={{
                    background: selecionada ? `${coresMaterias[m]}26` : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${selecionada ? `${coresMaterias[m]}80` : 'rgba(226, 240, 255, 0.12)'}`,
                    color: selecionada ? coresMaterias[m] : '#b4c7e2',
                  }}
                >
                  {m}
                </button>
              )
            })}
          </div>
        </div>

        <div className="px-5 pt-3">
          <textarea
            ref={textoRef}
            value={texto}
            maxLength={160}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="O que você não pode esquecer?"
            className="w-full h-[82px] resize-none rounded-2xl bg-white/[0.05] border border-white/[0.14] px-4 py-3 text-[16px] text-white outline-none placeholder:text-[#7b90b0]"
          />
          <div className="flex justify-end mt-1">
            <span className="text-[10px] text-[#8ea5c6]">{texto.length}/160</span>
          </div>
        </div>

        <div className="px-5 pt-2">
          <input
            type="datetime-local"
            value={prazo}
            onChange={(e) => setPrazo(e.target.value)}
            className="w-full rounded-2xl bg-white/[0.05] border border-white/[0.14] px-4 py-3 text-[15px] text-[#dce8fa] outline-none"
            style={{ colorScheme: 'dark' }}
          />
        </div>

        <div className="grid grid-cols-[1fr_1.35fr] gap-2.5 px-5 pt-4 pb-5">
          <button
            type="button"
            onClick={fechar}
            className="h-11 rounded-full border border-white/[0.14] bg-white/[0.05] text-sm font-medium text-[#b4c7e2]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSalvar}
            disabled={!habilitado}
            className="h-11 rounded-full text-sm font-semibold transition"
            style={{
              color: habilitado ? '#0d1b30' : '#7185a3',
              background: habilitado ? 'linear-gradient(145deg, #eef5ff, #c2dafc)' : 'rgba(255, 255, 255, 0.06)',
              boxShadow: habilitado ? 'inset 0 1px 0 rgba(255,255,255,0.85), 0 8px 20px rgba(59,130,246,0.28)' : 'none',
            }}
          >
            Colar post-it
          </button>
        </div>
      </div>
    </div>
  )
}

const PRAZO_HOJE = ['hoje', 'agora', 'tonight']
const PRAZO_SEMANA = ['amanhã', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'sáb', 'semana', 'noite']

function formatarPrazo(prazo) {
  if (!prazo?.trim()) return 'sem prazo'
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(prazo)) {
    const d = new Date(prazo)
    const hoje = new Date()
    const amanha = new Date(hoje)
    amanha.setDate(hoje.getDate() + 1)
    const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    if (d.toDateString() === hoje.toDateString()) return `hoje · ${hora}`
    if (d.toDateString() === amanha.toDateString()) return `amanhã · ${hora}`
    return d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }) + ` · ${hora}`
  }
  return prazo
}

function matchFiltro(prazo, filtro) {
  if (filtro === 'Todos') return true
  const p = (prazo || '').toLowerCase()
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(prazo)) {
    const d = new Date(prazo)
    const hoje = new Date()
    const fimSemana = new Date(hoje)
    fimSemana.setDate(hoje.getDate() + 7)
    if (filtro === 'Hoje') return d.toDateString() === hoje.toDateString()
    if (filtro === 'Semana') return d >= hoje && d <= fimSemana
    if (filtro === 'Sem prazo') return false
  }
  if (filtro === 'Hoje') return PRAZO_HOJE.some((k) => p.includes(k))
  if (filtro === 'Semana') return PRAZO_SEMANA.some((k) => p.includes(k))
  if (filtro === 'Sem prazo') return !p || p === 'quando der' || p === '-' || p === 'sem prazo'
  return true
}

function Lembretes({ userId }) {
  const storageKey = `studyos:postits:${userId}`
  const reduced = useStudyReducedMotion()
  const [ativo, setAtivo] = useState('Todos')
  const [itens, setItens] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey))
      return Array.isArray(saved) ? saved : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(itens))
    } catch { /* Storage unavailable. */ }
  }, [storageKey, itens])

  const [sheetAberto, setSheetAberto] = useState(false)
  const itensFiltrados = itens.filter((i) => matchFiltro(i.prazo, ativo))
  const abertosCount = itens.filter((i) => !i.feito).length

  function toggleFeito(id) {
    setItens((prev) => prev.map((p) => (p.id === id ? { ...p, feito: !p.feito } : p)))
  }

  function removerPostit(id) {
    setItens((prev) => prev.filter((p) => p.id !== id))
  }

  function adicionarPostit({ texto, materia, prazo }) {
    const cor = materia ? coresMaterias[materia] : '#C5B8E8'
    setItens((prev) => [
      {
        id: crypto.randomUUID(),
        materia: (materia || 'GERAL').toUpperCase(),
        cor,
        texto,
        prazo: prazo?.trim() || 'sem prazo',
        feito: false,
      },
      ...prev,
    ])
  }

  return (
    <div className="study-postits" style={{ paddingTop: '8px', paddingBottom: '28px' }}>
      {/* Cabeçalho do Mural */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '16px 18px',
          borderRadius: '22px',
          background: 'linear-gradient(150deg, rgba(26, 42, 68, 0.72), rgba(14, 24, 42, 0.82))',
          border: '1px solid rgba(226, 240, 255, 0.16)',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.16)',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '13px',
              background: 'rgba(245, 208, 138, 0.18)',
              border: '1px solid rgba(245, 208, 138, 0.36)',
              color: '#F5D08A',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <StickyNote size={19} />
          </span>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: 650, color: '#f5f9ff', margin: 0 }}>Mural de Revisão</h2>
            <p style={{ fontSize: '12px', color: '#9eb3d1', margin: '2px 0 0' }}>
              {abertosCount === 0 ? 'Tudo em dia por aqui' : `${abertosCount} ${abertosCount === 1 ? 'lembrete ativo' : 'lembretes ativos'}`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setSheetAberto(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            minHeight: '40px',
            padding: '0 15px',
            borderRadius: '999px',
            background: 'linear-gradient(145deg, #eef5ff, #c5dcfb)',
            border: '1px solid rgba(255, 255, 255, 0.8)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 6px 18px rgba(37, 99, 235, 0.25)',
            color: '#0e1d34',
            fontSize: '13px',
            fontWeight: 650,
            cursor: 'pointer',
          }}
        >
          <Plus size={16} />
          <span>Novo</span>
        </button>
      </div>

      {/* Filtros em pílula */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
        {filtros.map((f) => {
          const selected = ativo === f
          return (
            <button
              key={f}
              type="button"
              onClick={() => setAtivo(f)}
              style={{
                minHeight: '36px',
                padding: '0 14px',
                borderRadius: '999px',
                fontSize: '12.5px',
                fontWeight: selected ? 620 : 500,
                background: selected
                  ? 'linear-gradient(145deg, rgba(164, 202, 255, 0.28), rgba(86, 132, 214, 0.22))'
                  : 'rgba(18, 30, 50, 0.65)',
                border: selected ? '1px solid rgba(226, 240, 255, 0.32)' : '1px solid rgba(226, 240, 255, 0.14)',
                color: selected ? '#ffffff' : '#a9bdd8',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              {f}
            </button>
          )
        })}
      </div>

      {itensFiltrados.length === 0 ? (
        <div
          style={{
            padding: '36px 20px',
            borderRadius: '24px',
            textAlign: 'center',
            background: 'rgba(18, 30, 50, 0.55)',
            border: '1px dashed rgba(226, 240, 255, 0.2)',
          }}
        >
          <p style={{ fontSize: '14px', color: '#b4c7e2', margin: 0 }}>
            Sua mesa está livre. Toque em <strong>+ Novo</strong> para colar um post-it.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          <AnimatePresence initial={false}>
            {itensFiltrados.map(({ id, materia, cor, texto, prazo, feito }, idx) => (
              <motion.article
                key={id}
                layout={!reduced}
                initial={reduced ? false : { opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1, rotate: (idx % 3) - 1 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
                transition={reduced ? { duration: 0 } : cardSpring}
                className="study-paper-postit relative p-4 flex flex-col justify-between min-h-[168px]"
                style={{
                  '--postit-color': cor,
                  borderRadius: '18px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: 'rgba(24, 32, 46, 0.68)',
                      }}
                    >
                      {materia}
                    </span>
                    <button
                      type="button"
                      onClick={() => removerPostit(id)}
                      aria-label={`Remover post-it: ${texto}`}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '999px',
                        display: 'grid',
                        placeItems: 'center',
                        background: 'rgba(24, 32, 46, 0.08)',
                        border: 'none',
                        color: 'rgba(24, 32, 46, 0.65)',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <p
                    style={{
                      fontSize: '14.5px',
                      fontWeight: 560,
                      color: '#1e2634',
                      lineHeight: 1.42,
                      textDecoration: feito ? 'line-through' : 'none',
                      opacity: feito ? 0.55 : 1,
                    }}
                  >
                    {texto}
                  </p>
                </div>

                <div
                  className="study-postit-footer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '14px',
                    paddingTop: '10px',
                    borderTop: '1px solid rgba(30, 38, 52, 0.14)',
                  }}
                >
                  <span style={{ fontSize: '11px', color: 'rgba(30, 38, 52, 0.65)', fontWeight: 500 }}>
                    {formatarPrazo(prazo)}
                  </span>

                  <button
                    type="button"
                    onClick={() => toggleFeito(id)}
                    aria-label={feito ? 'Marcar como pendente: ' + texto : 'Concluir: ' + texto}
                    aria-pressed={feito}
                    className="study-postit-complete"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '11.5px',
                      fontWeight: 650,
                      color: '#1e2634',
                      background: feito ? 'rgba(16, 185, 129, 0.24)' : 'rgba(30, 38, 52, 0.08)',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {feito && <Check size={12} />}
                    <span>{feito ? 'Feito' : 'Concluir'}</span>
                  </button>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      )}

      {sheetAberto && <ModalNovoPostit onClose={() => setSheetAberto(false)} onSalvar={adicionarPostit} />}
    </div>
  )
}

export default Lembretes