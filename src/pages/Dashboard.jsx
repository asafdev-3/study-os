import { useEffect, useState } from 'react'
import { ArrowRight, BookOpen, Timer, GraduationCap, Radio, Settings, StickyNote, MessageCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { StudyLink } from '../components/StudyLink'
import './Dashboard.css'

const subjects = {
  matematica: ['mt', 'Matemática'],
  natureza: ['cn', 'Ciências da Natureza'],
  humanas: ['ch', 'Ciências Humanas'],
  linguagens: ['lc', 'Linguagens'],
  redacao: ['red', 'Redação'],
}

const COURSE_LABELS = {
  medicina: 'Medicina',
  psicologia: 'Psicologia',
  direito: 'Direito',
  engenharia: 'Engenharia',
  computacao: 'Computação / TI',
  outros: 'seu curso',
}

function formatCourse(value) {
  if (!value) return null
  const key = value.trim().toLowerCase()
  return COURSE_LABELS[key] || value
}

function mainSubject(value) {
  let keys = value
  if (typeof value === 'string') { try { keys = JSON.parse(value) } catch { /* Single subject. */ } }
  return subjects[Array.isArray(keys) ? keys[0] : keys]
}



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
  const courseName = formatCourse(profile?.curso_objetivo)
  const notePath = note ? '/anotacoes?nota=' + encodeURIComponent(note.id) : '/anotacoes'

  return (
    <main className="study-room desk-home">
      <header className="desk-toolbar">
        <span>StudyOS</span>
        <div><StudyLink to="/nfc" aria-label="Abrir recursos NFC"><Radio size={20} /></StudyLink>
          <StudyLink to="/configuracoes" aria-label="Configurações"><Settings size={20} /></StudyLink></div>
      </header>
      <div className="desk-layout">
        <section className="desk-journal">
          <p className="desk-date">{new Date(now).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1>{firstName ? `Olá, ${firstName}.` : 'Sua mesa.'}</h1>
          {courseName && <p className="desk-goal">A caminho de {courseName}.</p>}
          {error && <p role="alert">Falha ao carregar sua mesa. <button onClick={() => { setError(false); setRetry(x => x + 1) }}>Tentar novamente</button></p>}
          <StudyLink className="desk-leaf" to={notePath}>
            <span><BookOpen size={17} />{note ? 'Última anotação' : 'Meu caderno'}</span>
            <h2>{note?.title || 'Abra seu caderno.'}</h2>
            {note?.content && <p>{note.content}</p>}
            <strong>{note ? 'Continuar leitura' : noteError ? 'Consultar anotações' : 'Abrir anotações'} <ArrowRight size={17} /></strong>
          </StudyLink>
          <StudyLink className="desk-subject" to={'/anotacoes?area=' + area}>Caderno de {subject} <ArrowRight size={15} /></StudyLink>
        </section>
        <nav className="desk-agenda" aria-label="Ferramentas de estudo">
          <h2>Na sua mesa</h2>
          <StudyLink to="/enem"><GraduationCap /><span>Estudar para o ENEM</span><ArrowRight /></StudyLink>
          <StudyLink to="/chat" state={{ prompt }}><MessageCircle /><span>Revisar {subject} com Kira</span><ArrowRight /></StudyLink>
          <StudyLink to="/caverna"><Timer /><span>25 minutos de foco</span><ArrowRight /></StudyLink>
          <StudyLink to="/lembretes"><StickyNote /><span>Meus post-its</span><ArrowRight /></StudyLink>
        </nav>
      </div>
    </main>
  )
}
