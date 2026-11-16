import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import vm from 'node:vm'
const source = stripTypeScriptTypes(readFileSync('supabase/functions/kira/index.ts', 'utf8'))
for (const [tone, expected] of [['formal','formal'],['amigo','amigável'],['seco','sem rodeios'],['unknown','amigável']]) {
 test('Groq system prompt enforces tone: ' + tone, async () => {
  let handler, sent
  vm.runInNewContext(source, { Response, AbortSignal, Deno: { env: { get: () => 'test-only' }, serve: fn => { handler = fn } }, fetch: async (url, options) => {
   if (url.endsWith('/auth/v1/user')) return Response.json({ id:'test-user' })
   if (url.includes('/rpc/')) return Response.json([{ allowed:true, remaining:9 }])
   sent = JSON.parse(options.body)
   return Response.json({ choices:[{ message:{ content:'Resposta limpa.' } }] })
  } })
  const response = await handler(new Request('https://local.test', { method:'POST', headers:{ Authorization:'Bearer test-only' }, body:JSON.stringify({ tone, messages:[{role:'user',content:'Quanto é 2 + 2?'}] }) }))
  assert.equal(response.status, 200)
  assert.equal(sent.messages[0].role, 'system')
  assert(sent.messages[0].content.includes('Nunca use markdown.'))
  assert(sent.messages[0].content.includes('TODAS as respostas'))
  assert(sent.messages[0].content.includes(expected))
 })
}
