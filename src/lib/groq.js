import { supabase } from './supabase'
import { readPreferences } from './preferences'

export const KIRA_DAILY_LIMIT = 10

const errorMessages = {
  DAILY_LIMIT: 'Você usou as 10 mensagens de hoje. O limite renova à meia-noite de Brasília.',
  UNAUTHENTICATED: 'Entre na sua conta para conversar com a Kira.',
  INVALID_MESSAGES: 'Envie uma mensagem de até 2.000 caracteres.',
  UNAVAILABLE: 'A Kira está indisponível agora. Tente novamente em instantes.',
}

async function invokeKira(body) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw Object.assign(new Error(errorMessages.UNAUTHENTICATED), { code: 'UNAUTHENTICATED' })
  const { data, error } = await supabase.functions.invoke('kira', {
    body, headers: { Authorization: `Bearer ${session.access_token}` },
  })
  if (!error && Number.isInteger(data?.remaining)
      && (body.action === 'quota' || typeof data.answer === 'string' && data.answer.trim())) return data
  if (!error) throw new Error(errorMessages.UNAVAILABLE)

  const response = error.context
  const details = typeof response?.json === 'function'
    ? await response.json().catch(() => null)
    : null
  const code = details?.code ?? (response?.status === 401 ? 'UNAUTHENTICATED' : 'UNAVAILABLE')
  if (response?.status === 429 && code === 'DAILY_LIMIT' && body.action !== 'quota') {
    window.dispatchEvent(new Event('studyos:kira-limit'))
  }
  throw Object.assign(new Error(errorMessages[code] ?? errorMessages.UNAVAILABLE), {
    code,
    remaining: details?.remaining,
  })
}

export function getKiraQuota() {
  return invokeKira({ action: 'quota' })
}

export function sendToKira(messages) {
  const tone = { formal: 'Use um tom formal e claro.', seco: 'Seja breve e direto.' }[readPreferences().kiraTone]
  const history = messages.slice(-10).map(({ role, content }) => ({ role, content: content.slice(0, 2000) }))
  if (tone && history.at(-1)?.role === 'user') {
    const last = history.at(-1)
    last.content = `${tone}

${last.content.slice(0, 2000 - tone.length - 2)}`
  }
  return invokeKira({ messages: history })
}
