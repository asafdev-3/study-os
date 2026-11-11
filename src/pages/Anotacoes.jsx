import { useEffect, useState } from 'react'
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
      await onSave({ title: title.trim() || 'Sem título', content: content.trim(), area })
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
    const { data, error: dbError } = await supabase.from('annotations')
      .insert({ ...note, user_id: user.id }).select('id,title,content,area,created_at').single()
    if (dbError) throw dbError
    setNotes((previous) => [data, ...(previous ?? []).filter(({ id }) => id !== data.id)])
    setWriting(false)
  }

  const term = query.trim().toLocaleLowerCase('pt-BR')
  const filtered = notes?.filter(({ title, content, area }) =>
    [title, content, areas[area]].some((text) => text?.toLocaleLowerCase('pt-BR').includes(term)))

  return (
    <main className="study-page study-dashboard">
      <header className="study-home-header">
        <h1>Anotações</h1>
        <p>Seu caderno de revisão para o ENEM.</p>
      </header>
      {writing ? <NovaNota onSave={save} onCancel={() => setWriting(false)} /> :
        <button className="study-primary mb-5" onClick={() => setWriting(true)} type="button">
          <Plus size={18} aria-hidden="true" /> Nova anotação
        </button>}
      <label className="study-notebook-search">
        <Search size={17} aria-hidden="true" />
        <input aria-label="Buscar anotações" placeholder="Buscar nas suas anotações" value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {error && <p role="alert" className="study-note">Não foi possível carregar suas anotações.{' '}
        <button onClick={() => { setError(false); setRetry((value) => value + 1) }} type="button">Tentar novamente</button></p>}
      {!notes && !error && <p role="status" className="study-note">Carregando anotações…</p>}
      {filtered?.length === 0 && <p className="study-note">{term ? 'Nenhum resultado para esta busca.' : 'Você ainda não tem anotações.'}</p>}
      {filtered?.map((note) => (
        <details className="study-notebook-item" key={note.id}>
          <summary><span>{note.title || 'Sem título'}</span><small>{areas[note.area] ?? 'Geral'}</small></summary>
          <p className="whitespace-pre-wrap break-words">{note.content || 'Sem texto.'}</p>
        </details>
      ))}
    </main>
  )
}
