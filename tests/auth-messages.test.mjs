import test from 'node:test'
import assert from 'node:assert/strict'
import { authMessage } from '../src/lib/authMessage.js'

test('maps password login failures clearly', () => {
  assert.equal(authMessage({ code: 'invalid_credentials' }), 'E-mail ou senha incorretos.')
})
test('handles confirmation and weak password', () => {
  assert.match(authMessage({ code: 'email_not_confirmed' }), /Confirme seu e-mail/)
  assert.match(authMessage({ code: 'weak_password' }, 'signup'), /senha mais forte/)
})
test('displays rate limits and connectivity problems without leaking raw messages', () => {
  assert.match(authMessage({ status: 429, message: 'too many requests' }), /Muitas tentativas/)
  assert.match(authMessage({ message: 'Failed to fetch' }), /Falha de conexão/)
})
test('handles email provider and server failures', () => {
  assert.match(authMessage({ code: 'email_send_failure' }, 'signup'), /enviar o e-mail/)
  assert.match(authMessage({ status: 503 }), /indisponível/)
})
