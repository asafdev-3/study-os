import { useEffect, useRef, useState } from 'react'
import { Download, PlusSquare, Share, Sparkles, X } from 'lucide-react'

const DISMISS_KEY = 'studyos:pwa-modal-dismissed'

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true
}

function isIosDevice() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export default function InstallPwaModal({ auto }) {
  const [deferredPrompt, setDeferredPrompt] = useState(() => window.studyInstallPrompt)
  const [open, setOpen] = useState(false)
  const [installing, setInstalling] = useState(false)
  const dialog = useRef(null)
  const ios = isIosDevice()

  useEffect(() => {
    const show = () => setOpen(true)
    const eligible = () => auto && !isStandalone() && sessionStorage.getItem(DISMISS_KEY) !== '1'
    const ready = () => {
      setDeferredPrompt(window.studyInstallPrompt)
      if (eligible()) show()
    }
    const installed = () => { setDeferredPrompt(null); setOpen(false) }
    const timer = (!window.studyInstallPrompt && /Android/i.test(navigator.userAgent) || ios || window.studyInstallPrompt) && eligible() ? setTimeout(show, 2500) : null
    window.addEventListener('studyos:install', show)
    window.addEventListener('studyos:install-ready', ready)
    window.addEventListener('appinstalled', installed)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('studyos:install', show)
      window.removeEventListener('studyos:install-ready', ready)
      window.removeEventListener('appinstalled', installed)
    }
  }, [ios, auto])

  useEffect(() => {
    if (open && dialog.current && !dialog.current.open) dialog.current.showModal()
  }, [open])

  function close() {
    sessionStorage.setItem(DISMISS_KEY, '1')
    setOpen(false)
  }

  async function installNow() {
    if (!deferredPrompt || installing) return
    setInstalling(true)
    try {
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      if (choice?.outcome === 'accepted') {
        setOpen(false)
      }
    } catch {
      setOpen(true)
    } finally {
      window.studyInstallPrompt = null
      setDeferredPrompt(null)
      setInstalling(false)
    }
  }

  if (!open) return null

  return (
    <dialog
      ref={dialog}
      onCancel={close}
      aria-modal="true"
      aria-labelledby="pwa-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        width: '100%', height: '100%', maxWidth: 'none', maxHeight: 'none', border: 0,
        display: 'grid',
        placeItems: 'center',
        padding: '20px',
        background: 'rgba(4, 10, 20, 0.72)',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: 'min(100%, 390px)',
          padding: '24px',
          borderRadius: '26px',
          background: 'linear-gradient(155deg, rgba(22, 38, 62, 0.96), rgba(10, 20, 36, 0.98))',
          border: '1px solid rgba(210, 230, 255, 0.24)',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
          color: '#f2f7ff',
        }}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Fechar janela de instalação"
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            background: 'rgba(255, 255, 255, 0.06)',
            color: '#c7d6ec',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
          }}
        >
          <X size={16} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
          <img
            src="/icons/icon-192.png"
            alt="StudyOS"
            width="46"
            height="46"
            style={{ borderRadius: '13px', border: '1px solid rgba(255,255,255,0.2)' }}
          />
          <div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', letterSpacing: '0.08em', color: '#9ec5ff', textTransform: 'uppercase', fontWeight: 600 }}>
              <Sparkles size={12} /> Tela inicial
            </span>
            <h2 id="pwa-modal-title" style={{ margin: '2px 0 0', fontSize: '19px', fontWeight: 650, letterSpacing: '-0.02em' }}>
              Instalar o StudyOS
            </h2>
          </div>
        </div>

        <p style={{ margin: '0 0 18px', fontSize: '14px', lineHeight: 1.5, color: '#c8d6ea' }}>
          Abra sua sala de estudos pelo ícone do StudyOS.
        </p>

        {isStandalone() ? <p>O StudyOS já está instalado neste dispositivo.</p> : deferredPrompt ? (
          <button
            type="button"
            onClick={installNow}
            disabled={installing}
            style={{
              width: '100%',
              minHeight: '48px',
              borderRadius: '999px',
              border: '1px solid rgba(255, 255, 255, 0.65)',
              background: 'linear-gradient(135deg, #dce9fc, #bdd6fa)',
              color: '#0f1f36',
              fontSize: '15px',
              fontWeight: 650,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
            }}
          >
            <Download size={18} />
            {installing ? 'Instalando…' : 'Instalar StudyOS'}
          </button>
        ) : !ios ? <p>Abra o menu do navegador e selecione <strong>Instalar aplicativo</strong> ou <strong>Adicionar à tela inicial</strong>. No Android, use o Chrome se a opção estiver ausente.</p> : (
          <div
            style={{
              display: 'grid',
              gap: '10px',
              padding: '14px',
              borderRadius: '16px',
              background: 'rgba(6, 14, 26, 0.55)',
              border: '1px solid rgba(210, 230, 255, 0.14)',
              fontSize: '13px',
              color: '#dce8f8',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Share size={18} style={{ color: '#7cc0ff', flexShrink: 0 }} />
              <span>1. Toque no botão <strong>Compartilhar</strong> na barra do Safari.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <PlusSquare size={18} style={{ color: '#7cc0ff', flexShrink: 0 }} />
              <span>2. Selecione <strong>Adicionar à Tela de Início</strong>.</span>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={close}
          style={{
            width: '100%',
            marginTop: '10px',
            minHeight: '40px',
            border: 0,
            background: 'transparent',
            color: '#95a9c6',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          Agora não
        </button>
      </div>
    </dialog>
  )
}