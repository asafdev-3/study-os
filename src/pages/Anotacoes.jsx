import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { StudyLink } from '../components/StudyLink'
import { ArrowLeft, ArrowRight, List, Pencil, Plus, Search, Sparkles, Trash2, BookOpen } from 'lucide-react'
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
  useEffect(() => {
    const viewport = window.visualViewport
    const root = document.documentElement
    function update() {
      const focused = document.activeElement?.matches('.study-notebook-form input, .study-notebook-form textarea')
      root.toggleAttribute('data-note-keyboard', Boolean(focused && viewport && window.innerHeight - viewport.height > 120))
    }
    viewport?.addEventListener('resize', update)
    document.addEventListener('focusin', update)
    document.addEventListener('focusout', update)
    return () => {
      viewport?.removeEventListener('resize', update)
      document.removeEventListener('focusin', update)
      document.removeEventListener('focusout', update)
      root.removeAttribute('data-note-keyboard')
    }
  }, [])
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
    <form className="study-notebook-form" aria-labelledby="note-editor-title" onSubmit={save}>
      <h2 id="note-editor-title">{initial.id ? 'Editar anotação' : 'Nova anotação'}</h2>
      <fieldset className="study-area-picker"><legend>Área</legend>
        <details onKeyDown={event => { if (event.key === 'Escape') { event.currentTarget.open = false; event.currentTarget.querySelector('summary').focus() } }}>
          <summary aria-label="Escolher área">{areas[area]}<span aria-hidden="true">⌄</span></summary>
          <div className="study-area-options">
            {Object.entries(areas).map(([id, label]) => <label key={id}>
              <input type="radio" name="note-area" value={id} checked={area === id} onChange={event => { setArea(id); const menu = event.target.closest('details'); menu.open = false; menu.querySelector('summary').focus() }} />
              <span>{label}</span>
            </label>)}
          </div>
        </details>
      </fieldset>
      <label><span id="note-title-label">Título</span><input aria-labelledby="note-title-label" value={title} maxLength={120} onChange={(event) => setTitle(event.target.value)} /></label>
      <label><span id="note-text-label">Texto</span><textarea aria-labelledby="note-text-label" rows={12} value={content} maxLength={10000} onChange={(event) => setContent(event.target.value)} /></label>

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

