import { useEffect, useId, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { m as motion } from 'framer-motion'
import { useStudyReducedMotion } from '../lib/motion'
import { ArrowRight, Mail, Pause, Play } from 'lucide-react'
import { rememberDestination } from '../lib/nfc'
import { supabase } from '../lib/supabase'
import RainWindow from '../components/RainWindow'
import KiraLoginScene from '../components/KiraLoginScene'
import studyosBackdrop from '../assets/studyos-backdrop.webp'
import './Auth.css'

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
    <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
)

function readableAuthError(error, mode, phase) {
  const message = error?.message?.toLowerCase() ?? ''
  if (message.includes('invalid') || message.includes('expired') || message.includes('token')) {
    return phase === 'verify' ? 'Código inválido ou expirado. Confira os seis dígitos e tente novamente.' : 'Não foi possível enviar o código. Confira o e-mail.'
  }
  if (message.includes('not found') || message.includes('user not found')) return 'Não existe uma conta com esse e-mail. Escolha “Criar conta”.'
  if (message.includes('already registered') || message.includes('already been registered')) return 'Este e-mail já possui cadastro. Escolha “Entrar”.'
  if (message.includes('rate limit') || message.includes('too many requests')) return 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.'
  return phase === 'verify'
    ? 'Não foi possível validar o código. Solicite outro e tente novamente.'
    : mode === 'signup'
      ? 'Não foi possível iniciar seu cadastro. Tente novamente.'
      : 'Não foi possível enviar o código de acesso. Tente novamente.'
}

