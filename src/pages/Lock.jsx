// Lock.jsx — tela de entrada com scan biométrico animado

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo_studyos.png'
import { Moon, Sun } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

function Lock() {
  const navigate = useNavigate()
  const [hora, setHora] = useState('')
  const [data, setData] = useState('')
  const [diurno, setDiurno] = useState(false)
  const [estado, setEstado] = useState('idle') // idle | scanning | success

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

  function handleScan() {
    if (estado !== 'idle') return
    setEstado('scanning')

    // Após 1.5s — sucesso
    setTimeout(() => {
      setEstado('success')
      // Após feedback — navega
      setTimeout(() => navigate('/dashboard'), 800)
    }, 1500)
  }

  // Cores do anel por estado
  const corAnel = {
    idle:     ['#8B5CF6', '#6366F1', '#22D3A0'],
    scanning: ['#6366F1', '#22D3A0', '#6366F1'],
    success:  ['#22D3A0', '#22D3A0', '#22D3A0'],
  }[estado]

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

      {/* Logo */}
      <div className="flex flex-col items-center gap-2 relative">
        <div className="absolute inset-0 rounded-full blur-2xl opacity-20"
          style={{ background: 'linear-gradient(135deg, #8B5CF6, #22D3A0)' }} />
        <img src={logo} alt="StudyOS" className="w-16 h-16 rounded-2xl relative z-10" />
        <span className="text-white tracking-[0.3em] text-xs font-light">S T U D Y O S</span>
      </div>

      {/* Biometria */}
      <div className="flex flex-col items-center gap-3">
        <p className="text-[#a1a1aa] text-[10px] tracking-widest uppercase">
          {estado === 'idle' ? 'Toque para entrar' : estado === 'scanning' ? 'Lendo...' : 'Acesso liberado'}
        </p>

        <button onClick={handleScan} className="relative w-24 h-24 flex items-center justify-center">

          {/* Anel base */}
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="44" fill="none" stroke="#1a1a1a" strokeWidth="3" />
            <motion.circle
              cx="48" cy="48" r="44"
              fill="none"
              stroke="url(#lockGrad)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 44}`}
              animate={{
                strokeDashoffset: estado === 'scanning'
                  ? [2 * Math.PI * 44, 0]
                  : estado === 'success'
                  ? 0
                  : 2 * Math.PI * 44 * 0.75,
              }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
            />
            <defs>
              <linearGradient id="lockGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={corAnel[0]} />
                <stop offset="50%" stopColor={corAnel[1]} />
                <stop offset="100%" stopColor={corAnel[2]} />
              </linearGradient>
            </defs>
          </svg>

          {/* Anel pulsante durante scan */}
          <AnimatePresence>
            {estado === 'scanning' && (
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ border: '2px solid #8B5CF6' }}
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 1.3, opacity: 0 }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </AnimatePresence>

          {/* Ícone de digital */}
          <div className="w-16 h-16 rounded-full bg-[#0a0a0c] flex items-center justify-center relative z-10">
            <motion.svg
              viewBox="0 0 24 24" fill="none"
              className="w-8 h-8"
              animate={{ opacity: estado === 'success' ? 0 : 1 }}
            >
              {/* Linhas do fingerprint — estilo Samsung/Xiaomi */}
              <motion.path d="M12 2C8 2 5 5 5 9" stroke={estado === 'scanning' ? '#8B5CF6' : '#a1a1aa'} strokeWidth="1.5" strokeLinecap="round"
                animate={{ stroke: estado === 'scanning' ? '#22D3A0' : estado === 'success' ? '#22D3A0' : '#a1a1aa' }}
                transition={{ duration: 0.5 }}
              />
              <motion.path d="M19 9c0-4-3-7-7-7" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round"
                animate={{ stroke: estado === 'scanning' ? '#22D3A0' : '#a1a1aa' }}
                transition={{ duration: 0.5, delay: 0.2 }}
              />
              <motion.path d="M5 12c0 2 1 4 2 5" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round"
                animate={{ stroke: estado === 'scanning' ? '#22D3A0' : '#a1a1aa' }}
                transition={{ duration: 0.5, delay: 0.4 }}
              />
              <motion.path d="M12 8c-2 0-4 2-4 4v1" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round"
                animate={{ stroke: estado === 'scanning' ? '#22D3A0' : '#a1a1aa' }}
                transition={{ duration: 0.5, delay: 0.3 }}
              />
              <motion.path d="M16 12c0 3-2 6-4 8" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round"
                animate={{ stroke: estado === 'scanning' ? '#22D3A0' : '#a1a1aa' }}
                transition={{ duration: 0.5, delay: 0.5 }}
              />
              <motion.path d="M12 8c2 0 4 2 4 4" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round"
                animate={{ stroke: estado === 'scanning' ? '#22D3A0' : '#a1a1aa' }}
                transition={{ duration: 0.5, delay: 0.15 }}
              />
              <motion.path d="M8 17c1 2 2 3 4 4" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round"
                animate={{ stroke: estado === 'scanning' ? '#22D3A0' : '#a1a1aa' }}
                transition={{ duration: 0.5, delay: 0.6 }}
              />
            </motion.svg>

            {/* Check de sucesso */}
            <AnimatePresence>
              {estado === 'success' && (
                <motion.div
                  className="absolute"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none">
                    <motion.path
                      d="M5 13l4 4L19 7"
                      stroke="#22D3A0"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.4 }}
                    />
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </button>
      </div>

    </div>
  )
}

export default Lock