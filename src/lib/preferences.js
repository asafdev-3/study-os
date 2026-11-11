const key = 'studyos:preferences'
const defaults = { lock: true, reduceMotion: false, kiraTone: 'amigo', focusAlerts: false, quiet: true }

export function readPreferences() {
  try { return { ...defaults, ...JSON.parse(localStorage.getItem(key)) } }
  catch { return { ...defaults } }
}

export function updatePreferences(patch) {
  const next = { ...readPreferences(), ...patch }
  localStorage.setItem(key, JSON.stringify(next))
  document.documentElement.dataset.studyMotion = next.reduceMotion ? 'reduced' : 'system'
  return next
}

export async function notifyFocus(sessionId) {
  const { focusAlerts, quiet } = readPreferences()
  const hour = new Date().getHours()
  if (!focusAlerts || (quiet && hour >= 2 && hour < 7)) return
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  try {
    if (localStorage.getItem('studyos:last-focus-notification') === sessionId) return
    const registration = await navigator.serviceWorker?.getRegistration()
    if (!registration) return
    await registration.showNotification('Sessão concluída', {
      body: 'Sua sessão de foco foi registrada no StudyOS.',
      icon: '/icons/icon-192.png',
      tag: 'studyos-focus-' + sessionId,
    })
    localStorage.setItem('studyos:last-focus-notification', sessionId)
  } catch { /* A sessão já foi registrada mesmo se o dispositivo recusar o aviso. */ }
}
