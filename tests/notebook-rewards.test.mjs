import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import vm from 'node:vm'

const catalog = JSON.parse(readFileSync('supabase/functions/cover-rewards/catalog.json', 'utf8'))
const source = stripTypeScriptTypes(readFileSync('supabase/functions/cover-rewards/index.ts','utf8'))
  .replace(/^import catalog from .*?\n/, 'const catalog = globalCatalog;\n')
const user='11111111-1111-4111-8111-111111111111'
const annotationId='22222222-2222-4222-8222-222222222222'
function todayBR() {
  const parts = new Intl.DateTimeFormat('en-US',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'})
    .formatToParts(new Date())
  const get = key => parts.find(part => part.type===key).value
  return [get('year'),get('month'),get('day')].join('-')
}
const shift = (date, days) => { const dt = new Date(date+'T12:00:00Z'); dt.setUTCDate(dt.getUTCDate()+days); return dt.toISOString().slice(0,10) }
const day = todayBR()
const days = Array.from({length:7},(_,i)=>({study_date:shift(day,-i),seconds:1800}))

function createServer({ correct = true, failFirstGrade = false } = {}) {
  let handler, prompts=0, grades=0, challenge=null, owned=[]
  const fetchMock=async (input,opts={}) => {
    const url=new URL(input)
    const method=opts.method || 'GET'
    if(url.pathname.endsWith('/auth/v1/user'))return Response.json({id:user,is_anonymous:false})
    if(url.host==='api.groq.com') {
      if(++prompts===1) return Response.json({choices:[{message:{content:JSON.stringify({question:'Qual é o papel da clorofila?',rubric:'A clorofila absorve energia luminosa, permitindo a produção de glicose.'})}}]})
      grades++
      if (failFirstGrade && grades === 1) throw new Error('Model unavailable')
      return Response.json({choices:[{message:{content:JSON.stringify({correct,feedback:correct?'A resposta demonstrou compreensão do mecanismo.':'O conceito central não foi explicado.'})}}]})
    }
    if(url.pathname.endsWith('/cover_study_days'))return Response.json(days)
    if(url.pathname.endsWith('/cover_unlocks')) {
      if(method==='POST'){const item=JSON.parse(opts.body);if(!owned.includes(item.cover_id))owned.push(item.cover_id);return Response.json([item])}
      return Response.json(owned.map(cover_id=>({cover_id})))
    }
    if(url.pathname.endsWith('/cover_challenges')) {
      if(method==='GET')return Response.json(challenge?[challenge]:[])
      if(method==='POST') {if(!challenge)challenge={status:'pending',feedback:null,...JSON.parse(opts.body)};return Response.json(challenge?[challenge]:[])}
      if(method==='PATCH') {
        const status=url.searchParams.get('status')
        if(status && 'eq.'+challenge.status!==status)return Response.json([])
        Object.assign(challenge,JSON.parse(opts.body))
        return Response.json([challenge])
      }
    }
    if(url.pathname.endsWith('/annotations')) return Response.json([{id:annotationId,title:'Fotossíntese',area:'cn',
      content:'A clorofila absorve a energia luminosa e permite que a planta produza glicose por fotossíntese. A água e o gás carbônico participam do processo e há liberação de oxigênio.'}])
    throw new Error('Mock endpoint unexpected: '+url.pathname)
  }
  vm.runInNewContext(source,{
    globalCatalog:catalog,Date,Intl,Response,Request,AbortSignal,URL,console,Map,
    Deno:{env:{get:name=>({
      SUPABASE_URL:'https://mock.supabase.co',
      SUPABASE_ANON_KEY:'test-anon',
      SUPABASE_SERVICE_ROLE_KEY:'test-service',
      GROQ_API_KEY:'test-groq',
    })[name]},serve:fn=>{handler=fn}},
    fetch:fetchMock,
  })
  async function send(payload,authorization='Bearer mock') {
    const resp=await handler(new Request('https://local.test',{method:'POST',headers:{Authorization:authorization},
      body:JSON.stringify(payload)}))
    return {status:resp.status,body:await resp.json()}
  }
  return {send,metrics:()=>({prompts,grades,challenge,owned})}
}
test('Kira rewards require an authorized user and 7 valid study days',async()=>{
  const s=createServer()
  assert.equal((await s.send({action:'status'},'')).status,401)
  const {body}=await s.send({action:'status'})
  assert.equal(body.eligible,true)
  assert.equal(body.streak,7)
  assert.equal(body.todaySeconds,1800)
  assert.equal(body.weekly.length,3)
  assert.equal(new Set(body.weekly.map(c=>c.id)).size,3)
})
test('single weekly attempt and permanent collectible',async()=>{
  const s=createServer()
  const {body:status}=await s.send({action:'status'})
  const coverId=status.weekly[0].id
  let res=await s.send({action:'start',coverId,annotationId})
  assert.equal(res.body.challenge.status,'pending')
  assert.match(res.body.challenge.question,/clorofila/)
  res=await s.send({action:'start',coverId,annotationId})
  assert.equal(res.body.challenge.status,'pending')
  assert.equal(s.metrics().prompts,1,'must reuse the weekly challenge')
  res=await s.send({action:'answer',answer:'A clorofila absorve a luz para disponibilizar energia e produzir glicose.'})
  assert.equal(res.body.challenge.status,'passed')
  assert(s.metrics().owned.includes(coverId))
  const firstAnswer=s.metrics().challenge.answer
  res=await s.send({action:'answer',answer:'Outra tentativa completamente diferente.'})
  assert.equal(res.body.challenge.status,'passed')
  assert.equal(s.metrics().challenge.answer,firstAnswer)
  assert.equal(s.metrics().grades,1)
  const final=(await s.send({action:'status'})).body
  assert(final.owned.includes(coverId))
})


test('incorrect answer consumes exactly one attempt without award',async()=>{
  const s=createServer({correct:false})
  const status=(await s.send({action:'status'})).body
  const coverId=status.weekly[0].id
  await s.send({action:'start',coverId,annotationId})
  const first=await s.send({action:'answer',answer:'A fotossíntese é apenas a respiração das plantas.'})
  assert.equal(first.body.challenge.status,'failed')
  assert.deepEqual(s.metrics().owned,[])
  const second=await s.send({action:'answer',answer:'A clorofila absorve a energia luminosa para produzir glicose.'})
  assert.equal(second.body.challenge.status,'failed')
  assert.equal(s.metrics().grades,1)
})

test('temporary grading error never permits a different answer',async()=>{
  const s=createServer({failFirstGrade:true})
  const status=(await s.send({action:'status'})).body
  await s.send({action:'start',coverId:status.weekly[0].id,annotationId})
  const first=await s.send({action:'answer',answer:'A clorofila absorve a energia luminosa para sintetizar glicose.'})
  assert.equal(first.status,503)
  assert.equal(s.metrics().challenge.status,'grading')
  const answer=s.metrics().challenge.answer
  const resumed=await s.send({action:'resume'})
  assert.equal(resumed.body.challenge.status,'passed')
  assert.equal(s.metrics().challenge.answer,answer)
  assert.equal(s.metrics().grades,2)
})
