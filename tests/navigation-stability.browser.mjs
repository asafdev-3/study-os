import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
const { chromium } = await import(process.env.STUDYOS_PLAYWRIGHT_MODULE ?? 'playwright-core')
const server = spawn('node', ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '42827', '--strictPort'])
const base='http://127.0.0.1:42827'
const project=new URL(process.env.VITE_SUPABASE_URL).hostname.split('.')[0]
const user={ id:'11111111-1111-4111-8111-111111111111', aud:'authenticated', role:'authenticated' }
const exp=Math.floor(Date.now()/1000)+3600
const token=[Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url'),Buffer.from(JSON.stringify({exp,sub:user.id})).toString('base64url'),'c2ln'].join('.')
let browser
try {
 for(let i=0;i<50;i++){try{if((await fetch(base)).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
 browser=await chromium.launch({headless:true,args:['--no-sandbox']})
 await mkdir('qa.local',{recursive:true})
 for(const width of [320,390,414,1024]) {
  const page=await browser.newPage({viewport:{width,height:844},hasTouch:width<768,serviceWorkers:'block'})
  page.setDefaultTimeout(9000)
  const errors=[]
  page.on('pageerror',e=>errors.push(e.message))
  await page.route('**/*',route=>{
   const url=new URL(route.request().url())
   if(url.origin===base)return route.continue()
   if(url.pathname==='/auth/v1/user')return route.fulfill({json:user})
   if(url.pathname==='/rest/v1/profiles')return route.fulfill({json:{nome:'Vitor',onboarding_completo:true,area_dificuldade:'matematica',curso_objetivo:'Medicina'}})
   if(url.pathname==='/rest/v1/annotations')return route.fulfill({json:[]})
   if(url.pathname==='/rest/v1/enem_scores')return route.fulfill({json:null})
   if(url.pathname==='/functions/v1/kira')return route.fulfill({json:{remaining:10}})
   return route.abort()
  })
  await page.addInitScript(({project,user,token,exp})=>{
   localStorage.setItem('sb-'+project+'-auth-token',JSON.stringify({access_token:token,refresh_token:'local-qa',expires_at:exp,user}))
   localStorage.setItem('studyos:preferences',JSON.stringify({lock:false,reduceMotion:false,glassOpacity:.67}))
  },{project,user,token,exp})
  await page.goto(base+'/dashboard')
  await page.getByRole('heading',{name:'Olá, Vitor.'}).waitFor()
  await page.evaluate(()=>{
    window.__initialNav=document.querySelector('.study-navigation')
    window.__initialStage=document.querySelector('.study-route-stage')
    window.__loadingMutations=0
    window.__crossfades=0
    window.__navObserver=new MutationObserver(()=>{
      if(document.querySelector('.study-loading'))window.__loadingMutations++
      if(document.documentElement.dataset.studyTransition==='crossfade')window.__crossfades++
    })
    window.__navObserver.observe(document,{subtree:true,attributes:true,childList:true})
  })
  const nav=name=>page.getByRole('navigation',{name:'Navegação principal'}).getByRole('link',{name,exact:true})
  // The only link with a router state must not be intercepted or lose its prompt.
  await page.getByRole('link',{name:/Revisar Matemática com Kira/}).click()
  await page.getByRole('textbox',{name:'Mensagem para a Kira'}).waitFor()
  const input=await page.getByRole('textbox',{name:'Mensagem para a Kira'}).inputValue()
  assert(input.includes('Matemática'), 'suggested Kira prompt was lost')
  await nav('ENEM').click()
  await page.getByRole('heading',{name:'Uma questão por vez.'}).waitFor()
  await nav('Notas').click()
  await page.getByRole('heading',{name:'Seus cadernos'}).waitFor()
  await nav('Início').click()
  await page.getByRole('heading',{name:'Olá, Vitor.'}).waitFor()
  await page.waitForTimeout(250)
  const metrics=await page.evaluate(()=>({
    navSame:document.querySelector('.study-navigation')===window.__initialNav,
    stageSame:document.querySelector('.study-route-stage')===window.__initialStage,
    loadings:window.__loadingMutations,
    crossfades:window.__crossfades,
    overflow:document.documentElement.scrollWidth>innerWidth,
    active:document.querySelector('.study-tab[aria-current="page"]')?.textContent,
  }))
  assert(metrics.navSame && metrics.stageSame,JSON.stringify(metrics))
  assert.equal(metrics.loadings,0,JSON.stringify(metrics))
  assert(metrics.crossfades>0,JSON.stringify(metrics))
  assert.equal(metrics.overflow,false,JSON.stringify(metrics))
  assert.equal(metrics.active,'Início')
  assert.deepEqual(errors,[])
  if(width===390)await page.screenshot({path:'qa.local/studyos-hig-dashboard.png'})
  console.log(width+'px: menu persistente, zero splash intermediário, Kira state, ENEM/Notas/Home, crossfade')
  await page.close()
 }
} finally {await browser?.close();server.kill('SIGTERM')}
