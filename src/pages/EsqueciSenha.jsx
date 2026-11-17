import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { supabase } from '../lib/supabase'
import './Auth.css'

export default function EsqueciSenha() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isRecoveryLink = searchParams.get('redefinir') === '1'
  const [mode, setMode] = useState(isRecoveryLink ? 'checking' : 'request')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isRecoveryLink) return undefined
    let active = true
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (active && event === 'PASSWORD_RECOVERY' && session) setMode('reset')
    })
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (active) setMode(session ? 'reset' : 'invalid')
    })
    return () => { active = false; subscription.unsubscribe() }
  }, [isRecoveryLink])

  async function submit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'request') {
        if (!email.trim()) throw new Error('Informe seu e-mail.')
        const { error: requestError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
          redirectTo: `${window.location.origin}/esqueci-senha?redefinir=1`,
        })
        if (requestError) throw requestError
        setMode('sent')
      } else {
        if (password.length < 8) throw new Error('A senha precisa ter pelo menos 8 caracteres.')
        if (password !== confirmPassword) throw new Error('As senhas não coincidem.')
        const { error: updateError } = await supabase.auth.updateUser({ password })
        if (updateError) throw updateError
        setMode('updated')
      }
    } catch (cause) {
      setError(cause.message || 'Não foi possível concluir. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="study-entry study-auth-page">
      <section className="study-auth-card" aria-labelledby="recovery-title">
        <header className="study-auth-brand">
          <img src="/icons/icon-192.png" alt="" className="study-auth-logo" />
          <span>STUDYOS</span>
        </header>

        {(mode === 'request' || mode === 'reset') && <button className="study-auth-back" type="button" onClick={() => mode === 'reset' ? navigate('/login') : navigate('/login')}><ArrowLeft size={16} /> Voltar ao acesso</button>}

        <div className="study-auth-heading">
          <p className="study-auth-kicker">{mode === 'reset' ? 'NOVA SENHA' : 'ACESSO À CONTA'}</p>
          <h1 id="recovery-title">
            {mode === 'request' && 'Recupere seu acesso.'}
            {mode === 'checking' && 'Validando seu link.'}
            {mode === 'sent' && 'Confira seu e-mail.'}
            {mode === 'reset' && 'Escolha uma nova senha.'}
            {mode === 'updated' && 'Senha atualizada.'}
            {mode === 'invalid' && 'Link expirado ou inválido.'}
          </h1>
          <p>
            {mode === 'request' && 'Enviaremos um link seguro para redefinir sua senha.'}
            {mode === 'checking' && 'Só um instante enquanto verificamos o link de recuperação.'}
            {mode === 'sent' && `Se houver uma conta para ${email || 'esse e-mail'}, enviaremos as instruções para redefinir a senha.`}
            {mode === 'reset' && 'Use uma senha nova com pelo menos 8 caracteres.'}
            {mode === 'updated' && 'Sua senha foi alterada. Você já pode acessar sua conta.'}
            {mode === 'invalid' && 'Peça um novo link e abra-o no mesmo navegador.'}
          </p>
        </div>

        {(mode === 'request' || mode === 'reset') && (
          <form className="study-auth-form" onSubmit={submit}>
            {mode === 'request' ? (
              <label className="study-auth-field">
                <span>E-mail da conta</span>
                <span className="study-auth-input-wrap"><Mail size={18} aria-hidden="true" /><input type="email" autoComplete="email" inputMode="email" placeholder="voce@email.com" value={email} onChange={event => setEmail(event.target.value)} required /></span>
              </label>
            ) : <>
              <label className="study-auth-field">
                <span>Nova senha</span>
                <span className="study-auth-input-wrap"><LockKeyhole size={18} aria-hidden="true" /><input type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Mínimo de 8 caracteres" value={password} onChange={event => setPassword(event.target.value)} required /><button className="study-auth-reveal" type="button" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span>
              </label>
              <label className="study-auth-field">
                <span>Confirme a senha</span>
                <span className="study-auth-input-wrap"><LockKeyhole size={18} aria-hidden="true" /><input type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Digite novamente" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} required /></span>
              </label>
            </>}
            {error && <p className="study-auth-feedback is-error" role="alert">{error}</p>}
            <button className="study-auth-submit" type="submit" disabled={loading}>{loading ? 'Aguarde…' : mode === 'request' ? 'Enviar link' : 'Salvar nova senha'}</button>
          </form>
        )}

        {(mode === 'sent' || mode === 'updated') && <div className="study-auth-success"><CheckCircle2 size={22} aria-hidden="true" /><span>{mode === 'sent' ? 'Solicitação enviada.' : 'Tudo certo. Sua conta está pronta.'}</span></div>}
        {(mode === 'invalid' || mode === 'sent' || mode === 'updated') && <button className="study-auth-google study-auth-secondary" type="button" onClick={() => mode === 'invalid' ? navigate('/esqueci-senha', { replace: true }) : navigate(mode === 'updated' ? '/dashboard' : '/login', { replace: true })}>{mode === 'invalid' ? 'Solicitar novo link' : mode === 'updated' ? 'Continuar para o StudyOS' : 'Voltar ao acesso'}</button>}
        {mode === 'checking' && <p className="study-auth-feedback is-notice" role="status">Verificando o link…</p>}
        <p className="study-auth-terms"><Link to="/login">Voltar para entrar</Link></p>
      </section>
    </main>
  )
}
