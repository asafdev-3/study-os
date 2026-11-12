import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Copy, Radio, Smartphone, Timer } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { StudyLink } from '../components/StudyLink'
import { supabase } from '../lib/supabase'
import { FOCUS_SECONDS, readFocus } from '../lib/focus'
import { NFC_AREAS, nfcDestination } from '../lib/nfc'

export default function NFC() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [type, setType] = useState('foco')
  const [area, setArea] = useState('mt')
  const [noteId, setNoteId] = useState('')
  const [notes, setNotes] = useState(null)
  const [noteError, setNoteError] = useState(false)
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const controller = useRef(null)
  const urlInput = useRef(null)
  const action = params.get('acao')
  const targetArea = params.get('area')
  const validFocus = action === 'foco' && Object.hasOwn(NFC_AREAS, targetArea)
  const destination = nfcDestination(type, area, noteId)
  const url = destination ? window.location.origin + destination : ''

  useEffect(() => () => controller.current?.abort(), [])
  useEffect(() => {
    if (type !== 'nota') return
    let active = true
    async function load() {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) throw new Error()
      const result = await supabase.from('annotations').select('id,title').eq('user_id', user.id).order('created_at', { ascending: false })
      if (result.error) throw result.error
      if (active) { setNotes(result.data); setNoteError(false) }
    }
    load().catch(() => { if (active) setNoteError(true) })
    return () => { active = false }
  }, [type])

  async function copy() {
    try { await navigator.clipboard.writeText(url); setCopied(true); setStatus('Link copiado. Grave este endereço como URL na etiqueta.') }
    catch { urlInput.current?.focus(); urlInput.current?.select(); setStatus('Selecione e copie o endereço abaixo.') }
  }

  async function write() {
    if (!url || busy) return
    setBusy(true)
    setStatus('Aproxime uma etiqueta NFC gravável. Aguarde a confirmação.')
    controller.current = new AbortController()
    try {
      const writer = new window.NDEFReader()
      await writer.write({ records: [{ recordType: 'url', data: url }] }, { signal: controller.current.signal })
      setStatus('Etiqueta gravada. Aproxime o celular novamente para testar.')
    } catch (error) {
      setStatus(error.name === 'AbortError' ? 'Gravação cancelada.' : error.name === 'NotAllowedError'
        ? 'Permissão de NFC recusada. Você também pode copiar o link e gravar em outro aplicativo.'
        : 'Não foi possível gravar. Verifique se o NFC está ativo e se a etiqueta permite gravação.')
    } finally { setBusy(false) }
  }

  async function startFocus() {
    if (busy) return
    setBusy(true)
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) throw new Error()
      const key = `studyos:focus:${user.id}`
      const existing = readFocus(key)
      // Never replace an active, paused, or completed session through an external link.
      if (!existing) localStorage.setItem(key, JSON.stringify({
        id: crypto.randomUUID(), areaId: targetArea, seconds: FOCUS_SECONDS, deadline: Date.now() + FOCUS_SECONDS * 1000,
      }))
      navigate('/enem?modo=foco', { replace: true })
    } catch { setStatus('Não foi possível preparar a sessão. Tente novamente.'); setBusy(false) }
  }

  return (
    <main className="study-page study-nfc">
      <StudyLink className="study-nfc-back" to="/dashboard"><ArrowLeft size={18} aria-hidden="true" />Sua sala</StudyLink>
      {validFocus ? <>
        <div className="study-nfc-symbol"><Timer size={34} strokeWidth={1.2} aria-hidden="true" /></div>
        <p className="study-nfc-eyebrow">TEMPO PARA ESTUDAR</p>
        <h1>{NFC_AREAS[targetArea]}</h1>
        <p className="study-nfc-description">25 minutos, uma matéria. Se já existe uma sessão, vamos retomar de onde você parou.</p>
        <button type="button" className="study-primary" disabled={busy} onClick={startFocus}>{busy ? 'Preparando…' : 'Entrar em foco'}<ArrowRight size={17} aria-hidden="true" /></button>
      </> : <>
        <div className="study-nfc-symbol"><Radio size={34} strokeWidth={1.2} aria-hidden="true" /></div>
        <p className="study-nfc-eyebrow">DO PAPEL PARA O DIGITAL</p>
        <h1>Um toque.<br /><em>Seu espaço.</em></h1>
        <p className="study-nfc-description">Uma etiqueta na mesa abre o foco. No caderno, abre a matéria. Escolha o que você quer encontrar.</p>
        {action && <p role="alert" className="study-note">Este atalho não é válido. Crie um novo destino abaixo.</p>}
        <section className="study-nfc-builder" aria-label="Configurar etiqueta NFC">
          <label>Ação da etiqueta<select aria-label="Ação da etiqueta" value={type} disabled={busy} onChange={event => { setType(event.target.value); setCopied(false); setStatus('') }}>
            <option value="foco">Sessão de foco</option><option value="materia">Caderno de uma matéria</option><option value="nota">Uma anotação</option>
          </select></label>
          {type === 'nota' ? <label>Anotação<select aria-label="Anotação" value={noteId} disabled={busy || !notes} onChange={event => { setNoteId(event.target.value); setCopied(false); setStatus('') }}>
            <option value="">Selecione uma anotação</option>
            {notes?.map(note => <option key={note.id} value={note.id}>{note.title || 'Sem título'}</option>)}
          </select></label> : <label>Matéria<select aria-label="Matéria" value={area} disabled={busy} onChange={event => { setArea(event.target.value); setCopied(false); setStatus('') }}>
            {Object.entries(NFC_AREAS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select></label>}
          {type === 'nota' && <p className="study-note">{noteError ? 'Não foi possível carregar. Selecione outra ação e tente novamente.' : !notes ? 'Carregando anotações…' : notes.length === 0 ? 'Crie sua primeira anotação no caderno para vinculá-la.' : 'A anotação continua privada e exige login na sua conta.'}</p>}
          <label className="study-nfc-url">Endereço da etiqueta<input ref={urlInput} aria-label="Endereço da etiqueta" readOnly value={url} placeholder="Escolha o destino acima" onFocus={event => event.target.select()} /></label>
          <div className="study-nfc-buttons">
            <button className="study-primary" type="button" disabled={!url || busy} onClick={copy}><Copy size={16} aria-hidden="true" />{copied ? 'Copiado' : 'Copiar link'}</button>
            {destination && <StudyLink to={destination}>Testar destino<ArrowRight size={16} aria-hidden="true" /></StudyLink>}
          </div>
          {'NDEFReader' in window && <button className="study-nfc-write" type="button" disabled={!url} onClick={busy ? () => controller.current?.abort() : write}>{busy ? 'Cancelar gravação' : 'Gravar na etiqueta com este celular'}</button>}
        </section>
        <details className="study-nfc-help" open>
          <summary><Smartphone size={18} aria-hidden="true" />Como usar no iPhone</summary>
          <ol><li>Copie o link e grave na etiqueta como <strong>URL</strong>, usando um aplicativo de gravação NFC.</li><li>Aproxime a parte superior do iPhone da etiqueta, com a tela ligada.</li><li>Toque na notificação para abrir o destino. Entre na sua conta, se necessário.</li></ol>
          <p>No Safari, a gravação é feita pelo aplicativo externo. No Android com navegador compatível, a opção de gravar aparece acima. Não bloqueie a etiqueta contra regravação: você poderá atualizar o endereço quando trocar de domínio.</p>
        </details>
      </>}
      <p className="study-nfc-status" role="status">{status}</p>
    </main>
  )
}
