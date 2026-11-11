import { useEffect, useState } from 'react'
import { ArrowRight, BookOpen, Sparkles, Timer } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { StudyLink } from '../components/StudyLink'
import { readFocus } from '../lib/focus'

const materias = {
  matematica: 'Matemática', natureza: 'Ciências da Natureza', humanas: 'Ciências Humanas',
  linguagens: 'Linguagens', redacao: 'Redação',
}

function materiaPrincipal(value) {
  let keys = value
  if (typeof value === 'string') {
    try { keys = JSON.parse(value) } catch { keys = value }
  }
  const key = Array.isArray(keys) ? keys[0] : keys
  return materias[key] ?? ''
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [userId, setUserId] = useState(null)
  const [openedAt] = useState(Date.now)
  const [perfil, setPerfil] = useState(null)
  const [erro, setErro] = useState(false)
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    let active = true
    async function carregar() {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw authError ?? new Error('Sessão indisponível')
      const { data, error } = await supabase.from('profiles')
        .select('nome, curso_objetivo, area_dificuldade, onboarding_completo')
        .eq('id', user.id).maybeSingle()
      if (!active) return
      if (error) throw error
      if (!data?.onboarding_completo) navigate('/onboarding', { replace: true })
      else { setUserId(user.id); setPerfil(data) }
    }
    carregar().catch(() => { if (active) setErro(true) })
    return () => { active = false }
  }, [navigate, tentativa])

  const materia = materiaPrincipal(perfil?.area_dificuldade)
  const pergunta = materia
    ? `Me ajude a revisar ${materia} para o ENEM. Comece com uma questão simples.`
    : 'Me ajude a escolher um assunto para revisar para o ENEM hoje.'
  const primeiroNome = perfil?.nome?.trim().split(/\s+/)[0]

  const focus = userId ? readFocus(`studyos:focus:${userId}`) : null
  const completed = focus?.deadline != null && focus.deadline <= openedAt
  const inProgress = Boolean(focus) && !completed

  return (
    <main className="study-page study-home">
      <header className="study-home-title">
        <div>
          <p>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1>{primeiroNome ? `Olá, ${primeiroNome}.` : 'StudyOS'}</h1>
        </div>
        {perfil?.curso_objetivo && <p>{perfil.curso_objetivo}</p>}
      </header>

      {erro && <p role="status" className="study-note">
        Não foi possível carregar seu perfil.{' '}
        <button type="button" onClick={() => { setErro(false); setTentativa((value) => value + 1) }}>Tentar novamente</button>
      </p>}

      <section className="study-home-focus" aria-labelledby="study-focus-title">
        <div className="study-home-dial" aria-hidden="true">
          <div className="study-home-dial-face">
            <Timer size={19} strokeWidth={1.5} />
            <span>{inProgress ? (focus.deadline ? 'Em foco' : 'Pausado') : '25:00'}</span>
            <span>{inProgress ? 'SESSÃO ATUAL' : 'TEMPO DE FOCO'}</span>
          </div>
        </div>
        <h2 id="study-focus-title">Sessão de foco</h2>
        <StudyLink className="study-primary" to="/enem">
          {inProgress ? 'Retomar sessão' : completed ? 'Ver sessão' : 'Abrir sessão'} <ArrowRight size={16} aria-hidden="true" />
        </StudyLink>
      </section>

      <section className="study-home-actions" aria-label="Mais opções de estudo">
        <StudyLink to="/chat" state={{ prompt: pergunta }}>
          <Sparkles size={20} strokeWidth={1.6} aria-hidden="true" />
          <span><strong>Kira sugere</strong><small>{materia ? `Revise ${materia}` : 'Escolha um assunto para revisar'}</small></span>
          <ArrowRight size={17} aria-hidden="true" />
        </StudyLink>
        <StudyLink to="/anotacoes">
          <BookOpen size={20} strokeWidth={1.6} aria-hidden="true" />
          <span><strong>Minhas anotações</strong></span>
          <ArrowRight size={17} aria-hidden="true" />
        </StudyLink>
      </section>
    </main>
  )
}
