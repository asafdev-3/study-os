import assert from 'node:assert/strict'
import { test } from 'node:test'
import handler from '../api/checkout.js'

const prices = { mensal: ['price_month',1899,'month'], anual: ['price_year',18990,'year'] }
const attempt = '10000000-0000-4000-8000-000000000001'
const user = { id: 'demo', email: 'demo@example.test' }

async function call(method, body, headers = {}) {
  const response = { setHeader() {}, status(code) { this.code = code; return this }, json(data) { this.data = data } }
  await handler({ method, body, headers }, response)
  return response
}

test('sandbox checkout validates plans, amount, owner and payment status', async t => {
  Object.assign(process.env, {
    STRIPE_SECRET_KEY: 'sk_test_fixture', STRIPE_PRICE_MENSAL: prices.mensal[0],
    STRIPE_PRICE_ANUAL: prices.anual[0], STUDYOS_SITE_URL: 'https://study.example.test',
    VITE_SUPABASE_URL: 'https://db.example.test', VITE_SUPABASE_ANON_KEY: 'fixture',
  })
  const headers = { authorization: 'Bearer fixture' }
  let reference = user.id, paid = false, wrongPrice = false
  t.mock.method(globalThis, 'fetch', async (input, options) => {
    const path = new URL(input).pathname
    if (path === '/auth/v1/user') return Response.json(user)
    if (path.startsWith('/v1/prices/')) {
      const [,amount,interval] = Object.values(prices).find(([id]) => path.endsWith('/' + id))
      return Response.json({ active:true, livemode:false, currency:'brl', unit_amount:wrongPrice ? 1 : amount, recurring:{interval,interval_count:1} })
    }
    if (path === '/v1/checkout/sessions') {
      assert.equal(options.body.get('client_reference_id'), user.id)
      assert.equal(options.body.get('mode'), 'subscription')
      assert.equal(options.body.get('success_url'), 'https://study.example.test/sucesso?session_id={CHECKOUT_SESSION_ID}')
      assert.ok(options.headers['Idempotency-Key'].endsWith(attempt))
      return Response.json({url:'https://checkout.stripe.com/c/pay/cs_test_fixture'})
    }
    assert.equal(path,'/v1/checkout/sessions/cs_test_fixture')
    return Response.json({client_reference_id:reference, mode:'subscription', livemode:false,
      status:paid ? 'complete' : 'open', payment_status:paid ? 'paid' : 'unpaid'})
  })
  assert.equal((await call('GET')).data.available,true)
  assert.equal((await call('POST',{})).code,401)
  for (const plan of Object.keys(prices)) assert.equal((await call('POST',{plan,attempt},headers)).code,200)
  wrongPrice = true
  assert.equal((await call('POST',{plan:'mensal',attempt},headers)).code,503)
  const body = {sessionId:'cs_test_fixture'}
  assert.equal((await call('POST',body,headers)).data.complete,false)
  paid = true
  assert.equal((await call('POST',body,headers)).data.complete,true)
  reference = 'different-user'
  assert.equal((await call('POST',body,headers)).code,404)
  process.env.STRIPE_SECRET_KEY = 'rk_test_fixture'
  assert.equal((await call('GET')).data.available, true)
  process.env.STRIPE_SECRET_KEY = 'rk_live_fixture'
  assert.equal((await call('GET')).data.available, false)
  delete process.env.STRIPE_SECRET_KEY
  assert.equal((await call('GET')).data.available,false)
})
