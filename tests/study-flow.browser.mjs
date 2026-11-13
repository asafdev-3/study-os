import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
const { chromium } = await import(process.env.STUDYOS_PLAYWRIGHT_MODULE ?? 'playwright-core')
const server = spawn('node', ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '42814', '--strictPort'])
const base = 'http://127.0.0.1:42814'
const project = new URL(process.env.VITE_SUPABASE_URL).hostname.split('.')[0]
const user = { id: '11111111-1111-4111-8111-111111111111', aud: 'authenticated', role: 'authenticated' }
const exp = Math.floor(Date.now() / 1000) + 3600
const token = [Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url'), Buffer.from(JSON.stringify({ exp, sub: user.id })).toString('base64url'), 'c2ln'].join('.')
const answer = 'Fotossíntese\n\nA planta transforma luz em energia.\n1. Absorve luz.\n2. Produz glicose.\n\n' + 'Um exemplo para estudar. '.repeat(22)
let browser
try {
  for (let i = 0; i < 45; i++) {
    try { if ((await fetch(base)).ok) break } catch {}
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  browser = await chromium.launch({ executablePath: process.env.STUDYOS_BROWSER_PATH || undefined, args: ['--no-sandbox'], headless: true })
  await mkdir('qa.local', { recursive: true })
  for (const [width, height] of [[320, 568], [414, 736], [1024, 768]]) {
    const page = await browser.newPage({ viewport: { width, height }, hasTouch: width < 768, serviceWorkers: 'block' })
    page.setDefaultTimeout(7000)
    const notes = []
    const errors = []
    let calls = 0, failSave = true, failEdit = true, failDelete = true, release = null, hold = false
    page.on('pageerror', error => errors.push(error.message))
    await page.route('**/*', async route => {
      const request = route.request()
      const url = new URL(request.url())
      if (url.origin === base) return route.continue()
      if (url.pathname === '/auth/v1/user') return route.fulfill({ json: user })
      if (url.pathname === '/rest/v1/profiles') return route.fulfill({ json: { nome: 'Vitor', onboarding_completo: true } })
      if (url.pathname === '/rest/v1/annotations') {
        if (request.method() === 'POST') {
          const note = request.postDataJSON()
          assert.equal(note.user_id, user.id)
          if (failSave) { failSave = false; return route.fulfill({ status: 503, json: { message: 'Temporary error' } }) }
          if (!notes.some(item => item.id === note.id)) notes.push({ ...note, created_at: new Date().toISOString() })
          return route.fulfill({ status: 201, body: '' })
        }
        if (request.method() === 'DELETE') {
          assert.equal(url.searchParams.get('user_id'), 'eq.' + user.id)
          const id = url.searchParams.get('id')?.slice(3)
          assert(notes.some(note => note.id === id))
          if (failDelete) { failDelete = false; return route.fulfill({ status: 406, json: { code: 'PGRST116', message: 'No row returned' } }) }
          notes.splice(notes.findIndex(note => note.id === id), 1)
          return route.fulfill({ json: { id } })
        }
        if (request.method() === 'PATCH') {
          assert.equal(url.searchParams.get('user_id'), 'eq.' + user.id)
          assert.equal(url.searchParams.get('id'), 'eq.' + notes[0].id)
          if (failEdit) { failEdit = false; return route.fulfill({ status: 406, json: { message: 'No row returned', code: 'PGRST116' } }) }
          Object.assign(notes[0], request.postDataJSON())
          return route.fulfill({ json: notes[0] })
        }
        return route.fulfill({ json: url.searchParams.has('id') ? notes.find(note => 'eq.' + note.id === url.searchParams.get('id')) : notes })
      }
      if (url.pathname === '/functions/v1/kira') {
        if (request.postDataJSON()?.action === 'quota') return route.fulfill({ json: { remaining: 10 - calls } })
        const last = request.postDataJSON()?.messages?.at(-1)?.content
        assert.match(last, /ensine automaticamente/)
        if (calls === 0) assert.match(last, /Modo atividade/)
        calls++
        if (hold) await new Promise(resolve => { release = resolve })
        return route.fulfill({ json: { answer, remaining: 10 - calls } })
      }
      return route.abort()
    })
    await page.addInitScript(({ project, user, exp, token }) => {
      localStorage.setItem('sb-' + project + '-auth-token', JSON.stringify({ access_token: token, refresh_token: 'local-qa', expires_at: exp, user }))
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: async text => { if (window.failCopy) throw new Error('Denied'); window.copied = text } } })
    }, { project, user, exp, token })
    const nav = name => page.getByRole('navigation').getByRole('link', { name, exact: true })
    await page.goto(base + '/dashboard')
    await holdLock(page)
    await page.getByRole('heading', { name: 'Olá, Vitor.' }).waitFor()
    if (width < 768) {
      await page.waitForTimeout(400)
      const dock = await page.locator('.study-room-dock').boundingBox()
      const bar = await page.locator('.study-navigation').boundingBox()
      assert(dock.y + dock.height <= bar.y + 4, 'Home actions must clear navbar: ' + JSON.stringify({dock,bar}))
      await page.screenshot({ path: 'qa.local/home-static-' + width + '.png' })
    }
    await nav('ENEM').click()
    await page.getByRole('heading', { name: 'Entender. Praticar. Evoluir.' }).waitFor()
    await page.getByText('Meu diário de erros', { exact: false }).click()
    await page.getByLabel('Assunto ou questão').fill('Porcentagem')
    await page.getByRole('button', { name: 'Guardar em Matemática' }).click()
    await page.getByRole('status').filter({ hasText: 'Guardado' }).waitFor()
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    await page.screenshot({ path: 'qa.local/enem-practice-' + width + '.png' })
    await page.getByRole('group', { name:'Seções do modo ENEM' }).getByRole('button', { name:'Post-its', exact:true }).click()
    await page.getByRole('button', { name:'Novo post-it' }).click()
    await page.getByPlaceholder('O que precisa lembrar?').fill('Revisar porcentagem e resolver duas questões.')
    await page.getByRole('button', { name:'Colar post-it' }).click()
    await page.locator('.study-paper-postit').waitFor()
    const complete = page.getByRole('button', { name:'Concluir: Revisar porcentagem e resolver duas questões.' })
    await complete.click()
    assert.equal(await page.getByRole('button', { name:'Marcar como pendente: Revisar porcentagem e resolver duas questões.' }).getAttribute('aria-pressed'), 'true')
    if (width === 414) await page.screenshot({ path:'qa.local/postits-paper.png' })
    await page.getByRole('button', { name: 'Ingresso', exact: true }).click()
    await page.getByRole('heading', { name: 'Onde sua nota pode chegar?' }).waitFor()
    for (const area of ['Linguagens','Humanas','Natureza','Matemática','Redação']) await page.getByLabel('Nota de ' + area, { exact: true }).fill('900')
    await page.getByLabel('Estado onde moro').selectOption('MG')
    await page.getByLabel('Cidade onde moro').fill('Belo Horizonte')
    await page.getByRole('button', { name: 'Comparar minha nota' }).click()
    await page.locator('.study-admission-card').first().waitFor()
    assert((await page.locator('.study-admission-card > span').allTextContents()).every(text => text.includes('Belo Horizonte/MG')))
    await page.getByLabel('Cidade onde moro').fill('Cidade inexistente')
    await page.getByRole('button', { name: 'Comparar minha nota' }).click()
    await page.getByRole('heading', { name: 'Nenhum curso neste filtro' }).waitFor()
    await page.getByRole('button', { name: 'Buscar em todo o Brasil' }).click()
    await page.locator('.study-admission-card').first().waitFor()
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    if (width === 414) await page.screenshot({ path:'qa.local/admissions.png' })
    await page.getByRole('group', { name:'Seções do modo ENEM' }).getByRole('button', { name:'Kira', exact:true }).click()
    await page.waitForTimeout(400)
    const composer = await page.locator('.study-enem-chat .study-composer').boundingBox()
    assert(composer.y > height * .65, 'ENEM composer belongs at the bottom')
    if (width < 768) {
      const bar = await page.locator('.study-navigation').boundingBox()
      assert(composer.y + composer.height <= bar.y + 2, 'ENEM composer must clear navigation')
      assert(bar.y - composer.y - composer.height < 55, 'ENEM composer must sit near navigation')
    }
    if (width === 414) await page.screenshot({ path:'qa.local/enem-chat-fixed.png' })
    if (width === 414) {
      await page.getByLabel('Mensagem para a Kira').focus()
      await page.evaluate(() => {
        Object.defineProperty(visualViewport, 'height', { configurable:true, value:400 })
        visualViewport.dispatchEvent(new Event('resize'))
      })
      await page.waitForFunction(() => document.documentElement.hasAttribute('data-study-keyboard'))
      const keyboardComposer = await page.locator('.study-enem-chat .study-composer').boundingBox()
      assert(keyboardComposer.y + keyboardComposer.height <= 400, 'Composer must clear simulated keyboard')
      assert(!(await page.locator('.study-navigation').isVisible()))
      await page.evaluate(() => {
        delete visualViewport.height
        visualViewport.dispatchEvent(new Event('resize'))
      })
      await page.waitForFunction(() => !document.documentElement.hasAttribute('data-study-keyboard'))
    }

    await nav('Kira').click()
    const input = page.getByRole('textbox', { name: 'Mensagem para a Kira' })
    const character = page.locator('.study-chat-header .study-kira-character img')
    assert.equal(await character.evaluate(el => getComputedStyle(el).objectFit), 'contain')
    assert.equal(await character.evaluate(el => getComputedStyle(el).borderRadius), '0px')
    if (width === 414) { await page.waitForTimeout(450); await page.screenshot({ path: 'qa.local/kira-character.png' }) }
    await page.getByRole('button', { name: 'Resolver atividade' }).click()
    await input.fill('Explique fotossíntese')
    assert.equal(await input.evaluate(el => getComputedStyle(el).fontSize), '16px')
    await page.getByRole('button', { name: 'Enviar mensagem' }).click()
    await page.locator('.study-message--assistant').waitFor()
    assert.equal(await page.locator('.study-message--assistant').evaluate(el => getComputedStyle(el).whiteSpace), 'pre-wrap')
    await page.getByRole('button', { name: 'Copiar resposta' }).click()
    assert.equal(await page.evaluate(() => window.copied), answer)
    await page.evaluate(() => { window.failCopy = true })
    await page.getByRole('button', { name: 'Copiar resposta' }).click()
    await page.getByRole('status').filter({ hasText: 'Selecione o texto' }).waitFor()
    await page.getByRole('button', { name: 'Guardar no caderno' }).click()
    const dialog = page.getByRole('form', { name: 'Nova anotação' })
    await dialog.waitFor()
    assert.equal(await dialog.getByLabel('Texto', { exact: true }).inputValue(), answer)
    assert.equal(calls, 1)
    await dialog.getByLabel('Título', { exact: true }).fill('Fotossíntese — revisão')
    await dialog.locator('summary').click()
    await dialog.getByRole('radio', { name: 'Ciências da Natureza' }).check()
    await dialog.getByRole('button', { name: 'Salvar', exact: true }).click()
    await dialog.getByRole('alert').waitFor()
    assert.equal(await dialog.getByLabel('Texto', { exact: true }).inputValue(), answer)
    await dialog.getByRole('button', { name: 'Salvar', exact: true }).click()
    await dialog.waitFor({ state: 'detached' })
    assert.equal(notes.length, 1)
    await page.getByRole('status').filter({ hasText: 'guardada' }).waitFor()
    await page.getByRole('button', { name: 'Editar', exact: true }).click()
    const edit = page.getByRole('form', { name: 'Editar anotação' })
    await edit.getByLabel('Título', { exact: true }).fill('Fotossíntese e clorofila')
    await edit.getByRole('button', { name: 'Salvar', exact: true }).click()
    await edit.getByRole('alert').waitFor()
    assert.equal(notes[0].title, 'Fotossíntese — revisão')
    await edit.getByRole('button', { name: 'Salvar', exact: true }).click()
    await edit.waitFor({ state: 'detached' })
    assert.equal(notes[0].title, 'Fotossíntese e clorofila')
    assert.equal(notes.length, 1)
    assert.equal(await page.locator('.study-book-writing').count(), 1)
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    const fab = await page.getByRole('button', { name: 'Nova anotação' }).boundingBox()
    const navigation = await page.getByRole('navigation', { name: 'Navegação principal' }).boundingBox()
    if (width < 768) assert(fab.y + fab.height < navigation.y, 'FAB must stay above navigation')
    await page.getByRole('button', { name: 'Nova anotação' }).click()
    const second = page.getByRole('form', { name: 'Nova anotação' })
    await second.getByLabel('Título', { exact: true }).fill('Segunda página')
    await second.getByLabel('Texto', { exact: true }).fill('Uma ideia por vez.')
    await second.getByRole('button', { name: 'Salvar', exact: true }).click()
    await second.waitFor({ state: 'detached' })
    assert.equal(await page.locator('.study-book-writing').count(), 1)
    await page.getByRole('button', { name: 'Próxima página' }).click()
    await page.getByRole('heading', { name: 'Fotossíntese e clorofila' }).waitFor()
    assert(await page.getByRole('button', { name: 'Próxima página' }).isDisabled())
    if (width < 700) {
      assert(!(await page.getByRole('textbox', { name: 'Buscar anotações' }).count()))
      await page.getByRole('button', { name: /Índice e busca/ }).click()
      await page.getByRole('searchbox', { name: 'Buscar anotações' }).fill('Fotossíntese')
      assert.equal(await page.locator('.study-book-index li').count(), 1)
      await page.getByRole('button', { name: /Fechar índice/ }).click()
    }
    await page.evaluate(() => window.scrollTo(0, 0))
    if (width === 414 || width === 1024) await page.screenshot({ path: 'qa.local/notebook-' + width + '.png' })

    await page.getByRole('button', { name: 'Revisar com Kira' }).click()
    await input.waitFor()
    assert.match(await input.inputValue(), /Fotossíntese e clorofila/)
    assert((await input.inputValue()).length < 2000)
    assert.equal(calls, 1, 'Review must wait for explicit send')
    assert.equal(await page.locator('.study-message--assistant').count(), 1)
    // Return during an in-flight request: preserve loading, prevent another request, then show the answer.
    hold = true
    await page.getByRole('button', { name: 'Enviar mensagem' }).click()
    await page.waitForFunction(() => document.querySelector('button[aria-label="Enviar mensagem"]').disabled)
    await nav('Notas').click()
    await nav('Kira').click()
    await page.getByText('Kira está preparando a resposta…').waitFor()
    assert(await page.getByRole('button', { name: 'Enviar mensagem' }).isDisabled())
    release()
    await page.waitForFunction(() => document.querySelectorAll('.study-message--assistant').length === 2)
    assert.equal(calls, 2)
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.study-chat')).opacity === '1' && [...document.querySelectorAll('.study-chat-log > div')].every(el => getComputedStyle(el).opacity === '1'))
    if (width === 414) await page.screenshot({ path: 'qa.local/study-flow-chat.png' })
    await page.reload()
    await holdLock(page)
    await page.waitForFunction(() => document.querySelectorAll('.study-message--assistant').length === 2)
    await nav('Notas').click()
    await page.getByRole('button', { name:'Apagar anotação', exact:true }).waitFor()
    page.once('dialog', dialog => dialog.dismiss())
    await page.getByRole('button', { name:'Apagar anotação', exact:true }).click()
    assert.equal(notes.length, 2)
    page.once('dialog', dialog => dialog.accept())
    await page.getByRole('button', { name:'Apagar anotação', exact:true }).click()
    await page.getByRole('status').filter({ hasText:'Sua anotação foi mantida' }).waitFor()
    assert.equal(notes.length, 2)
    page.once('dialog', dialog => dialog.accept())
    await page.getByRole('button', { name:'Apagar anotação', exact:true }).click()
    await page.getByRole('status').filter({ hasText:'Anotação apagada' }).waitFor()
    assert.equal(notes.length, 1)
    assert.equal(errors.length, 0, errors.join('\n'))
    console.log(width + 'px: copiar/fallback, criar/repetir, editar/erro, revisão sem chamada extra, conversa entre abas/em voo/reload, sem overflow.')
    await page.close()
  }
} finally { await browser?.close(); server.kill() }

async function holdLock(page) {
  const button = page.getByRole('button', { name: 'Entrar no StudyOS' })
  await button.focus()
  await page.keyboard.down('Space')
  await page.waitForTimeout(850)
  await page.keyboard.up('Space')
}
