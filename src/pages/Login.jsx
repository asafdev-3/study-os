// Login.jsx — StudyOS
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { rememberDestination } from '../lib/nfc'
import { supabase } from '../lib/supabase'

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
    <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
)

function Login() {
  const location = useLocation()
  useEffect(() => { rememberDestination(location.state?.destino) }, [location.state])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  async function handleGoogle() {
    setLoading(true)
    setErro('')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/dashboard',
        },
      })
      if (error) throw error
    } catch {
      setErro('O login com Google falhou. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <main className="study-entry">
      <div className="w-full max-w-sm flex flex-col items-center gap-10">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <img src="/icons/icon-192.png" alt="StudyOS" className="w-16 h-16 rounded-2xl" />
        </div>

        {/* Título */}
        <div className="text-center">
          <h1 className="text-white text-2xl font-semibold">Seu espaço de estudo.</h1>
          <p className="text-zinc-500 text-sm mt-1">Organize sua rotina de preparação para o ENEM.</p>
        </div>

        {/* Botão Google */}
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition rounded-xl py-3.5 text-white text-sm font-medium disabled:opacity-50"
          >
            <GoogleIcon />
            {loading ? 'Redirecionando...' : 'Continuar com Google'}
          </button>

          {erro && (
            <p role="alert" className="text-red-400 text-sm text-center">{erro}</p>
          )}
        </div>

      </div>
    </main>
  )
}

export default Login