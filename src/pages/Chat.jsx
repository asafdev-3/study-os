import { useEffect, useRef, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { KIRA_DAILY_LIMIT } from '../lib/groq'
import { useKira } from '../lib/useKira'

export default function Chat() {
  const [input, setInput] = useState('')
  const { messages, remaining, loading, error, send } = useKira()
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function submit(event) {
    event.preventDefault()
    if (!input.trim() || loading) return
    if (await send(input)) setInput('')
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col max-w-sm mx-auto">
      <header className="px-4 pt-12 pb-4 flex items-center gap-3 border-b border-[#16161b]">
        <div aria-hidden="true" className="w-10 h-10 rounded-full bg-violet-500" />
        <div>
          <h1 className="font-medium text-sm">Kira</h1>
          <p className="text-zinc-400 text-xs">Assistente de estudos para o ENEM</p>
        </div>
        {remaining !== null && (
          <span className="ml-auto text-[10px] text-zinc-400" aria-live="polite">
            {remaining}/{KIRA_DAILY_LIMIT} hoje
          </span>
        )}
      </header>

      <div role="log" className="flex-1 px-4 py-5 flex flex-col gap-4 pb-36">
        {messages.length === 0 && (
          <p className="text-sm text-zinc-400">Em qual assunto você quer ajuda hoje?</p>
        )}
        {messages.map(({ role, content }, index) => (
          <div key={index} className={role === 'user'
            ? 'self-end max-w-[80%] rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3'
            : 'max-w-[88%] pl-2 border-l border-violet-500/50'}>
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{content}</p>
          </div>
        ))}
        {loading && <p className="text-sm text-zinc-400">Kira está preparando a resposta…</p>}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={submit} className="fixed bottom-[80px] left-0 right-0 max-w-sm mx-auto px-5 pb-3">
        {error && <p role="alert" className="mb-2 rounded-xl bg-zinc-900 px-3 py-2 text-sm text-rose-300">{error}</p>}
        <div className="flex items-center bg-[#0a0a0c] border border-[#16161b] rounded-2xl px-4 py-3 gap-3">
          <input
            aria-label="Mensagem para a Kira"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Pergunte à Kira…"
            maxLength={2000}
            disabled={loading}
            className="flex-1 min-w-0 bg-transparent text-base text-white outline-none placeholder-zinc-400"
          />
          <button type="submit" aria-label="Enviar mensagem" disabled={loading || !input.trim()}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-violet-600 disabled:opacity-40">
            <ArrowUp size={16} />
          </button>
        </div>
      </form>
    </div>
  )
}
