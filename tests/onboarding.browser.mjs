import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
const { chromium } = await import(process.env.STUDYOS_PLAYWRIGHT_MODULE ?? 'playwright-core')
const port=42851,base='http://127.0.0.1:'+port
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(port),'--strictPort'])
const project=new URL(process.env.VITE_SUPABASE_URL).hostname.split('.')[0]
const user={id:'11111111-1111-4111-8111-111111111111',role:'authenticated',aud:'authenticated',email:'qa@example.test',user_metadata:{full_name:'Asaf Teste'}}
const exp=Math.floor(Date.now()/1000)+3600
const token=[Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url'),Buffer.from(JSON.stringify({exp,sub:user.id})).toString('base64url'),'c2ln'].join('.')
let browser
try {
 for(let i=0;i<70;i++){try{if((await fetch(base)).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
 browser=await chromium.launch({headless:true,executablePath:process.env.STUDYOS_BROWSER_PATH||undefined,args:['--no-sandbox']})
 await mkdir('qa.local',{recursive:true})
 for(const [width,height] of [[320,640],[375,812],[414,896],[1024,768]]) {
  const page=await browser.newPage({viewport:{width,height},hasTouch:width<768,serviceWorkers:'block'})
  page.setDefaultTimeout(14000)
  const errors=[];let saveAttempts=0,saved=null
  page.on('pageerror',e=>errors.push(e.message))
  await page.route('**/*',route=>{
   const req=route.request(), url=new URL(req.url())
   if(url.origin===base)return route.continue()
   if(url.pathname==='/auth/v1/user')return route.fulfill({json:user})
   if(url.pathname==='/rest/v1/profiles'){
    if(req.method()==='POST'){
     saveAttempts++
     if(saveAttempts===1)return route.fulfill({status:503,json:{message:'Temporary database error'}})
     saved=req.postDataJSON();return route.fulfill({status:201,json:[saved]})
    }
    return route.fulfill({json:saved?{...saved,onboarding_completo:true}:null})
   }
   if(url.pathname==='/rest/v1/annotations')return route.fulfill({json:[]})
   if(url.pathname==='/rest/v1/enem_scores')return route.fulfill({json:null})
   if(url.pathname==='/functions/v1/kira')return route.fulfill({json:{remaining:10}})
   return route.abort()
  })
  await page.addInitScript(({project,user,token,exp})=>{
   localStorage.setItem('sb-'+project+'-auth-token',JSON.stringify({access_token:token,refresh_token:'qa-refresh',expires_at:exp,user}))
   localStorage.setItem('studyos:preferences',JSON.stringify({lock:false,reduceMotion:false}))
  },{project,user,token,exp})
  await page.goto(base+'/onboarding')
  await page.getByRole('heading',{name:'Onde você quer chegar?'}).waitFor()
  const next=page.getByRole('button',{name:'Continuar'})
  assert.equal(await next.isDisabled(),true)
  assert.equal(await page.locator('.welcome-kira-figure img').count(),1)
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)
  assert(overflow<=2,width+'px horizontal overflow '+overflow)
  await page.screenshot({path:'qa.local/onboarding-step-1-'+width+'.png',animations:'disabled'})
  await page.getByRole('button',{name:'Medicina'}).click()
  assert.equal(await next.isEnabled(),true)
  await next.click()
  await page.getByRole('heading',{name:'O que precisa de atenção?'}).waitFor()
  await page.screenshot({path:'qa.local/onboarding-step-2-'+width+'.png',animations:'disabled'})
  await page.getByRole('button',{name:'Matemática'}).click()
  await page.getByRole('button',{name:'Outro',exact:true}).click()
  await page.getByRole('textbox',{name:'Qual matéria?'}).fill('Física quântica')
  await next.click()
  await page.getByRole('heading',{name:'Como posso te chamar?'}).waitFor()
  await page.screenshot({path:'qa.local/onboarding-step-3-'+width+'.png',animations:'disabled'})
  assert.equal(await page.getByRole('textbox',{name:'SEU NOME'}).inputValue(),'Asaf')
  await page.getByRole('textbox',{name:'SEU NOME'}).fill('Asaf')
  await page.getByRole('button',{name:'Entrar no StudyOS'}).click()
  await page.getByRole('alert').getByText('Não foi possível salvar suas escolhas.',{exact:false}).waitFor()
  assert.equal(saveAttempts,1)
  await page.getByRole('button',{name:'Entrar no StudyOS'}).click()
  await page.waitForURL('**/dashboard')
  assert.equal(saveAttempts,2)
  assert.deepEqual(JSON.parse(saved.area_dificuldade),['matematica','Física quântica'])
  assert.equal(saved.curso_objetivo,'medicina')
  assert.equal(saved.nome,'Asaf')
  assert.equal(saved.onboarding_completo,true)
  assert.deepEqual(errors,[])
  console.log(width+'x'+height, '3 steps + custom + save retry + dashboard',JSON.stringify({overflow,saveAttempts}))
  await page.close()
 }
}finally{await browser?.close();server.kill('SIGTERM')}
