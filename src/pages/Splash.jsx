// Splash.jsx — tela de abertura
// Mostra logo por 2s com fade, depois redireciona pro Login

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo_studyos.png'

function Splash() {
  const navigate = useNavigate()
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    setTimeout(() => setVisivel(true), 100)

    // Fade out antes de navegar
    setTimeout(() => setVisivel(false), 1600)
    setTimeout(() => navigate('/login'), 2200)
  }, [])

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
      <div
        className="flex flex-col items-center gap-4 transition-opacity duration-700"
        style={{ opacity: visivel ? 1 : 0 }}
      >
        <img src={logo} alt="StudyOS" className="w-24 h-24 rounded-3xl" />
        <span className="text-white tracking-[0.3em] text-sm font-light">S T U D Y O S</span>
      </div>
    </div>
  )
}

export default Splash