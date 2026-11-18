import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
const { chromium } = await import(process.env.STUDYOS_PLAYWRIGHT_MODULE ?? 'playwright-core')

const base = 'http://127.0.0.1:42831'
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','42831','--strictPort'])
const testUser = { id:'11111111-1111-4111-8111-111111111111', aud:'authenticated', role:'authenticated', email:'studyos-mock@example.test', app_metadata:{provider:'email',providers:['email']}, user_metadata:{}, created_at:'2026-11-18T00:00:00Z' }
const expiry = Math.floor(Date.now()/1000) + 3600
const token = [Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url'), Buffer.from(JSON.stringify({ exp: expiry, sub:testUser.id })).toString('base64url'), 'c2ln'].join('.')
let browser
try {
  for(let i=0;i<60;i++){try{if((await fetch(base)).ok)break}catch{} await new Promise(r=>setTimeout(r,100))}
  browser=await chromium.launch({executablePath:process.env.STUDYOS_BROWSER_PATH||undefined,args:['--no-sandbox'],headless:true})
  for(const [width,height] of [[375,812],[1024,768]]){
    const page=await browser.newPage({viewport:{width,height},serviceWorkers:'block'})
    page.setDefaultTimeout(10000)
    await page.addInitScript(() => localStorage.setItem('studyos:preferences', JSON.stringify({ lock: false })))
    const errors=[]
    page.on('pageerror',e=>errors.push(e.message))
    let signupCalls=0, resendCalls=0, loginCalls=0, recoverCalls=0
    await page.route('**/*',route=>{
      const req=route.request()
      const url=new URL(req.url())
      if(url.origin===base) return route.continue()
      if(url.pathname==='/auth/v1/signup'){
        signupCalls++
        assert.equal(req.method(),'POST')
        const data=req.postDataJSON()
        assert.equal(data.email,'studyos-mock@example.test')
        assert.equal(data.password,'correct-password-123')
        return route.fulfill({status:200,json:{user:testUser,session:null}})
      }
      if(url.pathname==='/auth/v1/resend'){
        resendCalls++
        assert.equal(req.method(),'POST')
        return route.fulfill({status:200,json:{user:null,session:null}})
      }
      if(url.pathname==='/auth/v1/recover'){
        recoverCalls++
        return route.fulfill({status:200,json:{}})
      }
      if(url.pathname==='/auth/v1/token'){
        loginCalls++
        const data=req.postDataJSON()
        if(data.password!=='correct-password-123')return route.fulfill({status:400,json:{code:'invalid_credentials',msg:'Invalid login credentials'}})
        return route.fulfill({status:200,json:{access_token:token,token_type:'bearer',refresh_token:'local-test-refresh',expires_in:3600,expires_at:expiry,user:testUser}})
      }
      if(url.pathname==='/auth/v1/user')return route.fulfill({json:testUser})
      if(url.pathname==='/rest/v1/profiles')return route.fulfill({json:{nome:'Estudante',onboarding_completo:true}})
      if(url.pathname==='/rest/v1/annotations')return route.fulfill({json:[]})
      if(url.pathname==='/rest/v1/study_sessions')return route.fulfill({json:[]})
      if(url.pathname==='/functions/v1/kira')return route.fulfill({json:{remaining:10}})
      return route.abort()
    })
    await page.goto(base+'/login')
    await page.getByRole('button',{name:'Criar conta',exact:true}).first().click()
    await page.locator('input[type="email"]').fill('studyos-mock@example.test')
    await page.locator('#auth-password').fill('correct-password-123')
    await page.locator('input[name="confirmPassword"]').fill('correct-password-123')
    await page.locator('button[type="submit"]',{hasText:'Criar conta'}).click()
    await page.getByRole('button',{name:'Reenviar confirmação por e-mail'}).waitFor()
    assert.equal(signupCalls,1)
    assert.equal(await page.locator('#auth-password').inputValue(),'')
    await page.getByRole('button',{name:'Reenviar confirmação por e-mail'}).click()
    await page.getByText('Solicitação enviada.').waitFor()
    assert.equal(resendCalls,1)
    await page.getByRole('button',{name:'Entrar',exact:true}).first().click()
    await page.locator('#auth-password').fill('incorrect-password')
    await page.locator('button[type="submit"]',{hasText:'Entrar'}).click()
    await page.getByRole('alert').getByText('E-mail ou senha incorretos.').waitFor()
    await page.locator('#auth-password').fill('correct-password-123')
    await page.locator('button[type="submit"]',{hasText:'Entrar'}).click()
    await page.waitForURL('**/dashboard')
    assert.equal(loginCalls,2)
    await page.goto(base+'/esqueci-senha')
    await page.getByRole('textbox',{name:'E-mail da conta'}).fill('studyos-mock@example.test')
    await page.getByRole('button',{name:'Enviar link'}).click()
    await page.getByText('Solicitação enviada.').waitFor()
    assert.equal(recoverCalls,1)
    assert.deepEqual(errors,[])
    console.log(width+'px: cadastro com confirmação, reenvio, senha incorreta e login com sessão')
    await page.close()
  }
} finally {
  await browser?.close()
  server.kill('SIGTERM')
}
