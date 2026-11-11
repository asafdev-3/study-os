import { useEffect, useRef, useState } from 'react'
import { getKiraQuota, sendToKira } from './groq'

export function useKira(enabled = true) {
  const [messages, setMessages] = useState([])
  const [remaining, setRemaining] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inFlight = useRef(false)
  const requestCount = useRef(0)

  useEffect(() => {
    if (!enabled) return
    let active = true
    const count = requestCount.current
    getKiraQuota().then((quota) => {
      if (active && !inFlight.current && requestCount.current === count) {
        setRemaining(quota.remaining)
      }
    }).catch(() => {})
    return () => { active = false }
  }, [enabled])

  async function send(text) {
    const content = text.trim()
    if (!content || inFlight.current) return false
    inFlight.current = true
    requestCount.current += 1
    const next = [...messages, { role: 'user', content }]
    setMessages(next)
    setLoading(true)
    setError('')
    try {
      const result = await sendToKira(next)
      setRemaining(result.remaining)
      setMessages([...next, { role: 'assistant', content: result.answer }])
      return true
    } catch (err) {
      setMessages(messages)
      setError(err.message)
      if (Number.isInteger(err.remaining)) setRemaining(err.remaining)
      return false
    } finally {
      inFlight.current = false
      setLoading(false)
    }
  }

  function clear() {
    if (inFlight.current) return
    setMessages([])
    setError('')
  }

  return { messages, remaining, loading, error, send, clear }
}
