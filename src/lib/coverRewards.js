import catalog from '../../supabase/functions/cover-rewards/catalog.json'
import { supabase } from './supabase'

const byTheme = new Map(catalog.themes.map(theme => [theme.id, theme]))

export function coverDetails(id) {
  const template = typeof id === 'string' ? id.split('_').at(-1) : null
  return byTheme.get(template) ?? null
}
export const previewCovers = catalog.themes

const messages = {
  NOT_READY: 'As conquistas ainda não estão ativadas no servidor.',
  NOT_FOUND: 'As conquistas ainda não estão ativadas no servidor.',
  NOT_ELIGIBLE: 'Complete 7 dias consecutivos com pelo menos 30 minutos ativos por dia.',
  INVALID_NOTE: 'Selecione uma anotação válida.',
  NOTE_TOO_SHORT: 'Escolha uma anotação com pelo menos 120 caracteres para gerar uma questão.',
  INVALID_COVER: 'Esta capa não faz parte da coleção desta semana.',
  INVALID_ANSWER: 'Escreva pelo menos 20 caracteres antes de enviar sua única resposta.',
  NO_CHALLENGE: 'Desafio indisponível. Atualize a coleção.',
  UNAUTHENTICATED: 'Entre em sua conta para acessar as capas.',
  UNAVAILABLE: 'Não foi possível consultar as conquistas. Tente novamente.',
}
export async function coverRewards(action, data = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error(messages.UNAUTHENTICATED)
  const { data: result, error } = await supabase.functions.invoke('cover-rewards', {
    body: { action, ...data },
    headers: { Authorization: `Bearer ${session.access_token}` },
  })
  if (error || result?.code) {
    const response = error?.context
    const details = typeof response?.json === 'function'
      ? await response.json().catch(() => null) : null
    const code = result?.code ?? details?.code ?? (response?.status === 404 ? 'NOT_READY' : 'UNAVAILABLE')
    throw new Error(messages[code] ?? messages.UNAVAILABLE)
  }
  return result
}
