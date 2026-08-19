// Login.jsx — tela de entrada do StudyOS
// Campos: email, senha | Ações: entrar, oauth (Google, GitHub, Discord)

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo_studyos.png'
import { Eye, EyeOff } from 'lucide-react'

function Login() {
  // useState controla o valor dos campos em tempo real
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  // useNavigate permite trocar de rota programaticamente
  const navigate = useNavigate()
  const [visivel, setVisivel] = useState(false)

useEffect(() => {
  setTimeout(() => setVisivel(true), 50)
}, [])
  function handleLogin(e) {
    e.preventDefault()
    // Por enquanto navega direto pro dashboard (sem auth real)
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6 transition-opacity duration-1000"
      style={{ opacity: visivel ? 1 : 0 }}>
      <div className="w-full max-w-sm flex flex-col items-center gap-8">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <img src={logo} alt="StudyOS" className="w-16 h-16 rounded-2xl" />
          <span className="text-white tracking-[0.3em] text-sm font-light">S T U D Y O S</span>
        </div>

        {/* Título */}
        <div className="text-center">
          <h1 className="text-white text-2xl font-semibold">Bem-vindo de volta.</h1>
          <p className="text-zinc-500 text-sm mt-1">Faça login para continuar sua jornada.</p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">

          {/* Campo email */}
          <div className="flex flex-col gap-1">
            <label className="text-zinc-400 text-xs tracking-widest">E-MAIL</label>
            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 gap-3">
              <span className="text-zinc-500">✉</span>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent text-white text-sm outline-none w-full placeholder-zinc-600"
              />
            </div>
          </div>

          {/* Campo senha */}
          <div className="flex flex-col gap-1">
            <label className="text-zinc-400 text-xs tracking-widest">SENHA</label>
            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 gap-3">
              <span className="text-zinc-500">🔒</span>
              <input
                type={mostrarSenha ? 'text' : 'password'}
                placeholder="••••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="bg-transparent text-white text-sm outline-none w-full placeholder-zinc-600"
              />
              {/* Toggle visibilidade da senha */}
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="text-zinc-500 hover:text-white transition"
                         >
                {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Lembrar + Esqueci */}
          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-zinc-500 cursor-pointer">
              <input type="checkbox" className="accent-violet-500" />
              Lembrar de mim
            </label>
            <span className="text-violet-400 cursor-pointer hover:text-violet-300 transition">
              Esqueci minha senha
            </span>
          </div>

          {/* Botão entrar */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition mt-2"
          >
            Entrar <span>→</span>
          </button>
        </form>

        {/* OAuth */}
        <div className="w-full flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 w-full">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-zinc-600 text-xs">OU CONTINUE COM</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>
          <div className="flex gap-4">
            {['G', '🐙', '💬'].map((icon, i) => (
              <button
                key={i}
                className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-lg hover:border-zinc-600 transition"
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

export default Login