export default function Anotacoes() {
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const linkedNote = params.get('nota')
  const activeArea = Object.hasOwn(areas, params.get('area')) ? params.get('area') : ''
  const [indexOpen, setIndexOpen] = useState(false)
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
  const [deleting, setDeleting] = useState(false)
  const deleteLock = useRef(false)

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
    setParams({}, { replace: true })
    setNotice(editor?.id ? 'Anotação atualizada.' : 'Anotação guardada no seu caderno.')
    setEditor(null)
  }

  async function removeNote(note) {
    if (deleteLock.current || !window.confirm(`Apagar “${note.title || 'Sem título'}”? Esta ação não pode ser desfeita.`)) return
    deleteLock.current = true
    setDeleting(true)
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw new Error('Sessão indisponível')
      const { data, error: deleteError } = await supabase.from('annotations')
        .delete().eq('user_id', user.id).eq('id', note.id).select('id').single()
      if (deleteError || data?.id !== note.id) throw new Error('Exclusão não confirmada')
      setNotes(previous => previous.filter(item => item.id !== note.id))
      setParams(activeArea ? { area: activeArea } : {}, { replace: true })
      setNotice('Anotação apagada.')
    } catch {
      setNotice('Não foi possível apagar. Sua anotação foi mantida. Tente novamente.')
    } finally {
      deleteLock.current = false
      setDeleting(false)
    }
  }

  function review(note) {
    const source = [note.title, note.content].filter(Boolean).join('\n').slice(0, 1500)
    navigate('/chat', { state: { prompt: `Me ajude a revisar esta anotação de ${areas[note.area] ?? 'Geral'}. Faça uma pergunta por vez e espere minha resposta antes de explicar. Material de estudo:\n\n${source}` } })
  }

  const term = query.trim().toLocaleLowerCase('pt-BR')
  const filtered = notes?.filter(({ title, content, area }) =>
    (!activeArea || activeArea === (area || 'geral'))
    && [title, content, areas[area]].some((text) => text?.toLocaleLowerCase('pt-BR').includes(term)))

  const selectedIndex = Math.max(0, filtered?.findIndex(note => note.id === linkedNote) ?? 0)
  const selected = filtered?.[selectedIndex]
  function selectNote(id) {
    if (editor) return
    setParams({ ...(activeArea ? { area: activeArea } : {}), nota: id }, { replace: true })
    setIndexOpen(false)
    setNotice('')
  }

  return (
    <main className="study-page study-notes study-notes-book">
      <header className="study-notes-header">
        <div><span className="study-eyebrow">STUDYOS / CADERNO</span><h1>Seus cadernos</h1></div>
        <button className="study-book-new" type="button" aria-label="Nova anotação" disabled={Boolean(editor)} onClick={() => { setEditor({ area: activeArea || 'geral' }); setIndexOpen(false); setNotice('') }}>
          <Plus size={18} aria-hidden="true" /><span>Novo caderno</span>
        </button>
      </header>
      {notice && <p role="status" className="study-note">{notice}</p>}
      {error && <p role="alert" className="study-note">Não foi possível carregar suas anotações.{' '}
        <button onClick={() => { setError(false); setRetry(value => value + 1) }} type="button">Tentar novamente</button></p>}
      {!notes && !error && <p role="status" className="study-note">Carregando anotações…</p>}
      {linkedNote && notes && !notes.some(note => note.id === linkedNote) && <p role="status" className="study-note">Esta anotação não está disponível nesta conta. <StudyLink to="/anotacoes">Ver meu caderno</StudyLink></p>}
      {!editor && !linkedNote && <section className="study-notebook-drawer" aria-label="Gaveta de cadernos">
        <p className="study-note">Escolha um caderno. Abra só o que precisa agora.</p>
        <label className="study-drawer-search"><Search size={18} aria-hidden="true" /><input type="search" aria-label="Buscar cadernos" placeholder="Buscar na gaveta" value={query} onChange={event => setQuery(event.target.value)} /></label>
        <div className="study-drawer-books">{filtered?.map((note, index) => <button type="button" className="study-closed-book" key={note.id} onClick={() => selectNote(note.id)} style={{ '--book-hue': [226,157,29,277][index % 4] }}>
          <span className="study-closed-book-area">{areas[note.area] ?? 'Geral'}</span>
          <strong>{note.title || 'Sem título'}</strong><span className="study-closed-book-open"><BookOpen size={16} aria-hidden="true" />Abrir caderno</span>
        </button>)}</div>
        {notes && !filtered?.length && <div className="study-drawer-empty"><BookOpen size={32} aria-hidden="true" /><h2>{query ? 'Nenhum caderno encontrado' : 'Sua gaveta está pronta'}</h2><p>{query ? 'Tente outro título.' : 'Dê um título à sua primeira anotação. Ela fica guardada aqui.'}</p>{!query && <button type="button" className="study-primary" onClick={() => setEditor({ area:'geral' })}>Criar primeiro caderno</button>}</div>}
      </section>}
      {(editor || linkedNote) && <button type="button" className="study-drawer-back" disabled={Boolean(editor)} onClick={() => { setParams({}); setIndexOpen(false); setQuery('') }}><ArrowLeft size={18} />Guardar na gaveta</button>}
      {linkedNote && !editor && <button className="study-book-toggle" type="button" aria-expanded={indexOpen} aria-controls="notebook-index" onClick={() => setIndexOpen(open => !open)}><List size={17} />{indexOpen ? 'Fechar índice' : 'Índice e busca'}<span>{notes?.length ?? 0} cadernos</span></button>}
      <div className="study-book-cover" hidden={!editor && !linkedNote} data-index-open={indexOpen}>
        <section className="study-book-index" id="notebook-index" aria-label="Índice de páginas">
          <span className="study-book-imprint">SEU ESPAÇO DE ESTUDO</span>
          <h2>Índice</h2>
          <p className="study-book-caption">Ideias que vale a pena guardar.</p>
          <label className="study-notebook-search">
            <Search size={16} aria-hidden="true" />
            <input type="search" disabled={Boolean(editor)} aria-label="Buscar anotações" placeholder="Buscar no caderno" value={query} onChange={event => setQuery(event.target.value)} />
          </label>
          <label className="study-book-area">Área
            <select disabled={Boolean(editor)} aria-label="Filtrar por área" value={activeArea} onChange={event => setParams(event.target.value ? { area: event.target.value } : {})}>
              <option value="">Todas as áreas</option>
              {Object.entries(areas).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          </label>
          <ol>{filtered?.map((note, index) => <li key={note.id}>
            <button disabled={Boolean(editor)} type="button" onClick={() => selectNote(note.id)} aria-current={selected?.id === note.id ? 'page' : undefined}>
              <span>{note.title || 'Sem título'}</span><i aria-hidden="true" /><small>{String(index + 1).padStart(2, '0')}</small>
            </button>
          </li>)}</ol>
          {!filtered?.length && <p className="study-book-caption">{term || activeArea ? 'Nenhuma página neste filtro.' : 'Suas páginas aparecerão aqui.'}</p>}
        </section>
        <section className="study-book-leaf" aria-label="Página do caderno">
          <span className="study-book-ribbon" aria-hidden="true" />
          <div className="study-book-top"><span>Caderno de estudos</span><span>{editor ? 'Escrevendo' : selected ? String(selectedIndex + 1).padStart(2, '0') : '01'}</span></div>
          {editor ? <NovaNota key={editor.id || 'new'} initial={editor} onSave={save} onCancel={() => setEditor(null)} /> : <>
            <article className="study-book-writing">
              <small>{selected ? areas[selected.area] ?? 'Geral' : 'Página em branco'}</small>
              <h2>{selected?.title || (term || activeArea ? 'Nenhuma página encontrada' : 'Sua primeira página')}</h2>
              <div className="study-book-lines"><p>{selected ? selected.content || 'Sem texto.' : term || activeArea ? 'Tente outra palavra ou escolha outra área no índice.' : 'Guarde uma ideia, organize o que aprendeu ou traga uma explicação da Kira para cá.'}</p></div>
              {selected ? <div className="study-note-tools">
                <button type="button" disabled={deleting} onClick={() => setEditor(selected)}><Pencil size={15} aria-hidden="true" /> Editar</button>
                <button type="button" disabled={deleting} onClick={() => review(selected)}><Sparkles size={15} aria-hidden="true" /> Revisar com Kira</button>
                <button type="button" className="study-note-delete" disabled={deleting} onClick={() => removeNote(selected)}><Trash2 size={15} aria-hidden="true" />{deleting ? 'Apagando…' : 'Apagar anotação'}</button>
              </div> : !term && !activeArea && <button type="button" className="study-book-start" onClick={() => setEditor({ area: 'geral' })}><Pencil size={16} aria-hidden="true" /> Escrever primeira página</button>}
            </article>
            <nav className="study-book-pager" aria-label="Navegar no caderno">
              <button type="button" aria-label="Página anterior" disabled={!selected || selectedIndex === 0} onClick={() => selectNote(filtered[selectedIndex - 1].id)}><ArrowLeft size={18} /></button>
              <span aria-live="polite">{selected ? `Página ${selectedIndex + 1} de ${filtered.length}` : 'Seu caderno, no seu ritmo.'}</span>
              <button type="button" aria-label="Próxima página" disabled={!selected || selectedIndex >= filtered.length - 1} onClick={() => selectNote(filtered[selectedIndex + 1].id)}><ArrowRight size={18} /></button>
            </nav>
          </>}
        </section>
      </div>
    </main>
  )
}
