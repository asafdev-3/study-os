import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
const { chromium } = await import(process.env.STUDYOS_PLAYWRIGHT_MODULE ?? 'playwright-core')

const port = 42817
const base = `http://127.0.0.1:${port}`
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'])
let browser
const project = new URL(process.env.VITE_SUPABASE_URL).hostname.split('.')[0]
const user = { id: '11111111-1111-4111-8111-111111111111', aud: 'authenticated', role: 'authenticated' }
const exp = Math.floor(Date.now() / 1000) + 3600
const token = [Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url'), Buffer.from(JSON.stringify({ exp, sub: user.id })).toString('base64url'), 'c2ln'].join('.')

try {
  for (let i = 0; i < 70; i++) {
    try { if ((await fetch(base)).ok) break } catch { /* server starting */ }
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  browser = await chromium.launch({ executablePath: process.env.STUDYOS_BROWSER_PATH || undefined, args: ['--no-sandbox'], headless: true })
  await mkdir('qa.local', { recursive: true })
  for (const [width, height] of [[414, 896], [1280, 800]]) {
    const page = await browser.newPage({ viewport: { width, height }, serviceWorkers: 'block' })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(base + '/login')
    await page.locator('.rain-pane').waitFor()
    await page.waitForFunction(() => document.querySelector('.rain-window img')?.complete, null, { timeout: 12000 })
    await page.waitForTimeout(350)
    const glass = await page.locator('.rain-pane').evaluate(canvas => {
      const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data
      let drawn = 0
      for (let i = 3; i < data.length; i += 256) if (data[i] > 60) drawn++
      return { drawn, width: canvas.width, height: canvas.height }
    })
    assert(glass.drawn > 80, 'Glass beads canvas must be painted ' + JSON.stringify(glass))
    assert.equal(await page.locator('.kira-orbit').count(), 0, 'No orbit beneath Kira')
    assert.equal(errors.length, 0, 'Unexpected login errors: ' + errors.join(', '))
    await page.screenshot({ path: `qa.local/login-rain-${width}.png`, animations: 'disabled' })
    console.log('Rain/login', width, JSON.stringify(glass))
    await page.close()
  }
  const page = await browser.newPage({ viewport: { width: 414, height: 896 }, serviceWorkers: 'block' })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const notes = []
  let saveAttempts = 0
  await page.route('**/*', async route => {
    const req = route.request()
    const url = new URL(req.url())
    if (url.origin === base) return route.continue()
    if (url.pathname === '/auth/v1/user') return route.fulfill({ json: user })
    if (url.pathname === '/rest/v1/profiles') return route.fulfill({ json: { nome: 'Vitor', onboarding_completo: true } })
    if (url.pathname === '/rest/v1/annotations') {
      if (req.method() === 'POST') {
        saveAttempts++
        if (saveAttempts === 1) return route.fulfill({ status: 503, json: { message: 'Temporary write failure' } })
        const record = { ...req.postDataJSON(), created_at: new Date().toISOString() }
        if (!notes.some(note => note.id === record.id)) notes.push(record)
        return route.fulfill({ status: 201, body: '' })
      }
      const requestedId = url.searchParams.get('id')?.slice(3)
      return route.fulfill({ json: requestedId ? notes.find(note => note.id === requestedId) ?? null : notes })
    }
    if (url.pathname === '/functions/v1/kira') {
      if (req.postDataJSON()?.action === 'quota') return route.fulfill({ json: { remaining: 10 } })
      return route.fulfill({ json: { answer: 'Uma revisão da Kira para guardar no caderno.', remaining: 9 } })
    }
    return route.abort()
  })
  await page.addInitScript(({ project, user, exp, token }) => {
    localStorage.setItem('sb-' + project + '-auth-token', JSON.stringify({ access_token: token, refresh_token: 'local-qa', expires_at: exp, user }))
    localStorage.setItem('studyos:preferences', JSON.stringify({ lock: false }))
  }, { project, user, exp, token })

  await page.goto(base + '/anotacoes')
  await page.getByRole('button', { name: 'Nova anotação' }).waitFor({ timeout: 14000 })
  await page.getByRole('button', { name: 'Nova anotação' }).click()
  await page.getByRole('textbox', { name: 'Título' }).fill('Matemática')
  await page.locator('.study-notebook-form textarea').fill('Resumo de teste de matemática')
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await page.getByText('Não foi possível salvar sua anotação.').waitFor()
  assert.equal(await page.locator('.kira-note-saved').count(), 0, 'Failure must not animate Kira')
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await page.locator('.kira-note-saved').waitFor()
  assert.equal(notes.length, 1)
  await page.waitForTimeout(1900)
  assert.equal(await page.locator('.kira-note-saved').count(), 0, 'Feedback must auto-dismiss')
  console.log('Kira confirmed note save only after successful database write')

  await page.goto(base + '/enem')
  await page.getByRole('button', { name: 'Kira', exact: true }).click()
  await page.getByRole('textbox', { name: 'Mensagem para a Kira' }).fill('Como revisar matemática?')
  await page.getByRole('button', { name: 'Enviar mensagem' }).click()
  await page.getByRole('button', { name: 'Guardar resposta no caderno' }).waitFor({ timeout: 10000 })
  await page.getByRole('button', { name: 'Guardar resposta no caderno' }).click()
  await page.locator('.study-notebook-form').waitFor()
  assert.equal(await page.locator('.kira-note-saved').count(), 0, 'Draft must not trigger saved animation')
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await page.locator('.kira-note-saved').waitFor()
  assert.equal(notes.length, 2)
  assert.equal(errors.length, 0, 'Unexpected note-flow errors: ' + errors.join(', '))
  console.log('Kira ENEM -> draft -> saved note works')
} finally {
  await browser?.close()
  server.kill('SIGTERM')
}
