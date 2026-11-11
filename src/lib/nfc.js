export const NFC_AREAS = {
  mt: 'Matemática', cn: 'Ciências da Natureza', ch: 'Ciências Humanas',
  lc: 'Linguagens', red: 'Redação',
}

export function nfcDestination(type, area, note) {
  if (type === 'nota') return note ? '/anotacoes?nota=' + encodeURIComponent(note) : null
  if (!Object.hasOwn(NFC_AREAS, area)) return null
  return type === 'foco' ? '/nfc?acao=foco&area=' + area
    : type === 'materia' ? '/anotacoes?area=' + area : null
}

const pendingKey = 'studyos:pending-destination'
export function safeDestination(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return null
  try {
    const url = new URL(value, window.location.origin)
    return url.origin === window.location.origin && ['/nfc', '/anotacoes', '/enem'].includes(url.pathname)
      ? url.pathname + url.search : null
  } catch { return null }
}
export function rememberDestination(value) {
  const path = safeDestination(value)
  if (!path) return
  try { sessionStorage.setItem(pendingKey, JSON.stringify({ path, until: Date.now() + 30 * 60_000 })) } catch { /* Storage may be unavailable. */ }
}
export function pendingDestination() {
  try {
    const pending = JSON.parse(sessionStorage.getItem(pendingKey))
    return pending?.until > Date.now() ? safeDestination(pending.path) : null
  } catch { return null }
}
export function clearDestination() {
  try { sessionStorage.removeItem(pendingKey) } catch { /* Storage may be unavailable. */ }
}
