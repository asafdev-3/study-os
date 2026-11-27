// Product metrics, not individual tracking. No user session or persistent identifier.
import { useSyncExternalStore } from 'react'

const KEY = 'studyos.metrics.v1'
const subscribers = new Set()
function read() {
  try { return localStorage.getItem(KEY) === 'yes' ? 'yes' : localStorage.getItem(KEY) === 'no' ? 'no' : null }
  catch { return null }
}
let choice = read()
export function setMetricsChoice(value) {
  choice = value === 'yes' ? 'yes' : 'no'
  try { localStorage.setItem(KEY, choice) } catch { /* current tab only */ }
  subscribers.forEach(fn => fn())
}
window.addEventListener('storage', e => {
  if (e.key === KEY || e.key === null) {
    choice = read()
    subscribers.forEach(fn => fn())
  }
})
const subscribe = fn => { subscribers.add(fn); return () => subscribers.delete(fn) }
export function useMetricsChoice() { return useSyncExternalStore(subscribe, () => choice, () => null) }

const routes = {'/':'landing','/login':'login','/dashboard':'dashboard','/chat':'kira','/enem':'enem','/anotacoes':'notes','/nova-anotacao':'notes','/lembretes':'reminders','/caverna':'focus','/perfil':'profile','/upgrade':'upgrade','/nfc':'nfc'}
function screenFor(path) { return path.startsWith('/configuracoes') ? 'settings' : routes[path] || 'other' }
const params = new URLSearchParams(location.search)
const sourceParam = (params.get('utm_source') || params.get('source') || '').toLowerCase()
const entry = ['qr','qrcode','qr_code'].includes(sourceParam) ? 'qr' : sourceParam === 'nfc' ? 'nfc' : sourceParam ? 'unknown' : 'direct'
let opened = false
let lastScreen = null
let lastMode = null
let sent = 0
function send(event_name, screen, entry_source = 'unknown') {
  if (choice !== 'yes' || !import.meta.env.PROD || sent >= 100) return
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return
  sent += 1
  const headers = { apikey: key, 'Content-Type': 'application/json', Prefer: 'return=minimal' }
  if (key.startsWith('eyJ')) headers.Authorization = 'Bearer ' + key
  void fetch(url + '/rest/v1/studyos_growth_events', {
    method: 'POST', headers, body: JSON.stringify({event_name, screen, entry_source}),
    credentials: 'omit', referrerPolicy: 'no-referrer', keepalive: true
  }).catch(() => {})
}
export function recordMetrics(path, mode) {
  if (choice !== 'yes') { opened = false; lastScreen = null; lastMode = null; return }
  const screen = screenFor(path)
  if (!opened) { opened = true; send('app_open', screen, entry) }
  if (lastScreen !== screen) { lastScreen = screen; send('screen_view', screen) }
  if (lastMode !== mode) {
    lastMode = mode
    if (mode === 'demo') send('demo_open', screen)
    if (mode === 'account') send('account_open', screen)
  }
}
