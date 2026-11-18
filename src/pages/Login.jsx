import { useEffect, useId, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { m as motion } from 'framer-motion'
import { useStudyReducedMotion } from '../lib/motion'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { rememberDestination } from '../lib/nfc'
import { supabase } from '../lib/supabase'
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

function authMessage(error, mode) {
  const message = error?.message?.toLowerCase() ?? ''
  if (message.includes('invalid login credentials')) return 'E-mail ou senha incorretos.'
  if (message.includes('already registered') || message.includes('already been registered')) return 'Este e-mail já tem cadastro. Entre na sua conta.'
  if (message.includes('password')) return 'A senha precisa ter pelo menos 8 caracteres.'
  if (message.includes('email not confirmed')) return 'Confirme seu e-mail pelo link enviado antes de entrar.'
  if (message.includes('rate limit') || message.includes('too many requests')) return 'Muitas tentativas. Aguarde um pouco e tente novamente.'
  return mode === 'signup' ? 'Não foi possível criar sua conta agora. Tente novamente.' : 'Não foi possível entrar agora. Tente novamente.'
}

export default function Login() {
  const location = useLocation()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => { rememberDestination(location.state?.destino) }, [location.state])

  function changeMode(next) {
    setMode(next)
    setErro('')
    setNotice('')
    setConfirmPassword('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErro('')
    setNotice('')
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail || !password) {
      setErro('Preencha seu e-mail e sua senha.')
      return
    }
    if (mode === 'signup' && password.length < 8) {
      setErro('Crie uma senha com pelo menos 8 caracteres.')
      return
    }
    if (mode === 'signup' && password !== confirmPassword) {
      setErro('As senhas não coincidem.')
      return
    }

    setLoading(true)
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        })
        if (error) throw error
        if (!data.session) {
          setNotice('Conta criada. Confira seu e-mail e confirme o cadastro para continuar.')
          return
        }
        navigate('/onboarding', { replace: true })
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password })
        if (error) throw error
        navigate('/dashboard', { replace: true })
      }
    } catch (error) {
      setErro(authMessage(error, mode))
    } finally {
      setLoading(false)
    }
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
  // SVG backdrop filters are an enhancement for desktop Chromium only.
  const refractiveGlass = /Chrome\//.test(navigator.userAgent)
    && !/Android|Mobile|iPhone|iPad/.test(navigator.userAgent)

  const creating = mode === 'signup'
  const reducedMotion = useStudyReducedMotion()

  return (
    <main className="study-entry study-auth-page study-auth-login">
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

      <KiraLoginScene reducedMotion={reducedMotion} />

      <section
        className="study-auth-card"
        data-refraction={refractiveGlass}
        style={{ '--auth-glass-filter': 'url(#' + glassFilterId + ')' }}
        aria-labelledby="auth-title"
      >
        <header className="study-auth-login-brand">
          <span className="study-auth-login-wordmark">StudyOS</span>
        </header>

        <motion.div
          key={mode}
          className="study-auth-heading"
          initial={reducedMotion ? false : { opacity: 0.55, y: 7 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 id="auth-title">{creating ? 'Seu estudo começa aqui.' : 'Seu espaço de estudo.'}</h1>
          <p>{creating ? 'Crie sua conta para começar.' : 'Entre e continue de onde parou.'}</p>
        </motion.div>

        <div className="study-auth-switch" data-creating={creating} role="group" aria-label="Acesso à conta">
          <button type="button" aria-pressed={!creating} className={!creating ? 'is-active' : ''} onClick={() => changeMode('login')}>Entrar</button>
          <button type="button" aria-pressed={creating} className={creating ? 'is-active' : ''} onClick={() => changeMode('signup')}>Criar conta</button>
        </div>

        <form className="study-auth-form" autoComplete={creating ? 'off' : 'on'} onSubmit={handleSubmit}>
          <label className="study-auth-field">
            <span>E-mail</span>
            <span className="study-auth-input-wrap">
              <Mail size={18} aria-hidden="true" />
              <input type="email" autoComplete={creating ? 'off' : 'email'} inputMode="email" name={creating ? 'registration-contact' : 'email'} placeholder="voce@email.com" value={email} onChange={event => setEmail(event.target.value)} required />
            </span>
          </label>
          <div className="study-auth-field">
            <div className="study-auth-field-heading">
              <label htmlFor="auth-password">Senha</label>
              {!creating && <Link to="/esqueci-senha">Esqueceu a senha?</Link>}
            </div>
            <span className="study-auth-input-wrap">
              <LockKeyhole size={18} aria-hidden="true" />
              <input type={showPassword ? 'text' : 'password'} autoComplete={creating ? 'off' : 'current-password'} name="password" id="auth-password" placeholder={creating ? 'Mínimo de 8 caracteres' : 'Sua senha'} value={password} onChange={event => setPassword(event.target.value)} required />
              <button className="study-auth-reveal" type="button" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setShowPassword(value => !value)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </div>
          <div className="study-auth-confirm" data-open={creating} inert={!creating}>
            <div className="study-auth-confirm-clip">
              <label className="study-auth-field">
                <span>Confirmar senha</span>
                <span className="study-auth-input-wrap">
                  <LockKeyhole size={18} aria-hidden="true" />
                  <input type={showPassword ? 'text' : 'password'} autoComplete="off" name="confirmPassword" placeholder="Digite a senha novamente" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} disabled={!creating} required={creating} />
                </span>
              </label>
            </div>
          </div>

          {erro && <p className="study-auth-feedback is-error" role="alert">{erro}</p>}
          {notice && <p className="study-auth-feedback is-notice" role="status">{notice}</p>}

          <button className="study-auth-submit" type="submit" disabled={loading}>
            {loading ? 'Aguarde…' : creating ? 'Criar conta' : 'Entrar'}
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
