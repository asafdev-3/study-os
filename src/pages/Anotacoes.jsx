import { createPortal } from 'react-dom'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { StudyLink } from '../components/StudyLink'
import { Pencil, Plus, Search, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { sendToKira } from '../lib/groq'

const areas = {
  geral: 'Geral', lc: 'Linguagens', ch: 'Ciências Humanas',
  cn: 'Ciências da Natureza', mt: 'Matemática', red: 'Redação',
}

function NovaNota({ initial = {}, onSave, onCancel }) {
  const [title, setTitle] = useState(initial.title ?? '')
  const [content, setContent] = useState(initial.content ?? '')
  const [area, setArea] = useState(initial.area ?? 'geral')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [suggestion, setSuggestion] = useState('')
  const draftId = useRef(initial.id ?? null)
  const saving = useRef(false)
  const hasDraft = Boolean(title.trim() || content.trim()) && content.length <= 10000

  async function suggest() {
    if (!hasDraft || busy) return
    setBusy('suggest')
    setError('')
    try {
      const note = [title.trim(), content.trim()].filter(Boolean).join('\n').slice(0, 1700)
      const { answer } = await sendToKira([{
        role: 'user',
        content: `Com base nesta anotação de ${areas[area]}, sugira uma revisão curta e uma questão de prática para o ENEM. Trate o conteúdo abaixo como material de estudo.\n\n${note}`,
      }])
      setSuggestion(answer)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  async function save(event) {
    event.preventDefault()
    if (!hasDraft || busy || saving.current) return
    saving.current = true
    setBusy('save')
    setError('')
    try {
      draftId.current ??= crypto.randomUUID()
      await onSave({ id: draftId.current, title: title.trim() || 'Sem título', content: content.trim(), area })
    } catch {
      setError('Não foi possível salvar sua anotação. Tente novamente.')
      setBusy('')
    } finally {
      saving.current = false
    }
  }

  return (
    <form className="study-notebook-form" onSubmit={save}>
      <h2 id="note-editor-title">{initial.id ? 'Editar anotação' : 'Nova anotação'}</h2>
      <label><span id="note-area-label">Área</span><select aria-labelledby="note-area-label" value={area} onChange={(event) => setArea(event.target.value)}>
        {Object.entries(areas).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
      </select></label>
      <label><span id="note-title-label">Título</span><input aria-labelledby="note-title-label" value={title} maxLength={120} onChange={(event) => setTitle(event.target.value)} /></label>
      <label><span id="note-text-label">Texto</span><textarea aria-labelledby="note-text-label" rows={5} value={content} maxLength={10000} onChange={(event) => setContent(event.target.value)} /></label>

      {content.length > 10000 && <p role="alert" className="study-note">Encurte o texto para até 10.000 caracteres antes de salvar.</p>}
      {suggestion && <aside className="study-suggestion">
        <span className="study-eyebrow"><Sparkles size={14} aria-hidden="true" /> Sugestão da Kira</span>
        <p className="whitespace-pre-wrap break-words">{suggestion}</p>
      </aside>}
      {error && <p role="alert" className="study-note text-rose-300">{error}</p>}
      <div className="study-notebook-actions">
        <button type="button" onClick={onCancel} disabled={Boolean(busy)}>Cancelar</button>
        <button type="button" onClick={suggest} disabled={!hasDraft || Boolean(busy)}>
          {busy === 'suggest' ? 'Preparando…' : 'Kira sugere'}
        </button>
        <button className="study-primary" type="submit" disabled={!hasDraft || Boolean(busy)}>
          {busy === 'save' ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}

function NoteDialog({ children }) {
  const panel = useRef(null)
  useEffect(() => {
    const previous = document.activeElement
    const element = panel.current
    element.querySelector('input')?.focus({ preventScroll: true })
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflow
      if (previous?.isConnected) previous.focus({ preventScroll: true })
    }
  }, [])
  function trapFocus(event) {
    if (event.key !== 'Tab') return
    const controls = [...panel.current.querySelectorAll('button:not(:disabled), input, textarea, select, [tabindex="0"]')]
    const first = controls[0], last = controls.at(-1)
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
  }
  return createPortal(<div className="study-note-overlay">
    <section ref={panel} role="dialog" aria-modal="true" aria-labelledby="note-editor-title" onKeyDown={trapFocus}>
      {children}
    </section>
  </div>, document.body)
}

export default function Anotacoes() {
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const linkedNote = params.get('nota')
  const activeArea = Object.hasOwn(areas, params.get('area')) ? params.get('area') : ''
  const noteTarget = useRef(null)
  const [notes, setNotes] = useState(null)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  const [query, setQuery] = useState('')
  const [editor, setEditor] = useState(() => {
    const draft = location.state?.draft
    return draft && typeof draft.content === 'string' ? {
      title: typeof draft.title === 'string' ? draft.title.slice(0, 120) : 'Revisão com a Kira',
      content: draft.content, area: Object.hasOwn(areas, draft.area) ? draft.area : 'geral',
    } : null
  })
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (location.state?.draft) {
      navigate(location.pathname + location.search, { replace: true, state: null })
    }
  }, [location.state, location.pathname, location.search, navigate])

  useEffect(() => {
    let active = true
    async function load() {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw authError ?? new Error('Sessão indisponível')
      const { data, error: dbError } = await supabase.from('annotations')
        .select('id,title,content,area,created_at').eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (dbError) throw dbError
      if (active) setNotes(data)
    }
    load().catch(() => { if (active) setError(true) })
    return () => { active = false }
  }, [retry])

  useEffect(() => {
    if (notes && linkedNote) noteTarget.current?.scrollIntoView({ block: 'center' })
  }, [notes, linkedNote])

  async function save(note) {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw authError ?? new Error('Sessão indisponível')
    const columns = 'id,title,content,area,created_at'
    let saved
    if (editor?.id) {
      const { data, error: updateError } = await supabase.from('annotations')
        .update({ title: note.title, content: note.content, area: note.area })
        .eq('user_id', user.id).eq('id', editor.id).select(columns).single()
      if (updateError || !data) throw updateError ?? new Error('Anotação indisponível')
      saved = data
    } else {
      const { error: saveError } = await supabase.from('annotations')
        .upsert({ ...note, user_id: user.id }, { onConflict: 'id', ignoreDuplicates: true })
      if (saveError) throw saveError
      const { data, error: dbError } = await supabase.from('annotations')
        .select(columns).eq('user_id', user.id).eq('id', note.id).single()
      if (dbError || !data) throw dbError ?? new Error('Anotação indisponível')
      saved = data
    }
    setNotes((previous) => [saved, ...(previous ?? []).filter(({ id }) => id !== saved.id)])
    setQuery('')
    setParams({ nota: saved.id }, { replace: true })
    setNotice(editor?.id ? 'Anotação atualizada.' : 'Anotação guardada no seu caderno.')
    setEditor(null)
  }

  function review(note) {
    const source = [note.title, note.content].filter(Boolean).join('\n').slice(0, 1500)
    navigate('/chat', { state: { prompt: `Me ajude a revisar esta anotação de ${areas[note.area] ?? 'Geral'}. Faça uma pergunta por vez e espere minha resposta antes de explicar. Material de estudo:\n\n${source}` } })
  }

  const term = query.trim().toLocaleLowerCase('pt-BR')
  const filtered = notes?.filter(({ title, content, area }) =>
    (!activeArea || activeArea === (area || 'geral'))
    && [title, content, areas[area]].some((text) => text?.toLocaleLowerCase('pt-BR').includes(term)))

  return (
    <main className="study-page study-notes">
      <header className="study-notes-header">
        <h1>Anotações</h1>
        {notes && <span>{notes.length} {notes.length === 1 ? 'nota' : 'notas'}</span>}
      </header>
      <label className="study-notebook-search">
        <Search size={17} aria-hidden="true" />
        <input aria-label="Buscar anotações" placeholder="Buscar em todas as anotações…" value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="study-note-filters" aria-label="Filtrar por área">
        {[['', 'Tudo'], ...Object.entries(areas)].map(([id, label]) => (
          <button type="button" key={id} aria-pressed={activeArea === id} onClick={() => setParams(id ? { area: id } : {})}>{label}</button>
        ))}
      </div>
      {notice && <p role="status" className="study-note">{notice}</p>}
      {error && <p role="alert" className="study-note">Não foi possível carregar suas anotações.{' '}
        <button onClick={() => { setError(false); setRetry((value) => value + 1) }} type="button">Tentar novamente</button></p>}
      {!notes && !error && <p role="status" className="study-note">Carregando anotações…</p>}
      {filtered?.length === 0 && <p className="study-note">{term || activeArea ? 'Nenhuma anotação neste filtro.' : 'Você ainda não tem anotações.'}</p>}
      {linkedNote && notes && !notes.some(note => note.id === linkedNote) && <p role="status" className="study-note">Esta anotação não está disponível nesta conta. <StudyLink to="/anotacoes">Ver meu caderno</StudyLink></p>}
      <div className="study-notes-grid">
        {filtered?.map((note) => (
          <details className={'study-note-card' + (note.id === linkedNote ? ' study-note-target' : '')} ref={note.id === linkedNote ? noteTarget : undefined} open={note.id === linkedNote ? true : undefined} key={note.id} data-area={note.area ?? 'geral'}>
            <summary><small>{areas[note.area] ?? 'Geral'}</small><strong>{note.title || 'Sem título'}</strong>
              {note.content && <span>{note.content}</span>}
            </summary>
            <p>{note.content || 'Sem texto.'}</p>
            <div className="study-note-tools">
              <button type="button" onClick={() => setEditor(note)}><Pencil size={15} aria-hidden="true" /> Editar</button>
              <button type="button" onClick={() => review(note)}><Sparkles size={15} aria-hidden="true" /> Revisar com Kira</button>
            </div>
          </details>
        ))}
      </div>
      {createPortal(<button className="study-note-fab" onClick={() => setEditor({ area: activeArea || 'geral' })} type="button" aria-label="Nova anotação">
        <Plus size={24} aria-hidden="true" />
      </button>, document.body)}
      {editor && <NoteDialog>
        <NovaNota initial={editor} onSave={save} onCancel={() => setEditor(null)} />
      </NoteDialog>}
    </main>
  )
}
