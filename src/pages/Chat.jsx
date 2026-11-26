import { useViewportSpring } from '../lib/useViewportSpring'
import { kiraMessageMotion } from '../lib/kiraMotion'
import PromptField from '../components/PromptField'
import { m as motion } from 'framer-motion'
import { useStudyReducedMotion, pageSpring, softTransition } from '../lib/motion'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowUp, BookmarkPlus, Check, Copy } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { KiraAvatar } from '../components/KiraAvatar'
import { KIRA_DAILY_LIMIT } from '../lib/groq'
import { useKira } from '../lib/useKira'

const prompts = [
  { label: 'Faça um quiz', text: 'Faça um quiz curto sobre o assunto que eu quero revisar. Pergunte qual é.' },
  { label: 'Explique em 20 segundos', text: 'Explique em 20 segundos o assunto que eu quero entender. Pergunte qual é.' },
  { label: 'Treinar redação', text: 'Quero treinar redação do ENEM. Me dê um tema e explique como estruturar a introdução.' },
]

export default function Chat({ userId }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [activity, setActivity] = useState(false)
  const [copyStatus, setCopyStatus] = useState(null)
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 768)
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
    const onResize = () => setIsDesktop(window.innerWidth >= 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

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
    if (!input.trim() || loading) return
    follow.current = true
    const draft = input
    if (await send(draft, activity)) setInput((current) => current === draft ? '' : current)
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
        <div><small>Assistente de estudos</small><h1>Kira</h1></div>
        {remaining !== null && <span className="kira-quota" aria-live="polite"
          aria-label={`${remaining} mensagens restantes hoje`}>{remaining}/{KIRA_DAILY_LIMIT} hoje</span>}
        <KiraAvatar size={52} />
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
            <p className="study-message study-message--assistant">Oi, eu sou a Kira. O que vamos estudar hoje?</p>
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

      <form onSubmit={submit} className="study-composer" style={{ maxWidth: isDesktop ? '860px' : '100%', width: '100%', marginInline: 'auto' }}>
        <button type="button" className="study-activity-toggle" aria-pressed={activity} onClick={() => setActivity(value => !value)}>
          Resolver atividade
        </button>
        {error && (
          <p role="alert" style={{ color: '#fda4af', fontSize: 13, padding: '0 2px 6px', overflowWrap: 'anywhere' }}>
            {error}
          </p>
        )}
        <div
          className="study-composer-field"
          style={{
            display: 'flex', alignItems: 'flex-end', gap: 8,
            background: 'rgba(20, 32, 52, 0.85)',
            border: '1px solid rgba(210, 230, 255, 0.24)',
            borderRadius: 26,
            padding: '10px 10px 10px 16px',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 10px 28px rgba(0, 0, 0, 0.22)',
            transition: 'border-color 0.15s',
          }}
          onFocusCapture={(e) => e.currentTarget.style.borderColor = 'rgba(96, 165, 250, 0.65)'}
          onBlurCapture={(e) => e.currentTarget.style.borderColor = 'rgba(210, 230, 255, 0.24)'}
        >
          <PromptField
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
            disabled={loading || !input.trim()}
            style={{
              width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: input.trim() && !loading ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : 'rgba(255, 255, 255, 0.08)',
              border: 'none', cursor: 'pointer',
              color: '#fff',
              transition: 'background 0.2s, opacity 0.2s',
              opacity: loading || !input.trim() ? 0.42 : 1,
            }}
          >
            <ArrowUp size={18} aria-hidden="true" />
          </button>
        </div>
      </form>
    </motion.main>
  )
}