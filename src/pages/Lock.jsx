// Lock.jsx — tela de entrada após primeiro login

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo_studyos.png'
import { Fingerprint, Moon, Sun } from 'lucide-react'

function Lock() {
  const navigate = useNavigate()
  const [hora, setHora] = useState('')
  const [data, setData] = useState('')
  const [diurno, setDiurno] = useState(false)

  useEffect(() => {
    function atualizar() {
      const agora = new Date()
      const h = agora.getHours()
      setDiurno(h >= 6 && h < 18)
      setHora(agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
      setData(agora.toLocaleDateString('pt-BR', {
        weekday: 'short', day: '2-digit', month: 'short'
      }).toUpperCase().replace(/\./g, ''))
    }
    atualizar()
    const intervalo = setInterval(atualizar, 1000)
    return () => clearInterval(intervalo)
  }, [])

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-10 px-6 max-w-sm mx-auto">

      {/* Relógio */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-[#a1a1aa] text-[10px] tracking-widest flex items-center gap-2">
          {diurno ? <Sun size={11} /> : <Moon size={11} />}
          {data}
        </p>
        <p style={{ fontFamily: 'Geist Mono, monospace' }} className="text-7xl font-medium tracking-tight leading-none">
          {hora}
        </p>
        <p style={{ fontFamily: 'Instrument Serif, serif' }} className="text-[#a1a1aa] text-sm italic">
          você estuda melhor tarde da noite
        </p>
      </div>

      {/* Logo com glow */}
      <div className="flex flex-col items-center gap-2 relative">
        <div className="absolute inset-0 rounded-full blur-2xl opacity-20"
          style={{ background: 'linear-gradient(135deg, #8B5CF6, #22D3A0)' }} />
        <img src={logo} alt="StudyOS" className="w-16 h-16 rounded-2xl relative z-10" />
        <span className="text-white tracking-[0.3em] text-xs font-light">S T U D Y O S</span>
      </div>

      {/* Biometria */}
      <div className="flex flex-col items-center gap-3">
        <p className="text-[#a1a1aa] text-[10px] tracking-widest uppercase">Toque para entrar</p>
        <button
          onClick={() => navigate('/dashboard')}
          style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1, #22D3A0)', padding: '2px' }}
          className="w-24 h-24 rounded-full"
        >
          <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
            <Fingerprint size={40} className="text-white opacity-80" />
          </div>
        </button>
      </div>

    </div>
  )
}

export default Lock