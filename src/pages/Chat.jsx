import { useViewportSpring } from '../lib/useViewportSpring'
import { kiraMessageMotion } from '../lib/kiraMotion'
import PromptField from '../components/PromptField'
import { m as motion } from 'framer-motion'
import { useStudyReducedMotion, pageSpring, softTransition } from '../lib/motion'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowUp, BookmarkPlus, Check, Copy, BookOpen, Camera } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { KiraAvatar } from '../components/KiraAvatar'
import { KIRA_DAILY_LIMIT } from '../lib/groq'
import { useKira } from '../lib/useKira'

const prompts = [
  { label: 'Faça um quiz', text: 'Faça um quiz curto sobre o assunto que eu quero revisar. Pergunte qual é.' },
  { label: 'Explique em 20 segundos', text: 'Explique em 20 segundos o assunto que eu quero entender. Pergunte qual é.' },
]

export default function Chat({ userId }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [activity, setActivity] = useState(false)
  const [copyStatus, setCopyStatus] = useState(null)
  const [ocrBusy, setOcrBusy] = useState(false)
  const [ocrStatus, setOcrStatus] = useState('')
  const [ocrError, setOcrError] = useState(false)
  const photoInput = useRef(null)
  const ocrActive = useRef(false)
  const mounted = useRef(true)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  const reduced = useStudyReducedMotion()
  const [input, setInput] = useState(() => location.state?.prompt ?? '')
  const { messages, remaining, loading, error, send } = useKira(true, userId ? `studyos:chat:${userId}` : null)
  const [restoredCount] = useState(messages.length)
  const log = useRef(null)
  const field = useRef(null)
  const page = useRef(null)
  const follow = useRef(true)
  const updateViewport = useViewportSpring(page, 'chat')

  useEffect(() => {
    if (location.state?.prompt) navigate(location.pathname + location.search, { replace: true, state: null })
  }, [location.state, location.pathname, location.search, navigate])

  useLayoutEffect(() => {
    const viewport = window.visualViewport
    const root = document.documentElement
    root.dataset.studyChat = ''
    let frame = 0
    let lastHeight = -1
    let lastTop = -1
    let width = window.innerWidth
    let normalHeight = viewport?.height ?? window.innerHeight

    function update() {
      frame = 0
      if (!viewport || viewport.scale !== 1) return
      if (width !== window.innerWidth) {
        width = window.innerWidth
        normalHeight = window.innerHeight
      }
      normalHeight = Math.max(normalHeight, viewport.height, window.innerHeight)
      const editing = document.activeElement === field.current
      const keyboard = normalHeight - viewport.height > 120
        && (editing || root.hasAttribute('data-study-keyboard'))
      root.toggleAttribute('data-study-keyboard', keyboard)
      const resized = viewport.height !== lastHeight
      if (resized) {
        updateViewport(viewport.height, viewport.offsetTop)
        lastHeight = viewport.height
      }
      if (viewport.offsetTop !== lastTop) {
        updateViewport(viewport.height, viewport.offsetTop)
        lastTop = viewport.offsetTop
      }
      if (resized && follow.current && log.current) log.current.scrollTop = log.current.scrollHeight
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    viewport?.addEventListener('resize', schedule)
    viewport?.addEventListener('scroll', schedule)
    window.addEventListener('resize', schedule)

    return () => {
      cancelAnimationFrame(frame)
      viewport?.removeEventListener('resize', schedule)
      viewport?.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      delete root.dataset.studyChat
      delete root.dataset.studyKeyboard
    }
  }, [updateViewport])

  useLayoutEffect(() => {
    if (follow.current && log.current) log.current.scrollTop = log.current.scrollHeight
  }, [messages, loading, error])

  async function submit(event) {
    event.preventDefault()
    if (!input.trim() || loading || ocrBusy) return
    follow.current = true
    const draft = input
    if (await send(draft, activity)) setInput((current) => current === draft ? '' : current)
  }

  async function capturePhoto(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || ocrActive.current) return
    ocrActive.current = true
    setOcrBusy(true)
    setOcrError(false)
    setOcrStatus('Preparando leitura da foto…')
    try {
      const { readPhoto } = await import('../lib/ocr')
      const text = await readPhoto(file, progress => {
        if (mounted.current) setOcrStatus('Lendo texto… ' + progress + '%')
      })
      if (!mounted.current) return
      const draft = input.trim()
      const combined = [draft, text].filter(Boolean).join('\n\n')
      setInput(combined.slice(0, 1600))
      setOcrStatus(combined.length > 1600
        ? 'Texto limitado a 1.600 caracteres. Fotografe em partes para ler o restante.'
        : 'Texto extraído. Revise e envie para a Kira.')
    } catch (error) {
      if (mounted.current) {
        setOcrError(true)
        setOcrStatus(error.message === 'Nenhum texto encontrado. Tente uma foto mais nítida.' || error.message === 'Escolha uma foto de até 20 MB.' || error.message === 'Selecione uma imagem válida.' ? error.message : 'Não foi possível ler a foto. Tente novamente com uma imagem nítida.')
      }
    } finally {
      ocrActive.current = false
      if (mounted.current) setOcrBusy(false)
    }
  }

  async function copyReply(content, index) {
    try {
      await navigator.clipboard.writeText(content)
      setCopyStatus({ index, ok: true })
    } catch {
      setCopyStatus({ index, ok: false })
    }
  }

  function saveReply(content, index) {
    const question = messages.slice(0, index).findLast(message => message.role === 'user')?.content
    navigate('/anotacoes', { state: { draft: {
      title: (question || 'Revisão com a Kira').slice(0, 120),
      content, area: 'geral',
    } } })
  }

  function choose(text) {
    setInput(text)
    field.current?.focus({ preventScroll: true })
  }

  return (
    <motion.main
      className="study-chat"
      ref={page}
      initial={reduced ? false : { opacity: 0.96, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduced ? { duration: 0 } : { y: pageSpring, opacity: softTransition }}
      style={{
        width: '100%',
        maxWidth: 'none',
        marginInline: 'auto',
        borderInline: 'none',
        background: 'transparent',
      }}
    >
      <header className="study-chat-header">
        <KiraAvatar size={44} /><div><h1>Kira</h1><small>Tutora de estudos</small></div>
        {remaining !== null && <span className="kira-quota" aria-live="polite"
          aria-label={`${remaining} mensagens restantes hoje`}>{remaining}/{KIRA_DAILY_LIMIT} hoje</span>}

      </header>

      <div
        role="log"
        className="study-chat-log"
        ref={log}
        onScroll={(e) => {
          const el = e.currentTarget
          follow.current = el.scrollHeight - el.clientHeight - el.scrollTop < 56
        }}
      >
        {messages.length === 0 && (
          <section className="kira-conversation-start" aria-label="Começar conversa">
            <h2>O que vamos<br /><em>estudar hoje?</em></h2>
            <div className="kira-shortcuts">
              {prompts.map(({ label, text }) => <button key={label} type="button" onClick={() => choose(text)}>{label}</button>)}
            </div>
          </section>
        )}

        {messages.map(({ role, content }, index) => (
          <motion.div
            key={index}
            {...kiraMessageMotion(role, reduced, index < restoredCount)}
            style={{
              display: 'flex',
              justifyContent: role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: 10,
              flexShrink: 0, minWidth: 0,
            }}
          >
            <div className={`study-reply study-reply--${role}`}>
              <p className={`study-message study-message--${role}`}>{content}</p>
              {role === 'assistant' && <div className="study-reply-actions">
                <button type="button" onClick={() => copyReply(content, index)} aria-label="Copiar resposta">
                  {copyStatus?.index === index && copyStatus.ok ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
                  {copyStatus?.index === index && copyStatus.ok ? 'Copiada' : 'Copiar'}
                </button>
                <button type="button" onClick={() => saveReply(content, index)}>
                  <BookmarkPlus size={15} aria-hidden="true" /> Guardar no caderno
                </button>
                {copyStatus?.index === index && !copyStatus.ok && <span role="status">Selecione o texto para copiar.</span>}
              </div>}
            </div>
          </motion.div>
        ))}

        {loading && (
          <p style={{ color: '#a8bddb', fontSize: 13, padding: '6px 4px' }}>
            Kira está preparando a resposta…
          </p>
        )}
      </div>

      <form onSubmit={submit} className="study-composer">
        {error && (
          <p role="alert" style={{ color: '#fda4af', fontSize: 13, padding: '0 2px 6px', overflowWrap: 'anywhere' }}>
            {error}
          </p>
        )}
        {ocrStatus && <p role={ocrError ? 'alert' : 'status'} className="study-ocr-status" data-error={ocrError}>{ocrStatus}</p>}
        <input ref={photoInput} type="file" accept="image/*" capture="environment" hidden onChange={capturePhoto} />
        <div className="study-composer-field">
          <button type="button" className="kira-mode" aria-label="Resolver atividade" title="Resolver atividade"
            aria-pressed={activity} onClick={() => { setActivity(value => !value); field.current?.focus() }}>
            <BookOpen size={19} />
          </button>
          <button type="button" className="kira-camera" aria-label="Fotografar texto" title="Fotografar texto"
            disabled={ocrBusy || loading} onClick={() => photoInput.current?.click()}>
            <Camera size={19} aria-hidden="true" />
          </button>
          <PromptField
            readOnly={ocrBusy}
            fieldRef={field}
            aria-label="Mensagem para a Kira"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={activity ? 'Cole o enunciado…' : 'Pergunte à Kira…'}
            maxLength={1600}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: '#f4f7ff', fontSize: 16, lineHeight: 1.5,
              caretColor: '#60a5fa',
            }}
          />
          <button
            type="submit"
            aria-label="Enviar mensagem"
            disabled={loading || ocrBusy || !input.trim()}

          >
            <ArrowUp size={18} aria-hidden="true" />
          </button>
        </div>
      </form>
    </motion.main>
  )
}