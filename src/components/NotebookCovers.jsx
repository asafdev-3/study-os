import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Check, LockKeyhole, RefreshCw } from 'lucide-react'
import NotebookCoverArt from './NotebookCoverArt'
import { coverDetails, coverRewards, previewCovers } from '../lib/coverRewards'
import './notebookCovers.css'

const labelDate = day => day?.split('-').reverse().join('/') ?? ''
const noteTitle = note => note.title || 'Sem título'

export default function NotebookCovers({ notes, onApply, onClose }) {
  const [state, setState] = useState(null)
  const [error, setError] = useState('')
  const [working, setWorking] = useState('')
  const [selectedCover, setSelectedCover] = useState('')
  const [selectedNote, setSelectedNote] = useState(notes[0]?.id ?? '')
  const [sourceNote, setSourceNote] = useState('')
  const [answer, setAnswer] = useState('')
  const [notice, setNotice] = useState('')
  const studiedNotes = useMemo(() =>
    notes.filter(note => note.content?.trim().length >= 120), [notes])

  async function refresh() {
    setError('')
    setWorking('loading')
    try {
      const next = await coverRewards('status')
      setState(next)
      setSelectedCover(current => current || next.weekly?.[0]?.id || '')
      setSourceNote(current => current || studiedNotes[0]?.id || '')
    } catch (err) {
      setError(err.message)
    } finally {
      setWorking('')
    }
  }
  useEffect(() => {
    let mounted = true
    coverRewards('status').then(next => {
      if (!mounted) return
      setState(next)
      setSelectedCover(current => current || next.weekly?.[0]?.id || '')
      setSourceNote(current => current || studiedNotes[0]?.id || '')
    }).catch(err => { if (mounted) setError(err.message) })
      .finally(() => { if (mounted) setWorking('') })
    return () => { mounted = false }
  }, [studiedNotes])

  async function act(action, data = {}) {
    if (working) return
    setError('')
    setNotice('')
    setWorking(action)
    try {
      const result = await coverRewards(action, data)
      if (result.challenge) {
        setState(previous => ({ ...previous, challenge: result.challenge }))
      }
      if (result.challenge?.status === 'passed') {
        setNotice('Capa conquistada. Ela ficará no seu acervo permanentemente.')
        const next = await coverRewards('status')
        setState(next)
      } else if (result.challenge?.status === 'grading') {
        setNotice('Sua resposta foi registrada. Continue a avaliação quando o servidor estiver disponível.')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setWorking('')
    }
  }
  async function apply(coverId) {
    if (!selectedNote || working) return
    setWorking('apply')
    setError('')
    try {
      await onApply(selectedNote, coverId)
      setNotice(coverId ? 'Capa aplicada ao caderno.' : 'Capa padrão restaurada.')
    } catch {
      setError('Não foi possível aplicar a capa. Verifique se a coleção está ativada.')
    } finally {
      setWorking('')
    }
  }

  const challenge = state?.challenge
  const completed = challenge && ['passed', 'failed', 'review'].includes(challenge.status)
  const weekly = state?.weekly ?? previewCovers.map(theme => ({ ...theme, id: 'preview_' + theme.id }))
  const owned = state?.owned ?? []
  const progress = Math.min(100, Math.round(100 * (state?.todaySeconds ?? 0) / (30 * 60)))

  return <section className="study-covers" aria-label="Coleção de capas">
    <header className="study-covers-header">
      <button type="button" onClick={onClose}><ArrowLeft size={18} /> Voltar à gaveta</button>
      <span>COLEÇÃO STUDYOS</span>
      <h2>Capas que contam histórias.</h2>
      <p>Estude, compreenda e conquiste. As capas desbloqueadas ficam suas para sempre.</p>
    </header>

    <div className="study-covers-progress" role="group" aria-label="Progresso da semana">
      <div className="study-covers-progress-head">
        <span>Seu ritmo</span>
        <strong>{state?.streak ?? '—'} de 7 dias</strong>
      </div>
      <p>30 minutos ativos por dia, durante 7 dias consecutivos.</p>
      <div className="study-covers-meter" role="progressbar" aria-label="Meta diária" aria-valuemin={0} aria-valuemax={30} aria-valuenow={Math.min(30, Math.floor((state?.todaySeconds ?? 0) / 60))}>
        <span style={{ width: progress + '%' }} />
      </div>
      <small>{Math.floor((state?.todaySeconds ?? 0) / 60)} / 30 minutos hoje</small>
    </div>

    <div className="study-covers-section-head">
      <div><h3>Edição semanal</h3><p>{state ? `Semana de ${labelDate(state.weekStart)}` : 'Prévia das capas originais'}</p></div>
      <button type="button" aria-label="Atualizar coleção" disabled={!!working} onClick={refresh}><RefreshCw size={18}/></button>
    </div>
    <div className="study-covers-grid">
      {weekly.map(cover => <button
        type="button" key={cover.id}
        className="study-cover-choice"
        aria-pressed={selectedCover === cover.id}
        disabled={!state || !!challenge || !!working}
        onClick={() => setSelectedCover(cover.id)}
      >
        <NotebookCoverArt coverId={cover.id} title={cover.name} />
        <span className="study-cover-choice-caption">
          <strong>{cover.name}</strong>
          {selectedCover === cover.id ? <Check size={16} aria-label="Selecionada"/> : <LockKeyhole size={14} aria-label="Bloqueada"/>}
        </span>
      </button>)}
    </div>

    {!state && <p className="study-covers-hint" role="status">O catálogo é uma prévia. O progresso e os desbloqueios dependem da ativação do servidor.</p>}
    {state && !challenge && <div className="study-covers-challenge">
      <h3>Desafio da Kira</h3>
      <p>{state.eligible
        ? 'Você cumpriu a sequência. Escolha uma capa e uma anotação para responder uma pergunta aberta.'
        : 'Complete a sequência de estudo para abrir uma única tentativa nesta semana.'}</p>
      <label>Base para a pergunta
        <select value={sourceNote} onChange={event => setSourceNote(event.target.value)} disabled={!state.eligible || !!working}>
          {studiedNotes.length === 0 && <option value="">Escreva uma anotação com 120 caracteres</option>}
          {studiedNotes.map(note => <option key={note.id} value={note.id}>{noteTitle(note)}</option>)}
        </select>
      </label>
      <button className="study-primary" type="button" disabled={!state.eligible || !sourceNote || !selectedCover || !!working}
        onClick={() => act('start', { coverId: selectedCover, annotationId: sourceNote })}>
        {working === 'start' ? 'Criando questão…' : 'Iniciar desafio'}
      </button>
    </div>}

    {challenge && <div className="study-covers-challenge" aria-live="polite">
      <h3>{completed ? 'Resultado do desafio' : 'Sua única resposta'}</h3>
      <p className="study-covers-question">{challenge.question}</p>
      {challenge.status === 'pending' && <form onSubmit={event => { event.preventDefault(); void act('answer', { answer }) }}>
        <label>Resposta aberta
          <textarea value={answer} onChange={event => setAnswer(event.target.value)}
            minLength={20} maxLength={1600} rows={5}
            placeholder="Explique com suas próprias palavras…" required disabled={!!working}/>
        </label>
        <p>Você tem uma tentativa. Revise a resposta antes de enviar.</p>
        <button className="study-primary" type="submit" disabled={answer.trim().length < 20 || !!working}>
          {working === 'answer' ? 'Avaliando…' : 'Enviar resposta definitiva'}
        </button>
      </form>}
      {challenge.status === 'grading' && <>
        <p>A resposta já foi enviada e não pode ser alterada.</p>
        <button type="button" className="study-primary" onClick={() => act('resume')} disabled={!!working}>Concluir avaliação</button>
      </>}
      {completed && <p role="status">{challenge.status === 'passed' ? 'Aprovado. ' : 'Desafio encerrado. '}{challenge.feedback}</p>}
    </div>}

    <div className="study-covers-section-head"><div><h3>Seu acervo</h3><p>{owned.length} {owned.length === 1 ? 'capa conquistada' : 'capas conquistadas'}</p></div></div>
    <div className="study-covers-challenge">
      <label>Personalizar caderno
        <select value={selectedNote} onChange={event => setSelectedNote(event.target.value)}>
          {notes.map(note => <option key={note.id} value={note.id}>{noteTitle(note)}</option>)}
        </select>
      </label>
      <button type="button" disabled={!selectedNote || !!working} onClick={() => apply(null)}>Usar capa padrão</button>
    </div>
    {owned.length > 0 && <div className="study-covers-grid study-covers-owned">
      {owned.map(id => <button type="button" key={id} className="study-cover-choice"
        disabled={!selectedNote || !!working} onClick={() => apply(id)}>
        <NotebookCoverArt coverId={id} title={coverDetails(id)?.name ?? 'Capa conquistada'} />
        <span className="study-cover-choice-caption"><strong>{coverDetails(id)?.name ?? 'Capa original'}</strong><span>Aplicar</span></span>
      </button>)}
    </div>}

    {error && <p className="study-covers-error" role="alert">{error}</p>}
    {notice && <p className="study-covers-hint" role="status">{notice}</p>}
  </section>
}
