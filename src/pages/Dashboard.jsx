import { useEffect, useState } from 'react'
import { ArrowRight, BookOpen, Sparkles, Timer } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

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
      else setPerfil(data)
    }
    carregar().catch(() => { if (active) setErro(true) })
    return () => { active = false }
  }, [navigate, tentativa])

  const materia = materiaPrincipal(perfil?.area_dificuldade)
  const pergunta = materia
    ? `Me ajude a revisar ${materia} para o ENEM. Comece com uma questão simples.`
    : 'Me ajude a escolher um assunto para revisar para o ENEM hoje.'
  const primeiroNome = perfil?.nome?.trim().split(/\s+/)[0]

  return (
    <main className="study-page study-dashboard">
      <header className="study-home-header">
        <p>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        <h1>{primeiroNome ? `Olá, ${primeiroNome}.` : 'Seu espaço de estudo.'}</h1>
        {perfil?.curso_objetivo && <p>Objetivo · {perfil.curso_objetivo}</p>}
      </header>

      {erro && <p role="status" className="study-note">
        Não foi possível carregar seu perfil.{' '}
        <button type="button" onClick={() => { setErro(false); setTentativa((value) => value + 1) }}>Tentar novamente</button>
      </p>}

      <section className="study-focus-card">
        <Timer size={22} aria-hidden="true" />
        <div>
          <h2>Sessão de foco</h2>
          <p>25 minutos para estudar uma matéria.</p>
        </div>
        <Link className="study-primary" to="/enem">Abrir timer <ArrowRight size={17} aria-hidden="true" /></Link>
      </section>

      <section className="study-suggestion">
        <span className="study-eyebrow"><Sparkles size={14} aria-hidden="true" /> Kira sugere</span>
        <h2>{materia ? `Revise ${materia}` : 'Escolha um assunto para revisar'}</h2>
        <p>{materia ? 'Comece por uma questão e veja onde precisa praticar.' : 'Comece pela matéria em que você tem mais dúvida.'}</p>
        <Link to="/chat" state={{ prompt: pergunta }}>Conversar com a Kira <ArrowRight size={16} aria-hidden="true" /></Link>
      </section>

      <Link className="study-notes-link" to="/anotacoes">
        <BookOpen size={19} aria-hidden="true" /> Minhas anotações <ArrowRight size={17} aria-hidden="true" />
      </Link>
    </main>
  )
}
