import { m as motion } from 'framer-motion'
import { useStudyReducedMotion, cardSpring } from '../lib/motion'
import { useLayoutEffect, useRef, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import kiraImage from '../assets/kira-studyos.webp'
import { KIRA_DAILY_LIMIT } from '../lib/groq'
import { useKira } from '../lib/useKira'

const prompts = [
  { emoji: '📖', label: 'Explique um assunto', text: 'Me ajude a entender um assunto do ENEM. Pergunte qual é e explique com um exemplo.' },
  { emoji: '✏️', label: 'Pratique uma questão', text: 'Crie uma questão no estilo ENEM. Pergunte qual área eu quero praticar.' },
]

const fadeUp = (delay = 0, reduced = false) => ({
  initial: reduced ? false : { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: reduced ? { duration: 0 } : { ...cardSpring, delay },
})

export default function Chat() {
  const location = useLocation()
  const reduced = useStudyReducedMotion()
  const [input, setInput] = useState(() => location.state?.prompt ?? '')
  const { messages, remaining, loading, error, send } = useKira()
  const log = useRef(null)
  const field = useRef(null)
  const page = useRef(null)
  const follow = useRef(true)

  // Viewport e teclado — Safari-aware
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

  function choose(text) {
    setInput(text)
    field.current?.focus({ preventScroll: true })
  }

  return (
    <motion.main
      className="study-chat"
      ref={page}
      {...fadeUp(0, reduced)}
    >
      {/* Header — Upgrade-style: label small-caps + ponto verde + imagem */}
      <header className="study-chat-header" style={{ gap: 12 }}>
        <div className="study-kira-mark">
          <img src={kiraImage} alt="" width="42" height="42" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase',
            color: '#a1a1aa', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22D3A0', flexShrink: 0 }} />
            Kira
          </p>
          <h1 style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Tutora do StudyOS
          </h1>
        </div>
        {remaining !== null && (
          <span aria-live="polite" style={{
            fontSize: 11, color: '#a1a1aa', flexShrink: 0,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {remaining}/{KIRA_DAILY_LIMIT}
          </span>
        )}
      </header>

      {/* Log de mensagens */}
      <div
        role="log"
        className="study-chat-log"
        ref={log}
        onScroll={(e) => {
          const el = e.currentTarget
          follow.current = el.scrollHeight - el.clientHeight - el.scrollTop < 56
        }}
      >
        {/* Estado vazio — stagger igual ao Upgrade */}
        {messages.length === 0 && (
          <section className="study-chat-empty">
            <motion.h2 {...fadeUp(0.04, reduced)} style={{ lineHeight: 1.08 }}>
              O que vamos estudar?
            </motion.h2>
            <motion.p {...fadeUp(0.1, reduced)} style={{ color: '#a1a1aa', fontSize: 15, margin: '8px 0 20px' }}>
              Traga uma dúvida ou pratique para o ENEM.
            </motion.p>

            {/* Prompt cards — estilo recursos do Upgrade */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {prompts.map(({ emoji, label, text }, i) => (
                <motion.button
                  key={label}
                  type="button"
                  onClick={() => choose(text)}
                  {...fadeUp(0.14 + i * 0.07, reduced)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 0', background: 'transparent', border: 'none',
                    borderBottom: i < prompts.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                    background: '#0d0d10', border: '1px solid #16161b',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 17,
                  }}>
                    {emoji}
                  </div>
                  <span style={{ flex: 1, fontSize: 14, color: '#e4e4e7' }}>{label}</span>
                  <span style={{ color: '#3f3f46', fontSize: 14 }}>›</span>
                </motion.button>
              ))}
            </div>
          </section>
        )}

        {/* Mensagens */}
        {messages.map(({ role, content }, index) => (
          <motion.div
            key={index}
            initial={reduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 36, mass: 0.7 }}
            style={{
              display: 'flex',
              justifyContent: role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: 8,
            }}
          >
            <p style={{
              maxWidth: '84%',
              padding: '10px 14px',
              borderRadius: role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
              fontSize: 14,
              lineHeight: 1.55,
              color: role === 'user' ? '#f4f4f5' : '#e4e4e7',
              background: role === 'user'
                ? 'rgba(139,92,246,0.18)'
                : '#0a0a0c',
              border: role === 'user'
                ? '1px solid rgba(139,92,246,0.3)'
                : '1px solid #16161b',
              margin: 0,
            }}>
              {content}
            </p>
          </motion.div>
        ))}

        {loading && (
          <p style={{ color: '#a1a1aa', fontSize: 13, padding: '4px 2px' }}>
            Kira está preparando a resposta…
          </p>
        )}
      </div>

      {/* Compositor */}
      <form onSubmit={submit} className="study-composer">
        {error && (
          <p role="alert" style={{ color: '#fda4af', fontSize: 13, padding: '0 2px 6px', overflowWrap: 'anywhere' }}>
            {error}
          </p>
        )}
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 8,
          background: '#0a0a0c',
          border: '1px solid #16161b',
          borderRadius: 20,
          padding: '10px 10px 10px 16px',
          transition: 'border-color 0.15s',
        }}
          onFocusCapture={(e) => e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'}
          onBlurCapture={(e) => e.currentTarget.style.borderColor = '#16161b'}
        >
          <input
            ref={field}
            aria-label="Mensagem para a Kira"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte à Kira…"
            enterKeyHint="send"
            maxLength={2000}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: '#f4f4f5', fontSize: 15, lineHeight: 1.5,
              caretColor: '#8B5CF6',
            }}
          />
          <button
            type="submit"
            aria-label="Enviar mensagem"
            disabled={loading || !input.trim()}
            style={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: input.trim() && !loading
                ? 'linear-gradient(135deg, #8B5CF6, #6366F1)'
                : '#16161b',
              border: 'none', cursor: 'pointer',
              color: '#fff',
              transition: 'background 0.2s, opacity 0.2s',
              opacity: loading || !input.trim() ? 0.4 : 1,
            }}
          >
            <ArrowUp size={18} aria-hidden="true" />
          </button>
        </div>
      </form>
    </motion.main>
  )
}
