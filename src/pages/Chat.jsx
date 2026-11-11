import { useEffect, useRef, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import kiraImage from '../assets/kira-studyos.webp'
import { useLocation } from 'react-router-dom'
import { KIRA_DAILY_LIMIT } from '../lib/groq'
import { useKira } from '../lib/useKira'

const prompts = [
  ['Explique um assunto', 'Me ajude a entender um assunto do ENEM. Pergunte qual é e depois explique com um exemplo.'],
  ['Pratique uma questão', 'Crie uma questão no estilo ENEM. Pergunte qual área eu quero praticar.'],
]

export default function Chat() {
  const location = useLocation()
  const [input, setInput] = useState(() => location.state?.prompt ?? '')
  const { messages, remaining, loading, error, send } = useKira()
  const log = useRef(null)
  const field = useRef(null)
  const page = useRef(null)

  useEffect(() => {
    const viewport = window.visualViewport
    const element = page.current
    if (!viewport || !element) return
    const resize = () => element.style.setProperty('--chat-height', `${Math.round(viewport.height)}px`)
    resize()
    viewport.addEventListener('resize', resize)
    return () => viewport.removeEventListener('resize', resize)
  }, [])

  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight
  }, [messages, loading])

  async function submit(event) {
    event.preventDefault()
    if (!input.trim() || loading) return
    if (await send(input)) setInput('')
  }

  function choose(prompt) {
    setInput(prompt)
    field.current?.focus()
  }

  return (
    <main className="study-chat" ref={page}>
      <header className="study-chat-header">
        <div className="study-kira-mark"><img src={kiraImage} alt="" width="40" height="40" /></div>
        <div><h1>Kira</h1><p>Assistente de estudos para o ENEM</p></div>
        {remaining !== null && <span aria-live="polite">{remaining}/{KIRA_DAILY_LIMIT} hoje</span>}
      </header>

      <div role="log" className="study-chat-log" ref={log}>
        {messages.length === 0 && (
          <section className="study-chat-empty">
            <h2>O que vamos estudar?</h2>
            <p>Traga uma dúvida ou comece por uma questão.</p>
            <div>{prompts.map(([label, prompt]) => (
              <button type="button" key={label} onClick={() => choose(prompt)}>{label}</button>
            ))}</div>
          </section>
        )}
        {messages.map(({ role, content }, index) => (
          <p key={index} className={`study-message study-message--${role}`}>{content}</p>
        ))}
        {loading && <p className="study-note">Kira está preparando a resposta…</p>}
      </div>

      <form onSubmit={submit} className="study-composer">
        {error && <p role="alert" className="study-note">{error}</p>}
        <div>
          <input ref={field} aria-label="Mensagem para a Kira" value={input}
            onChange={(event) => setInput(event.target.value)} placeholder="Pergunte à Kira…"
            maxLength={2000} readOnly={loading} />
          <button type="submit" aria-label="Enviar mensagem" disabled={loading || !input.trim()}>
            <ArrowUp size={20} aria-hidden="true" />
          </button>
        </div>
      </form>
    </main>
  )
}
