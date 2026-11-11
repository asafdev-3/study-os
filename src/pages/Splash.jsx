// Splash.jsx — tela de abertura
// Mostra logo por 2s com fade, depois redireciona pro Login

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Splash() {
  const navigate = useNavigate()
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    const aparecer = setTimeout(() => setVisivel(true), 30)
    const entrar = setTimeout(() => navigate('/login', { replace: true }), 450)
    return () => { clearTimeout(aparecer); clearTimeout(entrar) }
  }, [navigate])

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
      <div
        className="flex flex-col items-center gap-4 transition-opacity duration-700"
        style={{ opacity: visivel ? 1 : 0 }}
      >
        <img src="/icons/icon-192.png" alt="StudyOS" className="w-24 h-24 rounded-3xl" />
        <span className="text-white tracking-[0.3em] text-sm font-light">S T U D Y O S</span>
      </div>
    </div>
  )
}

export default Splash;