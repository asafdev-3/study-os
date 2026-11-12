import { useEffect, useState, useSyncExternalStore } from 'react'
import { getKiraQuota, sendToKira } from './groq'

const conversations = new Map()

function readConversation(key) {
  if (!key) return []
  try {
    const stored = JSON.parse(sessionStorage.getItem(key))
    return Array.isArray(stored) ? stored.filter(message =>
      ['user', 'assistant'].includes(message?.role) && typeof message.content === 'string'
    ).slice(-30) : []
  } catch { return [] }
}

function createConversation(key) {
  let state = { messages: readConversation(key), remaining: null, loading: false, error: '' }
  const listeners = new Set()
  let requestCount = 0
  return {
    getRequestCount: () => requestCount,
    startRequest() { requestCount += 1 },
    getSnapshot: () => state,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) },
    update(patch) {
      state = { ...state, ...patch }
      if (key && !state.loading && patch.messages) {
        try { sessionStorage.setItem(key, JSON.stringify(state.messages.slice(-30))) } catch { /* Storage unavailable: keep the conversation in memory. */ }
      }
      listeners.forEach(listener => listener())
    },
  }
}

// The caller remounts Chat by user ID. Other Kira surfaces remain independent.
export function useKira(enabled = true, storageKey = null) {
  const [store] = useState(() => {
    if (!storageKey) return createConversation(null)
    if (!conversations.has(storageKey)) conversations.set(storageKey, createConversation(storageKey))
    return conversations.get(storageKey)
  })
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot)

  useEffect(() => {
    if (!enabled) return
    let active = true
    const count = store.getRequestCount()
    getKiraQuota().then((quota) => {
      if (active && !store.getSnapshot().loading && store.getRequestCount() === count) {
        store.update({ remaining: quota.remaining })
      }
    }).catch(() => {})
    return () => { active = false }
  }, [enabled, store])

  async function send(text) {
    const content = text.trim()
    const previous = store.getSnapshot()
    if (!content || previous.loading) return false
    store.startRequest()
    const next = [...previous.messages, { role: 'user', content }]
    store.update({ messages: next, loading: true, error: '' })
    try {
      const result = await sendToKira(next)
      store.update({
        messages: [...next, { role: 'assistant', content: result.answer }].slice(-30),
        remaining: result.remaining, loading: false,
      })
      return true
    } catch (err) {
      store.update({
        messages: previous.messages, error: err.message, loading: false,
        ...(Number.isInteger(err.remaining) ? { remaining: err.remaining } : {}),
      })
      return false
    }
  }

  function clear() {
    if (store.getSnapshot().loading) return
    store.update({ messages: [], error: '' })
  }

  return { ...state, send, clear }
}
