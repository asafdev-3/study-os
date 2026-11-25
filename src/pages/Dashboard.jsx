import { useEffect, useState } from 'react'
import { ArrowRight, BookOpen, GraduationCap, Pause, Play, Radio, Settings, StickyNote } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { StudyLink } from '../components/StudyLink'
import { KiraAvatar } from '../components/KiraAvatar'
import RainWindow from '../components/RainWindow'
import { useStudyReducedMotion } from '../lib/motion'
import './Dashboard.css'

const subjects = {
  matematica: ['mt', 'Matemática'], natureza: ['cn', 'Ciências da Natureza'],
  humanas: ['ch', 'Ciências Humanas'], linguagens: ['lc', 'Linguagens'], redacao: ['red', 'Redação'],
}
function mainSubject(value) {
  let keys = value
  if (typeof value === 'string') { try { keys = JSON.parse(value) } catch { /* Single subject. */ } }
  return subjects[Array.isArray(keys) ? keys[0] : keys]
}

const isAndroidDevice = () => document.documentElement.classList.contains('is-android')

export default function Dashboard() {
  const navigate = useNavigate()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  const [profile, setProfile] = useState(null)
  const [note, setNote] = useState(null)
  const [noteError, setNoteError] = useState(false)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  const [now] = useState(Date.now)
  const android = isAndroidDevice()
  const reducedMotion = useStudyReducedMotion() || android
  const [rainPaused, setRainPaused] = useState(() => android)
  const [rainHidden, setRainHidden] = useState(() => document.hidden)

  useEffect(() => {
    const onVisibility = () => setRainHidden(document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

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
      setNote(noteResult.data?.[0] ?? null)
      setNoteError(Boolean(noteResult.error))
    }
    load().catch(() => { if (active) setError(true) })
    return () => { active = false }
  }, [navigate, retry])

  const [area, subject] = mainSubject(profile?.area_dificuldade) ?? ['mt', 'Matemática']
  const prompt = `Me ajude a revisar ${subject} para o ENEM. Comece com uma questão simples.`
  const firstName = profile?.nome?.trim().split(/\s+/)[0]
  const notePath = note ? '/anotacoes?nota=' + encodeURIComponent(note.id) : '/anotacoes'

  return (
    <main className="study-room study-page study-home-v2">
      {!android && (
        <div className="study-home-rain" aria-hidden="true">
          <RainWindow still={reducedMotion || rainPaused || rainHidden} />
        </div>
      )}
      <div className="study-room-shade" aria-hidden="true" />

      <div className="study-room-content">
        <header className="study-room-header">
          <div className="study-room-brand">
            <img src="/icons/icon-192.png" alt="" width="38" height="38" />
            <span>Study<span>OS</span><small>SUA SALA DE ESTUDO</small></span>
          </div>
          <div className="study-room-header-actions">
            {!reducedMotion && !android && (
              <button
                type="button"
                className="study-home-rain-toggle"
                aria-label={rainPaused ? 'Ativar animação de chuva' : 'Pausar animação de chuva'}
                aria-pressed={!rainPaused}
                title={rainPaused ? 'Retomar chuva' : 'Pausar chuva'}
                onClick={() => setRainPaused(value => !value)}
              >
                {rainPaused ? <Play size={17} aria-hidden="true" /> : <Pause size={17} aria-hidden="true" />}
              </button>
            )}
            <StudyLink to="/nfc" className="study-room-nfc" aria-label="Abrir recursos NFC">
              <Radio size={17} aria-hidden="true" /><span>NFC</span>
            </StudyLink>
            <StudyLink to="/configuracoes" className="study-room-nfc" aria-label="Configurações">
              <Settings size={17} aria-hidden="true" />
            </StudyLink>
          </div>
        </header>

        <div className="study-home-grid">
          <div className="study-home-main">
            <section className="study-room-welcome">
              <p>{new Date(now).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              <h1>{firstName ? `Olá, ${firstName}.` : 'Seu espaço de estudo.'}</h1>
              <span>{profile?.curso_objetivo ? `A caminho de ${profile.curso_objetivo}.` : 'Seu caderno, suas ideias, seu ritmo.'}</span>
            </section>

            {error && (
              <p role="alert" className="study-room-error">
                Não foi possível carregar seu espaço.{' '}
                <button onClick={() => { setError(false); setRetry(value => value + 1) }}>Tentar novamente</button>
              </p>
            )}

            <StudyLink to="/enem" className="study-home-session">
              <span className="study-home-session-icon"><GraduationCap size={22} aria-hidden="true" /></span>
              <span className="study-home-session-copy"><strong>Começar uma sessão</strong><small>ENEM, questões e tempo de foco</small></span>
              <ArrowRight size={19} aria-hidden="true" />
            </StudyLink>

            <section className="study-room-workspace" aria-label="Na sua mesa">
              <div className="study-desk-label"><span />Na sua mesa</div>
              <StudyLink to={notePath} className="study-desk-paper">
                <div className="study-paper-meta">
                  <span>{note ? 'ÚLTIMA ANOTAÇÃO' : 'CADERNO PESSOAL'}</span>
                  <BookOpen size={18} aria-hidden="true" />
                </div>
                <h2>{note?.title || (noteError ? 'Abra seu caderno.' : 'Ideias que ficam.')}</h2>
                <p>{note?.content || (noteError ? 'Consulte suas anotações e continue de onde parou.' : 'Anote o que fez sentido. Volte ao que ainda precisa entender.')}</p>
                <span className="study-paper-link">
                  {note ? 'Continuar leitura' : 'Abrir anotações'}
                  <ArrowRight size={18} aria-hidden="true" />
                </span>
              </StudyLink>
              <StudyLink className="study-room-subject" to={'/anotacoes?area=' + area}>
                Caderno de {subject}<ArrowRight size={15} aria-hidden="true" />
              </StudyLink>
            </section>
          </div>

          <aside className="study-home-secondary" aria-label="Ferramentas de estudo">
            <p className="study-home-secondary-label">À mão</p>
            <div className="study-room-dock">
              <StudyLink className="study-room-kira study-room-postits" to="/lembretes">
                <StickyNote size={24} aria-hidden="true" />
                <span><strong>Meus post-its</strong><small>Tarefas e lembretes de estudo</small></span>
                <ArrowRight size={18} aria-hidden="true" />
              </StudyLink>
              <StudyLink className="study-room-kira" to="/chat" state={{ prompt }}>
                <KiraAvatar size={66} />
                <span><strong>Kira sugere</strong><small>Vamos revisar {subject}?</small></span>
                <ArrowRight size={18} aria-hidden="true" />
              </StudyLink>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}