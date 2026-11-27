import { memo, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useStudyReducedMotion } from '../lib/motion'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Pause, Play } from 'lucide-react'
import { rememberDestination } from '../lib/nfc'
import { supabase } from '../lib/supabase'
import { startDemo } from '../lib/demo'
import RainWindow from '../components/RainWindow'
import KiraLoginScene from '../components/KiraLoginScene'
import './Auth.css'

const StableRainWindow = memo(RainWindow)
const StableKiraLoginScene = memo(KiraLoginScene)

const isAndroidDevice = () => document.documentElement.classList.contains('is-android')

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
  if (message.includes('already registered') || message.includes('already been registered') || message.includes('user already exists')) {
    return 'Este e-mail já tem cadastro. Clique em "Entrar" acima.'
  }
  if (error?.code === 'weak_password' || message.includes('password')) return error?.message || 'A senha não atende aos requisitos de segurança.'
  if (message.includes('email not confirmed')) return 'Confirme seu e-mail pelo link enviado antes de entrar.'
  if (error?.code === 'over_email_send_rate_limit') return 'Aguarde 60 segundos antes de solicitar outro e-mail. Confira também a caixa de spam.'
  if (message.includes('rate limit') || message.includes('too many requests') || message.includes('email rate limit exceeded')) {
    return 'Limite de envio de e-mails atingido no servidor. Tente entrar com Google ou aguarde alguns minutos.'
  }
  if (message.includes('signups not allowed')) return 'Novos cadastros estão temporariamente desativados no servidor.'
  if (message.includes('invalid email')) return 'Digite um endereço de e-mail válido.'
  return mode === 'signup'
    ? `Não foi possível criar sua conta (${error?.message || 'erro de conexão'}).`
    : 'Não foi possível entrar agora. Tente novamente.'
}

