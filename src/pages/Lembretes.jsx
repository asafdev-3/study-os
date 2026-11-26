import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { m as motion, AnimatePresence } from 'framer-motion'
import { Plus, Check, X, Trash2 } from 'lucide-react'
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
  const dialog = useRef(null)
  useLayoutEffect(() => {
    const sheet = dialog.current
    const opener = document.activeElement
    sheet.showModal()
    return () => {
      sheet.close()
      opener?.focus({ preventScroll: true })
    }
  }, [])

  function save(event) {
    event.preventDefault()
    if (!texto.trim()) return
    onSalvar({ texto: texto.trim(), materia, prazo })
    onClose()
  }

  return createPortal(
    <dialog className="postit-editor" ref={dialog} aria-labelledby="postit-heading"
      onCancel={event => { event.preventDefault(); onClose() }}
      onClick={event => { if (event.target === event.currentTarget) onClose() }}>
      <form onSubmit={save}>
        <header><h2 id="postit-heading" tabIndex={-1} autoFocus>Novo post-it</h2>
          <button type="button" aria-label="Fechar" onClick={onClose}><X size={20} /></button></header>
        <div className="postit-fields">
          <label htmlFor="postit-text">Lembrete</label>
          <textarea id="postit-text" value={texto} maxLength={160} required aria-label="Texto do post-it"
            placeholder="O que você quer lembrar?" onChange={event => setTexto(event.target.value)} />
          <label>Matéria<select value={materia ?? ''} onChange={event => setMateria(event.target.value || null)}>
            <option value="">Geral</option>{materiasForm.map(name => <option key={name}>{name}</option>)}
          </select></label>
          <label>Prazo opcional<input type="datetime-local" value={prazo} onChange={event => setPrazo(event.target.value)} /></label>
        </div>
        <footer><small>{texto.length}/160</small><button type="submit" disabled={!texto.trim()}>Colar post-it</button></footer>
      </form>
    </dialog>, document.body
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
    const cor = materia ? coresMaterias[materia] : '#F1DB8D'
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
    <section className="revision-wall" aria-label="Mural de revisão">
      <header className="revision-heading">
        <div><h2>Mural de revisão</h2><p>{abertosCount} {abertosCount === 1 ? 'lembrete em aberto' : 'lembretes em aberto'}</p></div>
        <button type="button" className="revision-new" aria-label="Novo post-it" onClick={() => setSheetAberto(true)}><Plus size={17} /> Novo</button>
      </header>
      <div className="revision-filters" role="group" aria-label="Filtrar por prazo">
        {filtros.map(f => <button key={f} type="button" aria-pressed={ativo === f} onClick={() => setAtivo(f)}>{f}</button>)}
      </div>
      <div className="revision-board">
        {itensFiltrados.length === 0 && <p className="revision-empty">{itens.length ? 'Nenhum bilhete neste prazo.' : 'Cole seu primeiro lembrete no mural.'}</p>}
        <AnimatePresence initial={false}>
          {itensFiltrados.map(({id, materia, cor, texto, prazo, feito}, index) =>
            <motion.article key={id} className="study-paper-postit revision-slip" data-done={feito}
              style={{ '--paper-tint': cor || '#F1DB8D' }}
              layout={!reduced} initial={reduced ? false : { opacity: 0, y: -7, rotate: -2 }}
              animate={{ opacity: 1, y: 0, rotate: [-1.3,1,.35][index % 3] }}
              exit={{ opacity: 0 }} transition={reduced ? {duration:0} : cardSpring}>
              <header><small>{materia}</small><button type="button" aria-label={'Remover post-it: ' + texto} onClick={() => removerPostit(id)}><Trash2 size={15} /></button></header>
              <p>{texto}</p>
              <footer><small>{formatarPrazo(prazo)}</small><button type="button" aria-pressed={feito}
                aria-label={(feito ? 'Marcar como pendente: ' : 'Concluir: ') + texto} onClick={() => toggleFeito(id)}>
                <span className="slip-check" aria-hidden="true">{feito && <Check size={12} />}</span>{feito ? 'Feito' : 'Concluir'}
              </button></footer>
            </motion.article>)}
        </AnimatePresence>
      </div>
      {sheetAberto && <ModalNovoPostit onClose={() => setSheetAberto(false)} onSalvar={adicionarPostit} />}
    </section>
  )
}

export default Lembretes