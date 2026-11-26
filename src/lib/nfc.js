export const NFC_AREAS = {
  mt: 'Matemática', cn: 'Ciências da Natureza', ch: 'Ciências Humanas',
  lc: 'Linguagens', red: 'Redação',
}

export function nfcDestination(type, area, note) {
  if (type === 'caverna') return '/caverna'
  if (type === 'nota') return note ? '/anotacoes?nota=' + encodeURIComponent(note) : null
  if (!Object.hasOwn(NFC_AREAS, area)) return null
  return type === 'foco' ? '/nfc?acao=foco&area=' + area
    : type === 'materia' ? '/anotacoes?area=' + area : null
}

export function nfcTagPath(destination) {
  return '/nfc?abrir=' + encodeURIComponent(destination)
}

export function nfcTagDetails(value) {
  const safe = safeDestination(value)
  if (!safe) return null
  const url = new URL(safe, window.location.origin)
  const areaId = url.searchParams.get('area')
  const area = Object.hasOwn(NFC_AREAS, areaId) ? NFC_AREAS[areaId] : null
  if (url.pathname === '/caverna') return { destination: '/caverna', title: 'Modo Caverna', description: 'Sessão de foco de 25 minutos' }
  if (url.pathname === '/nfc' && area && url.searchParams.get('acao') === 'foco' && !url.searchParams.has('abrir')) {
    return { destination: safe, title: area, description: 'Sessão de foco' }
  }
  if (url.pathname === '/anotacoes' && url.searchParams.get('nota')) return { destination: safe, title: 'Anotação', description: 'Abrir no caderno' }
  if (url.pathname === '/anotacoes' && area) return { destination: safe, title: area, description: 'Abrir caderno da matéria' }
  return null
}

const pendingKey = 'studyos:pending-destination'
export function safeDestination(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return null
  try {
    const url = new URL(value, window.location.origin)
    return url.origin === window.location.origin && ['/nfc', '/anotacoes', '/enem', '/caverna'].includes(url.pathname)
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