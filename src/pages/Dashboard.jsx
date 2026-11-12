import { useEffect, useState } from 'react'
import { ArrowRight, BookOpen, Radio, Timer } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { StudyLink } from '../components/StudyLink'
import { readFocus } from '../lib/focus'
import kira from '../assets/kira-studyos.webp'

const subjects = {
  matematica: ['mt', 'Matemática'], natureza: ['cn', 'Ciências da Natureza'],
  humanas: ['ch', 'Ciências Humanas'], linguagens: ['lc', 'Linguagens'], redacao: ['red', 'Redação'],
}
function mainSubject(value) {
  let keys = value
  if (typeof value === 'string') { try { keys = JSON.parse(value) } catch { /* Single subject. */ } }
  return subjects[Array.isArray(keys) ? keys[0] : keys]
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [note, setNote] = useState(null)
  const [noteError, setNoteError] = useState(false)
  const [userId, setUserId] = useState(null)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  const [now, setNow] = useState(Date.now)

  useEffect(() => {
    let active = true
    async function load() {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw authError ?? new Error('Sessão indisponível')
      const [profileResult, noteResult] = await Promise.all([
        supabase.from('profiles').select('nome, curso_objetivo, area_dificuldade, onboarding_completo').eq('id', user.id).maybeSingle(),
        supabase.from('annotations').select('id,title,content,area').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1),
      ])
      if (!active) return
      if (profileResult.error) throw profileResult.error
      if (!profileResult.data?.onboarding_completo) { navigate('/onboarding', { replace: true }); return }
      setProfile(profileResult.data)
      setUserId(user.id)
      setNote(noteResult.data?.[0] ?? null)
      setNoteError(Boolean(noteResult.error))
    }
    load().catch(() => { if (active) setError(true) })
    return () => { active = false }
  }, [navigate, retry])

  const focus = userId ? readFocus(`studyos:focus:${userId}`) : null
  const deadline = focus?.deadline
  useEffect(() => {
    if (!deadline) return
    const tick = () => setNow(Date.now())
    const interval = setInterval(tick, 1000)
    window.addEventListener('focus', tick)
    return () => { clearInterval(interval); window.removeEventListener('focus', tick) }
  }, [deadline])

  const seconds = deadline ? Math.max(0, Math.ceil((deadline - now) / 1000)) : focus?.seconds ?? 1500
  const clock = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
  const [area, subject] = mainSubject(profile?.area_dificuldade) ?? ['mt', 'Matemática']
  const prompt = `Me ajude a revisar ${subject} para o ENEM. Comece com uma questão simples.`
  const firstName = profile?.nome?.trim().split(/\s+/)[0]
  const notePath = note ? '/anotacoes?nota=' + encodeURIComponent(note.id) : '/anotacoes'

  return (
    <main className="study-room study-page">
      <img className="study-room-scene" src="/images/study-room.webp" alt="" width="1536" height="1024" fetchPriority="high" />
      <div className="study-room-shade" aria-hidden="true" />
      <div className="study-room-content">
        <header className="study-room-header">
          <div className="study-room-brand"><img src="/icons/icon-192.png" alt="" width="38" height="38" /><span>Study<span>OS</span><small>SUA SALA DE ESTUDO</small></span></div>
          <StudyLink to="/nfc" className="study-room-nfc"><Radio size={17} aria-hidden="true" /><span>NFC</span></StudyLink>
        </header>

        <section className="study-room-welcome">
          <p>{new Date(now).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1>{firstName ? `Olá, ${firstName}.` : 'Seu espaço de estudo.'}</h1>
          <span>{profile?.curso_objetivo ? `A caminho de ${profile.curso_objetivo}.` : 'Seu caderno, suas ideias, seu ritmo.'}</span>
        </section>
        {error && <p role="alert" className="study-room-error">Não foi possível carregar seu espaço. <button onClick={() => { setError(false); setRetry(value => value + 1) }}>Tentar novamente</button></p>}

        <section className="study-room-workspace" aria-label="Na sua mesa">
          <div className="study-desk-label"><span />Na sua mesa</div>
          <StudyLink to={notePath} className="study-desk-paper">
            <div className="study-paper-meta"><span>{note ? 'ÚLTIMA ANOTAÇÃO' : 'CADERNO PESSOAL'}</span><BookOpen size={18} aria-hidden="true" /></div>
            <h2>{note?.title || (noteError ? 'Abra seu caderno.' : 'Ideias que ficam.')}</h2>
            <p>{note?.content || (noteError ? 'Consulte suas anotações e continue de onde parou.' : 'Anote o que fez sentido. Volte ao que ainda precisa entender.')}</p>
            <span className="study-paper-link">{note ? 'Continuar leitura' : 'Abrir anotações'}<ArrowRight size={18} aria-hidden="true" /></span>
          </StudyLink>
          <StudyLink className="study-room-subject" to={'/anotacoes?area=' + area}>Caderno de {subject}<ArrowRight size={15} aria-hidden="true" /></StudyLink>
        </section>

        <footer className="study-room-dock">
          <section className="study-room-focus" aria-label="Sessão de foco">
            <div className="study-room-clock"><Timer size={16} aria-hidden="true" /><span>{clock}</span></div>
            <div className="study-room-focus-copy"><strong>{deadline ? (seconds > 0 ? 'Seu foco continua.' : 'Sessão concluída.') : focus ? 'No seu ritmo.' : 'Uma coisa por vez.'}</strong><small>{focus ? 'Sua sessão de estudo' : '25 minutos para o próximo passo'}</small></div>
            <StudyLink className="study-primary" to={focus ? '/enem' : '/nfc?acao=foco&area=' + area}>{focus ? (seconds === 0 ? 'Ver sessão' : 'Retomar') : 'Entrar em foco'}<ArrowRight size={16} aria-hidden="true" /></StudyLink>
          </section>
          <StudyLink className="study-room-kira" to="/chat" state={{ prompt }}>
            <img src={kira} alt="" width="40" height="40" />
            <span><strong>Kira sugere</strong><small>Vamos revisar {subject}?</small></span>
            <ArrowRight size={18} aria-hidden="true" />
          </StudyLink>
        </footer>
      </div>
    </main>
  )
}
