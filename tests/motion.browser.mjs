import assert from 'node:assert/strict'
const { chromium } = await import(process.env.STUDYOS_PLAYWRIGHT_MODULE ?? 'playwright-core')
import { spawn } from 'node:child_process'
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','42813','--strictPort'])
const base='http://127.0.0.1:42813'
const project=new URL(process.env.VITE_SUPABASE_URL).hostname.split('.')[0]
const user={id:'11111111-1111-4111-8111-111111111111',aud:'authenticated',role:'authenticated'}
const exp=Math.floor(Date.now()/1000)+3600
const token=[Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url'),Buffer.from(JSON.stringify({exp,sub:user.id})).toString('base64url'),'c2ln'].join('.')
let browser
try{
  for(let i=0;i<45;i++){
    try{if((await fetch(base)).ok)break}catch{}
    await new Promise(resolve=>setTimeout(resolve,100))
  }
  browser=await chromium.launch({executablePath:process.env.STUDYOS_BROWSER_PATH || undefined,args:['--no-sandbox'],headless:true})
  for(const [width,height,reduced] of [[320,568,false],[414,736,false],[430,780,true],[1024,768,false]]){
    const page=await browser.newPage({viewport:{width,height},reducedMotion:reduced?'reduce':'no-preference',serviceWorkers:'block'})
    page.setDefaultTimeout(7000)
    await page.route('**/*',route=>{
      const url=new URL(route.request().url())
      if(url.origin===base)return route.continue()
      if(url.pathname==='/rest/v1/annotations')return route.fulfill({json:[]})
      if(url.pathname==='/rest/v1/enem_scores')return route.fulfill({json:null})
      if(url.pathname==='/auth/v1/user')return route.fulfill({json:user})
      if(url.pathname==='/rest/v1/profiles')return route.fulfill({json:{nome:'Vitor',onboarding_completo:true}})
      if(url.pathname==='/functions/v1/kira')return route.fulfill({json:route.request().method()==='POST'?{answer:'Vamos revisar. '+ 'Uma explicação de estudo. '.repeat(60),remaining:9}:{remaining:10}})
      return route.abort()
    })
    await page.addInitScript(({project,user,exp,token})=>{
      Object.defineProperty(document,'startViewTransition',{value:undefined})
      localStorage.setItem('sb-'+project+'-auth-token',JSON.stringify({access_token:token,refresh_token:'local-qa',expires_at:exp,user}))
      window.folds=[]; window.geometricMotion=false
      window.phases=[]
      new MutationObserver(records=>{
        for(const record of records) window.phases.push(record.target.dataset.phase)
      }).observe(document,{subtree:true,attributes:true,attributeFilter:['data-phase']})
      document.addEventListener('animationstart',event=>{
        if(['study-soft-focus','study-pane-fade'].includes(event.animationName)){ window.folds.push(location.pathname); for(const animation of event.target.getAnimations()){for(const frame of animation.effect.getKeyframes()){if(frame.transform && frame.transform!=='none')window.geometricMotion=true}}}
      })
    },{project,user,exp,token})
    await page.goto(base+'/dashboard')
    await holdLock(page)
    await page.getByRole('heading',{name:'Olá, Vitor.'}).waitFor()
    assert.deepEqual(await page.evaluate(()=>window.phases),['scan','confirmed'])
    await page.getByRole('navigation').getByRole('link',{name:'Kira'}).click()
    await page.getByRole('textbox',{name:'Mensagem para a Kira'}).waitFor()
    if(!reduced)await page.waitForFunction(()=>window.folds.includes('/chat'))
    await page.waitForTimeout(300)
    assert.equal(await page.locator('.study-chat').evaluate(el=>getComputedStyle(el).filter),'none')
    await page.evaluate(()=>{
      window.testHeight=innerHeight;window.testTop=0
      Object.defineProperty(visualViewport,'height',{configurable:true,get:()=>window.testHeight})
      Object.defineProperty(visualViewport,'offsetTop',{configurable:true,get:()=>window.testTop})
    })
    await page.getByRole('textbox',{name:'Mensagem para a Kira'}).fill('Explique matemática')
    await page.getByRole('textbox',{name:'Mensagem para a Kira'}).focus()
    await page.evaluate(()=>{window.testHeight=320;window.testTop=20;visualViewport.dispatchEvent(new Event('resize'))})
    await page.waitForFunction(()=>document.documentElement.hasAttribute('data-study-keyboard'))
    const composer=await page.locator('.study-composer').boundingBox()
    assert(composer.y+composer.height<=341)
    await page.getByRole('button',{name:'Enviar mensagem'}).click()
    await page.locator('.study-message--assistant').waitFor()
    await page.waitForTimeout(300)
    await page.evaluate(()=>{
      window.geometryWrites=0
      new MutationObserver(records=>{window.geometryWrites+=records.filter(r=>r.attributeName==='style').length}).observe(document.querySelector('.study-chat'),{attributes:true})
      for(let i=0;i<20;i++)visualViewport.dispatchEvent(new Event('scroll'))
    })
    await page.waitForTimeout(100)
    assert.equal(await page.evaluate(()=>window.geometryWrites),0)
    await page.evaluate(()=>{document.activeElement.blur();window.testHeight=innerHeight;window.testTop=0;visualViewport.dispatchEvent(new Event('resize'))})
    await page.waitForFunction(()=>!document.documentElement.hasAttribute('data-study-keyboard'))
    await page.getByRole('navigation').getByRole('link',{name:'ENEM'}).click()
    await page.getByRole('heading',{name:'Entender. Praticar. Evoluir.',exact:true}).waitFor()
    await page.locator('.study-fold').waitFor({state:'detached'})
    await page.goto(base + '/enem?modo=foco')
    await holdLock(page)
    await page.getByRole('button',{name:'Iniciar foco'}).click()
    if(!reduced)await page.waitForFunction(()=>window.folds.includes('/enem'))
    const before=await page.evaluate(()=>window.folds.filter(path=>path==='/enem').length)
    await page.getByRole('button',{name:'Ingresso',exact:true}).click()
    if(!reduced)await page.waitForFunction(count=>window.folds.filter(path=>path==='/enem').length>count,before)
    await page.getByRole('button',{name:'Foco',exact:true}).click()
    await page.getByRole('button',{name:'Pausar',exact:true}).waitFor()
    await page.waitForTimeout(450)
    assert.equal(await page.locator('.study-page-enter').evaluate(el=>getComputedStyle(el).filter),'none')
    assert.equal(await page.locator('.study-tab-indicator').count(),1)
    const active=await page.locator('.study-tab[aria-current="page"]').boundingBox()
    const indicator=await page.locator('.study-tab-indicator').boundingBox()
    assert(Math.abs(active.x-indicator.x)<2 && Math.abs(active.y-indicator.y)<2)
    if(reduced)assert.deepEqual(await page.evaluate(()=>window.folds),[])
    assert.equal(await page.evaluate(()=>window.geometricMotion),false); console.log(width+'px: Lock, Motion, indicador, chat/teclado, zero escritas redundantes, ENEM e timer validados')
    const priorAnimations=await page.evaluate(()=>window.folds.length)
    await page.evaluate(()=>{localStorage.setItem('studyos:preferences',JSON.stringify({reduceMotion:true}));window.dispatchEvent(new Event('studyos:preferences'))})
    await page.waitForFunction(()=>document.documentElement.dataset.studyMotion==='reduced')
    await page.getByRole('navigation').getByRole('link',{name:'Notas',exact:true}).click()
    await page.getByRole('heading',{name:'Anotações',exact:true}).waitFor()
    await page.waitForTimeout(250)
    assert.equal(await page.evaluate(()=>window.folds.length),priorAnimations)
    await page.close()
  }
}finally{await browser?.close();server.kill()}

async function holdLock(page) {
  const button = page.getByRole('button', { name: 'Entrar no StudyOS' })
  assert.equal(await page.locator('#study-lock-status').evaluate(el => getComputedStyle(el).userSelect), 'none')
  await button.click()
  await page.getByText('Cancelado! Segure até o fim para concluir').waitFor()
  await page.waitForTimeout(950)
  assert.equal(await button.count(), 1, 'Quick tap must never unlock')
  const box = await button.boundingBox()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.waitForTimeout(200)
  const progress = await page.locator('.study-lock-ring-progress').evaluate(el => parseFloat(el.style.strokeDashoffset))
  assert(progress > 50 && progress < 95)
  await page.mouse.move(box.x - 20, box.y)
  await page.mouse.up()
  await page.getByText('Cancelado! Segure até o fim para concluir').waitFor()
  await page.waitForTimeout(200)
  await page.evaluate(() => { window.phases = [] })
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.waitForTimeout(500)
  assert.equal(await page.locator('.study-lock[data-phase="scan"]').count(), 1)
  await page.waitForTimeout(350)
  await page.mouse.up()
}
