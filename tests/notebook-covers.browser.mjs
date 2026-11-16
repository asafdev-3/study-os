import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
const { chromium } = await import(process.env.STUDYOS_PLAYWRIGHT_MODULE ?? 'playwright-core')
const server = spawn('node', ['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','42819','--strictPort'])
const base = 'http://127.0.0.1:42819'
const project = new URL(process.env.VITE_SUPABASE_URL).hostname.split('.')[0]
const user = { id: '11111111-1111-4111-8111-111111111111', aud:'authenticated', role:'authenticated' }
const id = '22222222-2222-4222-8222-222222222222'
const exp = Math.floor(Date.now()/1000) + 3600
const token = [Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url'),Buffer.from(JSON.stringify({ exp, sub: user.id })).toString('base64url'),'c2ln'].join('.')
let browser
try {
  for(let i=0;i<60;i++){try{if((await fetch(base)).ok) break}catch{} await new Promise(r=>setTimeout(r,100))}
  browser=await chromium.launch({headless:true,args:['--no-sandbox']})
  for(const width of [320,414,1024]){
    const page=await browser.newPage({viewport:{width,height:768},serviceWorkers:'block'})
    const errors=[]
    page.on('pageerror',e=>errors.push(e.message))
    let note = {id,user_id:user.id,title:'Fotossíntese',content:'Plantas convertem energia luminosa em energia química por meio da fotossíntese. A clorofila absorve luz, permitindo a síntese de glicose a partir de gás carbônico e água, com liberação de oxigênio.',area:'cn',created_at:new Date().toISOString(),cover_id:null}
    let challenge=null
    let owned=[]
    let submitted=0
    const edition='2026-11-16_orbital'
    await page.route('**/*',route=>{
      const request=route.request()
      const url=new URL(request.url())
      if(url.origin===base)return route.continue()
      if(url.pathname==='/auth/v1/user')return route.fulfill({json:user})
      if(url.pathname==='/rest/v1/profiles')return route.fulfill({json:{nome:'Vitor',onboarding_completo:true}})
      if(url.pathname==='/rest/v1/annotations'){
        if(request.method()==='PATCH') {
          assert.equal(url.searchParams.get('id'),'eq.'+id)
          assert(owned.includes(request.postDataJSON().cover_id))
          note={...note,...request.postDataJSON()}
          return route.fulfill({json:note})
        }
        return route.fulfill({json:url.searchParams.get('select')==='id,cover_id'?[{id,cover_id:note.cover_id}]:[note]})
      }
      if(url.pathname==='/functions/v1/cover-rewards'){
        const body=request.postDataJSON()
        if(body.action==='status')return route.fulfill({json:{
          weekStart:'2026-11-16',dailyGoalSeconds:1800,todaySeconds:1800,streak:7,eligible:true,
          weekly:[{id:edition,name:'Órbita Silenciosa'},{id:'2026-11-16_jardim',name:'Jardim Noturno'},{id:'2026-11-16_aurora',name:'Aurora Elétrica'}],
          owned,challenge
        }})
        if(body.action==='start'){
          assert.equal(body.annotationId,id)
          assert.equal(body.coverId,edition)
          challenge={coverId:edition,question:'Como a luz solar participa da produção de glicose nas plantas?',status:'pending',feedback:null}
          return route.fulfill({json:{challenge}})
        }
        if(body.action==='answer'){
          submitted++
          assert(submitted===1)
          assert(body.answer.length>=20)
          challenge={...challenge,status:'passed',feedback:'Explicação correta.'}
          owned=[edition]
          return route.fulfill({json:{challenge}})
        }
      }
      return route.abort()
    })
    await page.addInitScript(({project,user,exp,token})=>{
      localStorage.setItem('sb-'+project+'-auth-token',JSON.stringify({access_token:token,refresh_token:'local-qa',expires_at:exp,user}))
    },{project,user,exp,token})
    await page.goto(base+'/anotacoes')
    const lock=page.getByRole('button',{name:'Entrar no StudyOS'})
    await lock.focus();await page.keyboard.down('Space');await page.waitForTimeout(850);await page.keyboard.up('Space')
    await page.getByRole('heading',{name:'Seus cadernos'}).waitFor()
    await page.getByRole('button',{name:'Capas',exact:true}).click()
    await page.getByRole('heading',{name:'Capas que contam histórias.'}).waitFor()
    await page.getByRole('button',{name:'Iniciar desafio'}).click()
    await page.getByText('Como a luz solar participa da produção').waitFor()
    await page.getByRole('textbox',{name:'Resposta aberta'}).fill('A clorofila capta luz e usa essa energia para produzir glicose a partir de água e gás carbônico.')
    await page.getByRole('button',{name:'Enviar resposta definitiva'}).click()
    await page.getByText('Capa conquistada.').waitFor()
    await page.getByRole('button',{name:/Órbita Silenciosa.*Aplicar/}).click()
    await page.getByText('Capa aplicada ao caderno.').waitFor()
    await page.getByRole('button',{name:'Voltar à gaveta'}).click()
    assert.equal(await page.locator('.study-closed-book .study-cover-art[data-motif="orbit"]').count(),1)
    assert(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),'horizontal overflow at '+width)
    assert.equal(errors.length,0,errors.join('\n'))
    console.log(width+'px: catálogo, sequência, questão, resposta única, acervo e aplicação validados')
    await page.close()
  }
} finally {
  await browser?.close()
  server.kill('SIGTERM')
}
