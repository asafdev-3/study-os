import test from 'node:test'
import assert from 'node:assert/strict'
import { nfcDestination, safeDestination, rememberDestination, pendingDestination, clearDestination } from '../src/lib/nfc.js'

const values = new Map()
globalThis.window = { location: { origin: 'https://study-os-three-pearl.vercel.app' } }
globalThis.sessionStorage = {
  getItem: key => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
  removeItem: key => values.delete(key),
}

test('NFC links preserve the chosen action, area and note identifier', () => {
  assert.equal(nfcDestination('foco', 'cn'), '/nfc?acao=foco&area=cn')
  assert.equal(nfcDestination('materia', 'mt'), '/anotacoes?area=mt')
  assert.equal(nfcDestination('nota', '', 'a/b?c'), '/anotacoes?nota=a%2Fb%3Fc')
  assert.equal(nfcDestination('foco', 'invalid'), null)
  assert.equal(nfcDestination('nota', 'mt', ''), null)
  assert.equal(nfcDestination('invalid', 'mt'), null)
})

test('login continuation only accepts local study destinations', () => {
  for (const value of ['https://evil.example/nfc', '//evil.example/nfc', '/\\evil.example/nfc', '/login', '/upgrade', 'javascript:alert(1)', null]) {
    assert.equal(safeDestination(value), null)
  }
  assert.equal(safeDestination('/anotacoes?nota=123'), '/anotacoes?nota=123')
  rememberDestination('/nfc?acao=foco&area=mt')
  assert.equal(pendingDestination(), '/nfc?acao=foco&area=mt')
  clearDestination()
  assert.equal(pendingDestination(), null)
})

test('stale destinations expire and invalid storage fails safely', () => {
  sessionStorage.setItem('studyos:pending-destination', JSON.stringify({path:'/enem',until:Date.now()-1}))
  assert.equal(pendingDestination(), null)
  sessionStorage.setItem('studyos:pending-destination', 'invalid JSON')
  assert.equal(pendingDestination(), null)
  clearDestination()
})
