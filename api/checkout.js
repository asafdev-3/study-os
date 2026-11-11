const plans = {
  mensal: { variable: 'STRIPE_PRICE_MENSAL', amount: 1899, interval: 'month' },
  anual: { variable: 'STRIPE_PRICE_ANUAL', amount: 18990, interval: 'year' },
}

async function stripe(path, key, options = {}) {
  const response = await fetch('https://api.stripe.com/v1/' + path, {
    ...options, signal: AbortSignal.timeout(10_000),
    headers: { Authorization: 'Bearer ' + key, ...options.headers },
  })
  if (!response.ok) throw new Error('Stripe API ' + response.status)
  return response.json()
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') return res.status(405).json({ code: 'METHOD_NOT_ALLOWED' })
  const { STRIPE_SECRET_KEY: key, STUDYOS_SITE_URL: site, VITE_SUPABASE_URL: supabase,
    VITE_SUPABASE_ANON_KEY: anonKey } = process.env
  // Esta integração libera exclusivamente o sandbox até existir confirmação de assinatura.
  if (!key?.startsWith('sk_test_') || !site || !supabase || !anonKey) {
    return res.status(503).json({ code: 'CHECKOUT_NOT_CONFIGURED' })
  }
  const authorization = req.headers.authorization
  if (!authorization?.startsWith('Bearer ')) return res.status(401).json({ code: 'UNAUTHENTICATED' })

  try {
    const siteUrl = new URL(site)
    if (siteUrl.protocol !== 'https:') return res.status(503).json({ code: 'CHECKOUT_NOT_CONFIGURED' })
    const auth = await fetch(new URL('/auth/v1/user', supabase), {
      headers: { Authorization: authorization, apikey: anonKey },
      signal: AbortSignal.timeout(5000),
    })
    if (!auth.ok) return res.status(auth.status < 500 ? 401 : 502).json({ code: 'AUTH_UNAVAILABLE' })
    const user = await auth.json()
    if (!user.id || user.is_anonymous) return res.status(401).json({ code: 'UNAUTHENTICATED' })

    const { plan, sessionId, attempt } = req.body ?? {}
    if (sessionId) {
      if (typeof sessionId !== 'string' || !/^cs_test_[A-Za-z0-9]+$/.test(sessionId)) {
        return res.status(400).json({ code: 'INVALID_SESSION' })
      }
      const checkout = await stripe('checkout/sessions/' + sessionId, key)
      if (checkout.client_reference_id !== user.id || checkout.mode !== 'subscription' || checkout.livemode) {
        return res.status(404).json({ code: 'INVALID_SESSION' })
      }
      return res.status(200).json({ complete: checkout.status === 'complete' && checkout.payment_status === 'paid' })
    }

    if (typeof plan !== 'string' || !Object.hasOwn(plans, plan) ||
        typeof attempt !== 'string' || !/^[a-f0-9-]{36}$/.test(attempt)) {
      return res.status(400).json({ code: 'INVALID_PLAN' })
    }
    const config = plans[plan]
    const priceId = process.env[config.variable]
    if (!/^price_[A-Za-z0-9]+$/.test(priceId ?? '')) return res.status(503).json({ code: 'CHECKOUT_NOT_CONFIGURED' })
    const price = await stripe('prices/' + priceId, key)
    if (!price.active || price.livemode || price.currency !== 'brl' || price.unit_amount !== config.amount
        || price.recurring?.interval !== config.interval || price.recurring?.interval_count !== 1) {
      return res.status(503).json({ code: 'CHECKOUT_NOT_CONFIGURED' })
    }

    const form = new URLSearchParams({
      mode: 'subscription', 'line_items[0][price]': priceId, 'line_items[0][quantity]': '1',
      client_reference_id: user.id, 'subscription_data[metadata][studyos_user_id]': user.id,
      success_url: siteUrl.origin + '/sucesso?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: siteUrl.origin + '/upgrade',
    })
    if (user.email) form.set('customer_email', user.email)
    const checkout = await stripe('checkout/sessions', key, {
      method: 'POST', body: form,
      headers: { 'Idempotency-Key': `studyos:${user.id}:${plan}:${attempt}` },
    })
    const url = new URL(checkout.url)
    if (url.origin !== 'https://checkout.stripe.com') return res.status(502).json({ code: 'CHECKOUT_UNAVAILABLE' })
    return res.status(200).json({ url: url.href })
  } catch {
    return res.status(502).json({ code: 'CHECKOUT_UNAVAILABLE' })
  }
}
