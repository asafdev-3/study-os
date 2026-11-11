import { supabase } from './supabase'

export const KIRA_DAILY_LIMIT = 10

const errorMessages = {
  DAILY_LIMIT: 'Você usou as 10 mensagens de hoje. O limite renova à meia-noite de Brasília.',
  UNAUTHENTICATED: 'Entre na sua conta para conversar com a Kira.',
  INVALID_MESSAGES: 'Envie uma mensagem de até 2.000 caracteres.',
  UNAVAILABLE: 'A Kira está indisponível agora. Tente novamente em instantes.',
}

async function invokeKira(body) {
  const { data, error } = await supabase.functions.invoke('kira', { body })
  if (!error) return data

  const response = error.context
  const details = typeof response?.json === 'function'
    ? await response.json().catch(() => null)
    : null
  const code = details?.code ?? (response?.status === 401 ? 'UNAUTHENTICATED' : 'UNAVAILABLE')
  throw Object.assign(new Error(errorMessages[code] ?? errorMessages.UNAVAILABLE), {
    code,
    remaining: details?.remaining,
  })
}

export function getKiraQuota() {
  return invokeKira({ action: 'quota' })
}

export function sendToKira(messages) {
  return invokeKira({
    messages: messages.slice(-10).map(({ role, content }) => ({ role, content: content.slice(0, 2000) })),
  })
}
