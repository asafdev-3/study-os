import { m as motion } from 'framer-motion'
import { useStudyReducedMotion, softTransition } from '../lib/motion'
import { useLayoutEffect, useRef, useState } from 'react'
import { ArrowUp, BookOpen, ChevronRight, PencilLine } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import kiraImage from '../assets/kira-studyos.webp'
import { KIRA_DAILY_LIMIT } from '../lib/groq'
import { useKira } from '../lib/useKira'

const prompts = [
  { label: 'Explique um assunto', icon: BookOpen, text: 'Me ajude a entender um assunto do ENEM. Pergunte qual é e explique com um exemplo.' },
  { label: 'Pratique uma questão', icon: PencilLine, text: 'Crie uma questão no estilo ENEM. Pergunte qual área eu quero praticar.' },
]

export default function Chat() {
  const location = useLocation()
  const reduced = useStudyReducedMotion()
  const [input, setInput] = useState(() => location.state?.prompt ?? '')
  const { messages, remaining, loading, error, send } = useKira()
  const log = useRef(null)
  const field = useRef(null)
  const page = useRef(null)
  const follow = useRef(true)

  useLayoutEffect(() => {
    const viewport = window.visualViewport
    const element = page.current
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
        element.style.setProperty('--chat-height', `${viewport.height}px`)
        lastHeight = viewport.height
      }
      if (viewport.offsetTop !== lastTop) {
        element.style.setProperty('--chat-top', `${viewport.offsetTop}px`)
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
  }, [])

  useLayoutEffect(() => {
    if (follow.current && log.current) log.current.scrollTop = log.current.scrollHeight
  }, [messages, loading, error])

  async function submit(event) {
    event.preventDefault()
    if (!input.trim() || loading) return
    follow.current = true
    const draft = input
    if (await send(draft)) setInput((current) => current === draft ? '' : current)
  }

  function choose(prompt) {
    setInput(prompt)
    field.current?.focus({ preventScroll: true })
  }

  return (
    <motion.main className="study-chat study-page-enter" ref={page} initial={reduced ? false : { opacity: .88 }} animate={{ opacity: 1 }} transition={reduced ? { duration: 0 } : softTransition}>
      <header className="study-chat-header">
        <div className="study-kira-mark"><img src={kiraImage} alt="" width="42" height="42" /></div>
        <div><h1>Kira</h1><p>Tutora do StudyOS</p></div>
        {remaining !== null && <span aria-live="polite">{remaining}/{KIRA_DAILY_LIMIT} hoje</span>}
      </header>

      <div role="log" className="study-chat-log" ref={log} onScroll={(event) => {
        const element = event.currentTarget
        follow.current = element.scrollHeight - element.clientHeight - element.scrollTop < 56
      }}>
        {messages.length === 0 && (
          <section className="study-chat-empty">
            <h2>O que vamos estudar?</h2>
            <p>Traga uma dúvida ou pratique para o ENEM.</p>
            <div className="study-chat-prompts">{prompts.map(({ label, icon: Icon, text }) => (
              <button type="button" key={label} onClick={() => choose(text)}>
                <Icon size={18} aria-hidden="true" />{label}<ChevronRight size={15} aria-hidden="true" />
              </button>
            ))}</div>
          </section>
        )}
        {messages.map(({ role, content }, index) => (
          <motion.p key={index} initial={reduced ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : .18 }} className={`study-message study-message--${role}`}>{content}</motion.p>
        ))}
        {loading && <p className="study-chat-status">Kira está preparando a resposta…</p>}
      </div>

      <form onSubmit={submit} className="study-composer">
        {error && <p role="alert" className="study-chat-error">{error}</p>}
        <div className="study-composer-field">
          <input ref={field} aria-label="Mensagem para a Kira" value={input}
            onChange={(event) => setInput(event.target.value)} placeholder="Mensagem para a Kira"
            enterKeyHint="send" maxLength={2000} />
          <button type="submit" aria-label="Enviar mensagem" disabled={loading || !input.trim()}>
            <ArrowUp size={21} aria-hidden="true" />
          </button>
        </div>
      </form>
    </motion.main>
  )
}
