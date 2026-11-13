import { useEffect, useState } from 'react'
import { ArrowRight, BookOpen, Radio, Settings, StickyNote } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { StudyLink } from '../components/StudyLink'
import { KiraAvatar } from '../components/KiraAvatar'

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
  useEffect(() => {
    document.documentElement.dataset.studyHome = 'true'
    window.scrollTo(0, 0)
    return () => { delete document.documentElement.dataset.studyHome }
  }, [])
  const [profile, setProfile] = useState(null)
  const [note, setNote] = useState(null)
  const [noteError, setNoteError] = useState(false)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  const [now] = useState(Date.now)

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
    <main className="study-room study-page">
      <img className="study-room-scene" src="/images/study-room.webp" alt="" width="1536" height="1024" fetchPriority="high" />
      <div className="study-room-shade" aria-hidden="true" />
      <div className="study-room-content">
        <header className="study-room-header">
          <div className="study-room-brand"><img src="/icons/icon-192.png" alt="" width="38" height="38" /><span>Study<span>OS</span><small>SUA SALA DE ESTUDO</small></span></div>
          <div className="study-room-header-actions"><StudyLink to="/nfc" className="study-room-nfc"><Radio size={17} aria-hidden="true" /><span>NFC</span></StudyLink><StudyLink to="/configuracoes" className="study-room-nfc" aria-label="Configurações"><Settings size={17} /></StudyLink></div>
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
          <StudyLink className="study-room-kira" to="/lembretes"><StickyNote size={24} /><span><strong>Meus post-its</strong><small>Tarefas e lembretes de estudo</small></span><ArrowRight size={18} /></StudyLink>
          <StudyLink className="study-room-kira" to="/chat" state={{ prompt }}>
            <KiraAvatar size={66} />
            <span><strong>Kira sugere</strong><small>Vamos revisar {subject}?</small></span>
            <ArrowRight size={18} aria-hidden="true" />
          </StudyLink>
        </footer>
      </div>
    </main>
  )
}
