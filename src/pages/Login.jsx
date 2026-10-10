// Login.jsx — tela de entrada do StudyOS
// Campos: email, senha | Ações: entrar, OAuth Google

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo_studyos.png'
import { Eye, EyeOff } from 'lucide-react'

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
    <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
)

function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [visivel, setVisivel] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    setTimeout(() => setVisivel(true), 50)
  }, [])

  function handleLogin(e) {
    e.preventDefault()
    navigate('/dashboard')
  }

  function handleGoogle() {
    // Futuramente: Supabase OAuth
    // supabase.auth.signInWithOAuth({ provider: 'google' })
    navigate('/dashboard')
  }

  return (
    <div
      className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6 transition-opacity duration-1000"
      style={{ opacity: visivel ? 1 : 0 }}
    >
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

          {/* Email */}
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

          {/* Senha */}
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
            <span
              onClick={() => navigate('/esqueci-senha')}
              className="text-violet-400 cursor-pointer hover:text-violet-300 transition"
                >
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

        {/* Divisor */}
        <div className="flex items-center gap-3 w-full">
          <div className="flex-1 h-px bg-zinc-800" />
          <span className="text-zinc-600 text-xs tracking-widest">OU CONTINUE COM</span>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>

        {/* Google OAuth */}
        <button
          onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition rounded-xl py-3 text-white text-sm font-medium"
        >
          <GoogleIcon />
          Continuar com Google
        </button>

      </div>
    </div>
  )
}

export default Login