import { useEffect, useRef, useState } from 'react'
import { Plus, Search, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { sendToKira } from '../lib/groq'

const areas = {
  geral: 'Geral', lc: 'Linguagens', ch: 'Ciências Humanas',
  cn: 'Ciências da Natureza', mt: 'Matemática', red: 'Redação',
}

function NovaNota({ onSave, onCancel }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [area, setArea] = useState('geral')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [suggestion, setSuggestion] = useState('')
  const draftId = useRef(null)
  const hasDraft = Boolean(title.trim() || content.trim())

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
    if (!hasDraft || busy) return
    setBusy('save')
    setError('')
    try {
      draftId.current ??= crypto.randomUUID()
      await onSave({ id: draftId.current, title: title.trim() || 'Sem título', content: content.trim(), area })
    } catch {
      setError('Não foi possível salvar sua anotação. Tente novamente.')
      setBusy('')
    }
  }

  return (
    <form className="study-notebook-form" onSubmit={save}>
      <h2>Nova anotação</h2>
      <label>Área <select value={area} onChange={(event) => setArea(event.target.value)}>
        {Object.entries(areas).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
      </select></label>
      <label>Título <input value={title} maxLength={120} onChange={(event) => setTitle(event.target.value)} /></label>
      <label>Texto <textarea rows={5} value={content} maxLength={10000} onChange={(event) => setContent(event.target.value)} /></label>

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

export default function Anotacoes() {
  const [notes, setNotes] = useState(null)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  const [query, setQuery] = useState('')
  const [activeArea, setActiveArea] = useState('')
  const [writing, setWriting] = useState(false)

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

  async function save(note) {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw authError ?? new Error('Sessão indisponível')
    const { error: saveError } = await supabase.from('annotations')
      .upsert({ ...note, user_id: user.id }, { onConflict: 'id', ignoreDuplicates: true })
    if (saveError) throw saveError
    const { data, error: dbError } = await supabase.from('annotations')
      .select('id,title,content,area,created_at').eq('user_id', user.id).eq('id', note.id).single()
    if (dbError) throw dbError
    setNotes((previous) => [data, ...(previous ?? []).filter(({ id }) => id !== data.id)])
    setWriting(false)
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
          <button type="button" key={id} aria-pressed={activeArea === id} onClick={() => setActiveArea(id)}>{label}</button>
        ))}
      </div>
      {error && <p role="alert" className="study-note">Não foi possível carregar suas anotações.{' '}
        <button onClick={() => { setError(false); setRetry((value) => value + 1) }} type="button">Tentar novamente</button></p>}
      {!notes && !error && <p role="status" className="study-note">Carregando anotações…</p>}
      {filtered?.length === 0 && <p className="study-note">{term || activeArea ? 'Nenhuma anotação neste filtro.' : 'Você ainda não tem anotações.'}</p>}
      <div className="study-notes-grid">
        {filtered?.map((note) => (
          <details className="study-note-card" key={note.id} data-area={note.area ?? 'geral'}>
            <summary><small>{areas[note.area] ?? 'Geral'}</small><strong>{note.title || 'Sem título'}</strong>
              {note.content && <span>{note.content}</span>}
            </summary>
            <p>{note.content || 'Sem texto.'}</p>
          </details>
        ))}
      </div>
      <button className="study-note-fab" onClick={() => setWriting(true)} type="button" aria-label="Nova anotação">
        <Plus size={24} aria-hidden="true" />
      </button>
      {writing && <div className="study-note-overlay">
        <section role="dialog" aria-modal="true" aria-label="Nova anotação">
          <NovaNota onSave={save} onCancel={() => setWriting(false)} />
        </section>
      </div>}
    </main>
  )
}
