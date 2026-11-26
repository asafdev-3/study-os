import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
const { chromium } = await import(process.env.STUDYOS_PLAYWRIGHT_MODULE ?? 'playwright-core')
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','42822','--strictPort'])
const base='http://127.0.0.1:42822'
const project=new URL(process.env.VITE_SUPABASE_URL).hostname.split('.')[0]
const user={id:'11111111-1111-4111-8111-111111111111',aud:'authenticated',role:'authenticated'}
const exp=Math.floor(Date.now()/1000)+3600
const token=[Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url'),Buffer.from(JSON.stringify({exp,sub:user.id})).toString('base64url'),'c2ln'].join('.')
let browser
try {
 for(let i=0;i<60;i++){try{if((await fetch(base)).ok) break}catch{} await new Promise(r=>setTimeout(r,100))}
 browser=await chromium.launch({headless:true,args:['--no-sandbox']})
 for(const width of [320,390,414,1024]){
  const page=await browser.newPage({viewport:{width,height:780},serviceWorkers:'block'})
  const errors=[]
  page.on('pageerror',error=>errors.push(error.message))
  await page.route('**/*',route=>{
   const url=new URL(route.request().url())
   if(url.origin===base)return route.continue()
   if(url.pathname==='/auth/v1/user')return route.fulfill({json:user})
   if(url.pathname==='/rest/v1/profiles')return route.fulfill({json:{nome:'Vitor',onboarding_completo:true}})
   if(url.pathname==='/rest/v1/annotations')return route.fulfill({json:[]})
   if(url.pathname==='/functions/v1/kira')return route.fulfill({json:{remaining:10}})
   return route.abort()
  })
  await page.addInitScript(({project,user,exp,token})=>{
   localStorage.setItem('sb-'+project+'-auth-token',JSON.stringify({access_token:token,refresh_token:'local-qa',expires_at:exp,user}))
  },{project,user,exp,token})
  await page.goto(base+'/configuracoes/aparencia')
  const lock=page.getByRole('button',{name:'Entrar no StudyOS'})
  await lock.focus();await page.keyboard.down('Space');await page.waitForTimeout(850);await page.keyboard.up('Space')
  await page.getByRole('heading',{name:'Aparência'}).waitFor()
  const nav=page.locator('.study-navigation-inner')
  const navStyle=await nav.evaluate(element=>({
   blur:getComputedStyle(element).backdropFilter,
   background:getComputedStyle(element).backgroundColor,
   radius:parseFloat(getComputedStyle(element).borderTopLeftRadius),
  }))
  assert(navStyle.blur.includes('blur(12px)'),JSON.stringify(navStyle))
  assert(navStyle.radius>=24)
  const slider=page.getByRole('slider',{name:'Intensidade do vidro'})
  await slider.focus()
  await page.keyboard.press('ArrowUp')
  assert.notEqual(await nav.evaluate(el=>getComputedStyle(el).backgroundColor),navStyle.background)
  assert.equal(Number(await page.evaluate(()=>document.documentElement.style.getPropertyValue('--ios27-glass-alpha'))),.68)
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('studyos:preferences')).glassOpacity),.68)
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow at '+width)
  assert.equal(errors.length,0,errors.join('\n'))
  console.log(width+'px: functional glass, saved transparency, layout, no JS errors')
  await page.close()
 }
} finally {await browser?.close();server.kill('SIGTERM')}
