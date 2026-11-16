import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sanitizeKiraOutput as clean } from '../src/lib/sanitizeKiraOutput.js'
test('cleans formatting and emoji while retaining lists and math', () => {
 assert.equal(clean('## Resposta\n1. **Passos**\n2. *Resultado* → 42 🚀\n3. 2 * 3 = 6; 50%'), 'Resposta\n1. Passos\n2. Resultado  42\n3. 2 * 3 = 6; 50%')
 assert.equal(clean('123 0 # 1️⃣ 👩🏽‍🏫 🇧🇷'), '123 0 #')
 assert.equal(clean('Texto\n\nOutro parágrafo.'), 'Texto\n\nOutro parágrafo.')
 assert.equal(clean('• **Olá** ✓\n- item'), 'Olá\nitem')
})
