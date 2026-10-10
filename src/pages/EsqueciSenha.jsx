import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react'
import logo from '../assets/logo_studyos.png'

function EsqueciSenha() {
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [visivel, setVisivel] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    setTimeout(() => setVisivel(true), 50)
  }, [])

  function handleEnviar(e) {
    e.preventDefault()
    if (!email) return
    setEnviado(true)
  }

  return (
    <div
      className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6 transition-opacity duration-1000"
      style={{ opacity: visivel ? 1 : 0 }}
    >
      <div className="w-full max-w-sm flex flex-col items-center gap-8">

        {/* Botão voltar */}
        <div className="w-full">
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="text-sm">Voltar ao login</span>
          </button>
        </div>

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <img src={logo} alt="StudyOS" className="w-16 h-16 rounded-2xl" />
          <span className="text-white tracking-[0.3em] text-sm font-light">S T U D Y O S</span>
        </div>

        {!enviado ? (
          <>
            {/* Título */}
            <div className="text-center">
              <h1 className="text-white text-2xl font-semibold">Esqueceu sua senha?</h1>
              <p className="text-zinc-500 text-sm mt-2 leading-relaxed">
                Sem problema. Informe seu e-mail e a Kira te manda o link de recuperação.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleEnviar} className="w-full flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-zinc-400 text-xs tracking-widest">E-MAIL</label>
                <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 gap-3 focus-within:border-violet-500 transition-colors">
                  <Mail size={16} className="text-zinc-500 flex-shrink-0" />
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="bg-transparent text-white text-sm outline-none w-full placeholder-zinc-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition mt-2"
              >
                Enviar link de recuperação <span>→</span>
              </button>
            </form>
          </>
        ) : (
          /* Estado: enviado */
          <div className="flex flex-col items-center gap-6 text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #8B5CF6, #22D3A0)' }}
            >
              <CheckCircle size={36} className="text-white" />
            </div>

            <div>
              <h2 className="text-white text-xl font-semibold">Link enviado.</h2>
              <p className="text-zinc-500 text-sm mt-2 leading-relaxed">
                Verifique sua caixa de entrada em{' '}
                <span className="text-violet-400">{email}</span>.
                <br />O link expira em 15 minutos.
              </p>
            </div>

            <p
              className="text-zinc-600 text-xs"
              style={{ fontFamily: 'Instrument Serif, serif', fontStyle: 'italic' }}
            >
              "Não chegou? Confere o spam — às vezes eu me perco por lá."
              <br />
              <span className="text-zinc-700">— Kira</span>
            </p>

            <button
              onClick={() => navigate('/login')}
              className="w-full border border-zinc-800 text-white text-sm py-3 rounded-xl hover:border-zinc-600 transition"
            >
              Voltar ao login
            </button>

            <button
              onClick={() => { setEnviado(false) }}
              className="text-violet-400 text-xs hover:text-violet-300 transition"
            >
              Reenviar com outro e-mail
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

export default EsqueciSenha