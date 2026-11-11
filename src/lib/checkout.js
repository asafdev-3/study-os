import { supabase } from './supabase'

export async function callCheckout(body) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Entre com Google antes de abrir o checkout.')
  const response = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify(body),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.code === 'CHECKOUT_NOT_CONFIGURED'
    ? 'Checkout em configuração.' : 'Não foi possível confirmar o checkout. Tente novamente.')
  return data
}
