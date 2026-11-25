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