export default function Login() {
  const location = useLocation()
  const navigate = useNavigate()
  const android = isAndroidDevice()
  const [mode, setMode] = useState(() => new URLSearchParams(location.search).get('modo') === 'cadastro' ? 'signup' : 'login')
  const [rainPaused, setRainPaused] = useState(() => android)
  const [focusedField, setFocusedField] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [confirmationEmail, setConfirmationEmail] = useState('')
  const [resendAt, setResendAt] = useState(0)
  const [clock, setClock] = useState(Date.now)
  useEffect(() => { if (!resendAt) return; const timer = setInterval(() => setClock(Date.now()), 1000); return () => clearInterval(timer) }, [resendAt])
  const resendSeconds = Math.max(0, Math.ceil((resendAt-clock)/1000))
  const [demoLoading, setDemoLoading] = useState(false)
  const [demoError, setDemoError] = useState('')
  const [erro, setErro] = useState('')
  const [notice, setNotice] = useState(() => location.state?.demoEnded ? 'Sua sessão de visitante terminou. Você pode criar uma conta gratuita.' : '')

  useEffect(() => { rememberDestination(location.state?.destino) }, [location.state])

  function changeMode(next) {
    if (next === mode) return
    setMode(next)
    setErro('')
    setNotice('')
    setConfirmPassword('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (loading || demoLoading) return
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
          options: {
            emailRedirectTo: `${window.location.origin}/onboarding`,
          },
        })
        if (error) throw error

        // Supabase retorna user com identities vazio quando o e-mail já existe e confirmação está ativa
        if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          setErro('Este e-mail já está cadastrado. Use a aba "Entrar".')
          return
        }

        if (!data.session) {
          setConfirmationEmail(normalizedEmail)
          setClock(Date.now()); setResendAt(Date.now()+60000)
          setNotice('Conta criada! Abra seu e-mail e clique no link de confirmação para ativar o acesso.')
          return
        }
        navigate('/onboarding', { replace: true })
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password })
        if (error) throw error
        navigate('/dashboard', { replace: true })
      }
    } catch (error) {
      console.error('[StudyOS Auth]', error)
      if (error?.code === 'email_not_confirmed' || error?.code === 'over_email_send_rate_limit') {
        setConfirmationEmail(normalizedEmail)
        if (error.code === 'over_email_send_rate_limit') { setClock(Date.now()); setResendAt(Date.now()+60000) }
      }
      setErro(authMessage(error, mode))
    } finally {
      setLoading(false)
    }
  }

  async function resendConfirmation() {
    if (loading || resendSeconds || !confirmationEmail) return
    setLoading(true); setErro(''); setNotice('')
    setClock(Date.now()); setResendAt(Date.now()+60000)
    try {
      const { error } = await supabase.auth.resend({type:'signup', email:confirmationEmail, options:{emailRedirectTo:window.location.origin+'/onboarding'}})
      if (error) throw error
      setNotice('Confira sua caixa de entrada e spam. Após confirmar, entre com sua senha.')
    } catch (error) { setErro(authMessage(error, 'signup')) }
    finally { setLoading(false) }
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
    } catch (error) {
      console.error('[StudyOS Google Auth]', error)
      setErro('O acesso com Google falhou. Tente novamente.')
      setLoading(false)
    }
  }

  async function handleDemo() {
    setDemoLoading(true); setDemoError(''); setErro(''); setNotice('')
    try { await startDemo(); navigate('/dashboard', { replace: true }) }
    catch (error) { setDemoError(error.message || 'Demonstração indisponível.') }
    finally { setDemoLoading(false) }
  }

  const creating = mode === 'signup'
  const awaitingConfirmation = creating && confirmationEmail && confirmationEmail === email.trim().toLowerCase()
  const reducedMotion = useStudyReducedMotion() || android

  return (
    <main className="study-entry study-auth-page study-auth-login">
      <StableRainWindow still={reducedMotion || rainPaused} />
      <StableKiraLoginScene reducedMotion={reducedMotion} creating={creating} focusedField={focusedField} />

      <section
        className="study-auth-card"
        aria-labelledby="auth-title"
      >
        <header className="study-auth-login-brand">
          <a className="study-auth-login-wordmark" href="/apresentacao/index.html" aria-label="Conhecer o StudyOS"><img className="study-auth-login-logo" src="/icons/icon-192.png" alt="" width="36" height="36" /><span>StudyOS <span aria-hidden="true">↗</span></span></a>
          {!reducedMotion && !android && (
            <button type="button" className="rain-toggle" onClick={() => setRainPaused(value => !value)}
              aria-label={rainPaused ? 'Retomar chuva' : 'Pausar chuva'} title={rainPaused ? 'Retomar chuva' : 'Pausar chuva'}>
              {rainPaused ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}
            </button>
          )}
        </header>

        <div className="study-auth-heading">
          <h1 id="auth-title">{creating ? 'Seu estudo começa aqui.' : 'Seu espaço de estudo.'}</h1>
          <p>{creating ? 'Crie sua conta para começar.' : 'Entre e continue de onde parou.'}</p>
        </div>

        <button className="study-auth-demo" type="button" onClick={handleDemo} disabled={loading || demoLoading}>
          {demoLoading ? 'Preparando demonstração…' : 'Experimentar como visitante'} <ArrowRight size={16} aria-hidden="true" />
        </button>
        <p className="study-demo-caption">45 minutos · sem cadastro</p>
        {demoError && <p className="study-auth-feedback is-error study-demo-error" role="alert">{demoError}</p>}

        <div className="study-auth-switch" data-creating={creating} role="group" aria-label="Acesso à conta">
          <button type="button" aria-pressed={!creating} className={!creating ? 'is-active' : ''} onClick={() => changeMode('login')}>Entrar</button>
          <button type="button" aria-pressed={creating} className={creating ? 'is-active' : ''} onClick={() => changeMode('signup')}>Criar conta</button>
        </div>

        {awaitingConfirmation ? <section className="study-auth-form" aria-label="Confirmação de e-mail">
          <h2>Confirme seu e-mail</h2>
          <p className="study-auth-feedback is-notice">Enviamos um link para {confirmationEmail}. Abra sua caixa de entrada ou spam e toque no link para ativar sua conta.</p>
          <button type="button" className="study-auth-submit" onClick={() => changeMode('login')}>Já confirmei, entrar <ArrowRight size={18}/></button>
          <button type="button" className="study-auth-google" disabled={loading || resendSeconds > 0} onClick={resendConfirmation}>{resendSeconds > 0 ? `Reenviar em ${resendSeconds}s` : 'Reenviar confirmação'}</button>
          {erro && <p className="study-auth-feedback is-error" role="alert">{erro}</p>}
          <button type="button" className="study-auth-google" onClick={() => {setConfirmationEmail(''); setNotice(''); setErro('')}}>Corrigir endereço de e-mail</button>
        </section> : <form className="study-auth-form"
          onFocusCapture={event => setFocusedField(event.target.name || null)}
          onBlurCapture={event => {
            if (!event.currentTarget.contains(event.relatedTarget)) setFocusedField(null)
          }}
          autoComplete={creating ? 'off' : 'on'} onSubmit={handleSubmit}>
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
              <input type={showPassword ? 'text' : 'password'} autoComplete={creating ? 'new-password' : 'current-password'} name="password" id="auth-password" placeholder={creating ? 'Mínimo de 8 caracteres' : 'Sua senha'} value={password} onChange={event => setPassword(event.target.value)} required />
              <button className="study-auth-reveal" type="button" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setShowPassword(value => !value)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </div>
          <div className="study-auth-confirm" data-open={creating} inert={!creating} style={{ transition: 'none' }}>
            <div className="study-auth-confirm-clip" style={{ transition: 'none' }}>
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
          {confirmationEmail && confirmationEmail === email.trim().toLowerCase() && <button type="button" className="study-auth-google" disabled={loading || resendSeconds > 0} onClick={resendConfirmation}>{resendSeconds > 0 ? `Reenviar confirmação em ${resendSeconds}s` : 'Reenviar e-mail de confirmação'}</button>}

          <button className="study-auth-submit" type="submit" disabled={loading || demoLoading}>
            {loading ? 'Aguarde…' : creating ? 'Criar conta' : 'Entrar'}
            {!loading && <ArrowRight size={18} aria-hidden="true" />}
          </button>
        </form>}

        <div className="study-auth-divider"><span>ou</span></div>
        <button className="study-auth-google" type="button" onClick={handleGoogle} disabled={loading || demoLoading}>
          <GoogleIcon /> Continuar com Google
        </button>


      </section>
    </main>
  )
}