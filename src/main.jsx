import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Detecta Android no boot para ativar perfil de alta performance (Android Lite)
const isAndroid = /Android/i.test(navigator.userAgent)
if (isAndroid) {
  document.documentElement.classList.add('is-android')
  document.documentElement.dataset.platform = 'android'
} else {
  document.documentElement.dataset.platform = 'default'
}

// Controlador universal de teclado virtual (iOS Safari + Android Chrome)
if (typeof window !== 'undefined') {
  const rootEl = document.documentElement

  const updateViewportMetrics = () => {
    const vv = window.visualViewport
    if (!vv) return
    const keyboardHeight = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
    rootEl.style.setProperty('--vvh', `${vv.height}px`)
    rootEl.style.setProperty('--keyboard-offset', `${keyboardHeight}px`)
    if (keyboardHeight > 110) {
      rootEl.dataset.mobileKeyboard = 'open'
    } else {
      delete rootEl.dataset.mobileKeyboard
    }
  }

  window.visualViewport?.addEventListener('resize', updateViewportMetrics)
  window.visualViewport?.addEventListener('scroll', updateViewportMetrics)
  updateViewportMetrics()

  document.addEventListener('focusin', (event) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) return
    const isInput = target.matches('input, textarea, select, [contenteditable="true"]')
    if (!isInput) return

    // Garante que o campo focado suba acima do teclado após a abertura nativa
    window.setTimeout(() => {
      updateViewportMetrics()
      if (typeof target.scrollIntoView === 'function') {
        target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
      }
    }, 260)
  })

  document.addEventListener('focusout', () => {
    window.setTimeout(updateViewportMetrics, 120)
  })
}

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault()
  window.studyInstallPrompt = event
  window.dispatchEvent(new Event('studyos:install-ready'))
})
window.addEventListener('appinstalled', () => { window.studyInstallPrompt = null })

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch((error) => {
    console.warn('[StudyOS] Falha ao registrar o service worker.', error)
  })
}