export default function Login() {
  const location = useLocation()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [phase, setPhase] = useState('email')
  const [rainPaused, setRainPaused] = useState(false)
  const [focusedField, setFocusedField] = useState(null)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => { rememberDestination(location.state?.destino) }, [location.state])

  function changeMode(next) {
    setMode(next)
    setPhase('email')
    setCode('')
    setErro('')
    setNotice('')
  }

  async function sendCode(event) {
    event.preventDefault()
    setErro('')
    setNotice('')
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) {
      setErro('Informe seu e-mail.')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: { shouldCreateUser: mode === 'signup' },
      })
      if (error) throw error
      setEmail(normalizedEmail)
      setPhase('code')
      setNotice(`Enviamos um código de seis dígitos para ${normalizedEmail}.`)
    } catch (error) {
      setErro(readableAuthError(error, mode, 'send'))
    } finally {
      setLoading(false)
    }
  }

  async function verifyCode(event) {
    event.preventDefault()
    setErro('')
    setNotice('')
    const token = code.replace(/\D/g, '')
    if (token.length !== 6) {
      setErro('Digite os seis números do código.')
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token,
        type: 'email',
      })
      if (error) throw error
      if (!data.session) throw new Error('Sessão não criada após validação do código.')
      navigate(mode === 'signup' ? '/onboarding' : '/dashboard', { replace: true })
    } catch (error) {
      setErro(readableAuthError(error, mode, 'verify'))
    } finally {
      setLoading(false)
    }
  }

  async function resendCode() {
    setCode('')
    await sendCode({ preventDefault() {} })
  }

  async function handleGoogle() {
    setLoading(true)
    setErro('')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/dashboard` },
      })
      if (error) throw error
    } catch {
      setErro('O acesso com Google falhou. Tente novamente.')
      setLoading(false)
    }
  }

  const glassFilterId = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const refractiveGlass = /Chrome\//.test(navigator.userAgent)
    && !/Android|Mobile|iPhone|iPad/.test(navigator.userAgent)
  const creating = mode === 'signup'
  const reducedMotion = useStudyReducedMotion()

  return (
    <main className="study-entry study-auth-page study-auth-login">
      <RainWindow still={reducedMotion || rainPaused} />
      <svg width="0" height="0" className="study-auth-glass-filter" aria-hidden="true" focusable="false">
        <defs>
          <filter id={glassFilterId} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
            <feTurbulence type="turbulence" baseFrequency="0.01" numOctaves="2" seed="8" result="turbulence" />
            <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="3" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
      <div className="study-auth-watermark study-auth-brand-backdrop" aria-hidden="true">
        <img src={studyosBackdrop} alt="" width="900" height="900" style={{ maskImage: `url(${studyosBackdrop})`, WebkitMaskImage: `url(${studyosBackdrop})` }} />
      </div>

      <KiraLoginScene reducedMotion={reducedMotion} creating={creating} focusedField={focusedField} />

      <section className="study-auth-card" data-refraction={refractiveGlass}
        style={{ '--auth-glass-filter': 'url(#' + glassFilterId + ')' }} aria-labelledby="auth-title">
        <header className="study-auth-login-brand">
          <span className="study-auth-login-wordmark">StudyOS</span>
          {!reducedMotion && (
            <button type="button" className="rain-toggle" onClick={() => setRainPaused(value => !value)}
              aria-label={rainPaused ? 'Retomar chuva' : 'Pausar chuva'} title={rainPaused ? 'Retomar chuva' : 'Pausar chuva'}>
              {rainPaused ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}
            </button>
          )}
        </header>

        <motion.div key={mode + phase} className="study-auth-heading"
          initial={reducedMotion ? false : { opacity: 0.55, y: 7 }}
          animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
          <h1 id="auth-title">{phase === 'code' ? 'Confira seu e-mail.' : creating ? 'Seu estudo começa aqui.' : 'Seu espaço de estudo.'}</h1>
          <p>{phase === 'code' ? 'Digite o código de seis dígitos para continuar.' : creating ? 'Crie sua conta com seu e-mail.' : 'Entre e continue de onde parou.'}</p>
        </motion.div>

        <div className="study-auth-switch" data-creating={creating} role="group" aria-label="Acesso à conta">
          <button type="button" aria-pressed={!creating} className={!creating ? 'is-active' : ''} onClick={() => changeMode('login')}>Entrar</button>
          <button type="button" aria-pressed={creating} className={creating ? 'is-active' : ''} onClick={() => changeMode('signup')}>Criar conta</button>
        </div>

        <form className="study-auth-form" onSubmit={phase === 'email' ? sendCode : verifyCode}
          onFocusCapture={event => setFocusedField(event.target.name || null)}
          onBlurCapture={event => {
            if (!event.currentTarget.contains(event.relatedTarget)) setFocusedField(null)
          }} autoComplete="off">
          {phase === 'email' ? (
            <label className="study-auth-field">
              <span>E-mail</span>
              <span className="study-auth-input-wrap">
                <Mail size={18} aria-hidden="true" />
                <input type="email" autoComplete="email" inputMode="email" name="email"
                  placeholder="voce@email.com" value={email} onChange={event => setEmail(event.target.value)}
                  required disabled={loading} />
              </span>
            </label>
          ) : (
            <>
              <div className="study-auth-otp-destination">
                <span>{email}</span>
                <button type="button" onClick={() => { setPhase('email'); setCode(''); setErro(''); setNotice('') }}>Alterar</button>
              </div>
              <label className="study-auth-field">
                <span>Código de acesso</span>
                <input className="study-auth-otp-input" type="text" name="otp" inputMode="numeric"
                  autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} minLength={6}
                  placeholder="000000" value={code}
                  onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  aria-label="Código de acesso de seis dígitos" required disabled={loading} />
              </label>
              <button className="study-auth-resend" type="button" onClick={resendCode} disabled={loading}>
                Reenviar código
              </button>
            </>
          )}

          {erro && <p className="study-auth-feedback is-error" role="alert">{erro}</p>}
          {notice && <p className="study-auth-feedback is-notice" role="status">{notice}</p>}

          <button className="study-auth-submit" type="submit" disabled={loading}>
            {loading ? 'Aguarde…' : phase === 'code' ? 'Validar código' : creating ? 'Enviar código' : 'Continuar'}
            {!loading && <ArrowRight size={18} aria-hidden="true" />}
          </button>
        </form>

        <div className="study-auth-divider"><span>ou</span></div>
        <button className="study-auth-google" type="button" onClick={handleGoogle} disabled={loading}>
          <GoogleIcon /> Continuar com Google
        </button>
      </section>
    </main>
  )
}
