import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, m as motion } from 'framer-motion'
import {
  ArrowLeft, ArrowRight, Check, Stethoscope, Brain, Scale, Settings2,
  Code2, BookOpen, Sigma, FlaskConical, Globe2, Languages, PencilLine,
  Plus, Sparkles,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useStudyReducedMotion } from '../lib/motion'
import RainWindow from '../components/RainWindow'
import kiraBlink from '../assets/kira-blink.webp'
import kiraStill from '../assets/kira-rest.webp'
import './Onboarding.css'

// The stored IDs are preserved for existing dashboards and user profiles.
const COURSES = [
  { id: 'medicina', label: 'Medicina', Icon: Stethoscope },
  { id: 'psicologia', label: 'Psicologia', Icon: Brain },
  { id: 'direito', label: 'Direito', Icon: Scale },
  { id: 'engenharia', label: 'Engenharia', Icon: Settings2 },
  { id: 'computacao', label: 'Computação / TI', Icon: Code2 },
  { id: 'outros', label: 'Outro curso', Icon: BookOpen },
]

const SUBJECTS = [
  { id: 'matematica', label: 'Matemática', Icon: Sigma },
  { id: 'natureza', label: 'Ciências da Natureza', Icon: FlaskConical },
  { id: 'humanas', label: 'Ciências Humanas', Icon: Globe2 },
  { id: 'linguagens', label: 'Linguagens', Icon: Languages },
  { id: 'redacao', label: 'Redação', Icon: PencilLine },
  { id: 'outro', label: 'Outro', Icon: Plus },
]

const STEPS = [
  { eyebrow: '01 / UM OBJETIVO', title: 'Onde você quer chegar?', hint: 'Escolha o curso que está no seu horizonte.' },
  { eyebrow: '02 / SEU PONTO DE PARTIDA', title: 'O que precisa de atenção?', hint: 'Pode escolher mais de uma matéria.' },
  { eyebrow: '03 / UM NOVO COMEÇO', title: 'Como posso te chamar?', hint: 'Um nome ou apelido. Você decide.' },
]

const motionSpring = { type: 'spring', stiffness: 360, damping: 35, mass: 0.75 }

export default function Onboarding() {
  const navigate = useNavigate()
  const reduced = useStudyReducedMotion()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [course, setCourse] = useState('')
  const [subjects, setSubjects] = useState([])
  const [otherSubject, setOtherSubject] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    supabase.auth.getUser().then(({ data, error: authError }) => {
      if (!mounted) return
      if (authError || !data?.user) {
        navigate('/login', { replace: true })
        return
      }
      const full = data.user.user_metadata?.full_name || data.user.user_metadata?.name || ''
      const first = full.trim().split(/\s+/)[0] || ''
      setName(current => current || first)
    }).catch(() => {
      if (mounted) setError('Não foi possível validar sua sessão. Tente entrar novamente.')
    })
    return () => { mounted = false }
  }, [navigate])

  const selectedCourse = COURSES.find(item => item.id === course)
  const hasOther = subjects.includes('outro')
  const canContinue = step === 0 ? Boolean(course)
    : step === 1 ? subjects.length > 0 && (!hasOther || Boolean(otherSubject.trim()))
      : Boolean(name.trim())
  const message = step === 0
    ? selectedCourse
      ? `${selectedCourse.label}. Vamos construir seu caminho.`
      : 'Primeiro, quero entender aonde você quer chegar.'
    : step === 1
      ? subjects.length
        ? `${subjects.length} ${subjects.length === 1 ? 'área marcada' : 'áreas marcadas'}. Vou usar isso no seu plano.`
        : 'Não precisa dominar tudo de uma vez.'
      : name.trim()
        ? `Combinado, ${name.trim().slice(0, 30)}. Vamos começar?`
        : 'Quero que este espaço tenha a sua cara.'

  const toggleSubject = id => {
    setError('')
    setSubjects(previous => previous.includes(id)
      ? previous.filter(value => value !== id)
      : [...previous, id])
  }

  const advance = async event => {
    event.preventDefault()
    if (!canContinue || loading) return
    setError('')
    if (step < 2) {
      setStep(current => current + 1)
      return
    }
    setLoading(true)
    try {
      const { data, error: authError } = await supabase.auth.getUser()
      if (authError || !data?.user) throw new Error('missing session')
      const areas = subjects.map(id => id === 'outro' ? otherSubject.trim() : id)
      const { error: writeError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        nome: name.trim(),
        curso_objetivo: course,
        area_dificuldade: JSON.stringify(areas),
        onboarding_completo: true,
      })
      if (writeError) throw writeError
      navigate('/dashboard', { replace: true })
    } catch {
      setError('Não foi possível salvar suas escolhas. Verifique sua conexão e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="welcome-page">
      <RainWindow still={reduced} />
      <div className="welcome-atmosphere" aria-hidden="true" />
      <div className="welcome-shell">
        <header className="welcome-topbar">
          <span className="welcome-brand">StudyOS<span className="welcome-brand-dot" /></span>
          <span className="welcome-context">SEU ESPAÇO DE ESTUDO <span aria-hidden="true">/</span> PRIMEIRO ACESSO</span>
        </header>

        <div className="welcome-workflow">
          <aside className="welcome-guide" aria-label="Kira, sua assistente de estudos">
            <div className="welcome-guide-caption"><Sparkles size={12} aria-hidden="true" /> SUA JORNADA COMEÇA AQUI</div>
            <div className="welcome-kira-figure">
              <motion.img
                src={reduced ? kiraStill : kiraBlink}
                alt="Kira, assistente do StudyOS"
                width="294" height="248" draggable="false"
                animate={reduced ? undefined : { y: [0, -2, 0] }}
                transition={{ duration: 5.8, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
            <div className="welcome-kira-message">
              <span className="welcome-kira-label"><i /> KIRA</span>
              <div className="welcome-kira-message-body" aria-live={step === 2 ? "off" : "polite"} aria-atomic="true">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.p key={step === 2 ? 'personal-greeting' : message}
                    initial={reduced ? false : { opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduced ? undefined : { opacity: 0, y: -4 }}
                    transition={{ duration: reduced ? 0 : 0.18 }}
                  >{message}</motion.p>
                </AnimatePresence>
              </div>
            </div>
            <span className="welcome-guide-foot">UM PASSO DE CADA VEZ.</span>
          </aside>

          <section className="welcome-panel" aria-labelledby="welcome-title">
            <div className="welcome-progress">
              <div className="welcome-progress-top">
                <span>PERSONALIZAÇÃO</span>
                <span>{String(step + 1).padStart(2, '0')} <span className="welcome-progress-divider">/ 03</span></span>
              </div>
              <div className="welcome-progress-bars" role="progressbar" aria-label="Etapa de personalização" aria-valuemin={1} aria-valuemax={3} aria-valuenow={step + 1}>
                {[0, 1, 2].map(index => (
                  <span key={index} className="welcome-progress-track">
                    <motion.span initial={false} animate={{ scaleX: index <= step ? 1 : 0 }} style={{ originX: 0 }} transition={reduced ? { duration: 0 } : motionSpring} />
                  </span>
                ))}
              </div>
            </div>

            <form className="welcome-form" onSubmit={advance}>
              <div className="welcome-stage-body">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div key={step} className="welcome-stage"
                    initial={reduced ? false : { opacity: 0, x: 14 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reduced ? undefined : { opacity: 0, x: -12 }}
                    transition={reduced ? { duration: 0 } : { duration: 0.21, ease: [0.22, 1, 0.36, 1] }}>
                    <header className="welcome-stage-heading">
                      <span className="welcome-eyebrow">{STEPS[step].eyebrow}</span>
                      <h1 id="welcome-title">{STEPS[step].title}</h1>
                      <p>{STEPS[step].hint}</p>
                    </header>
                    {step === 0 && (
                      <div className="welcome-options" role="group" aria-label="Curso desejado">
                        {COURSES.map(({ id, label, Icon }) => (
                          <motion.button type="button" key={id}
                            className="welcome-option" data-selected={course === id}
                            aria-pressed={course === id}
                            onClick={() => { setCourse(id); setError('') }}
                            whileTap={reduced ? undefined : { scale: 0.988 }}
                            transition={motionSpring}>
                            <span className="welcome-option-icon"><Icon size={19} strokeWidth={1.7} aria-hidden="true" /></span>
                            <span className="welcome-option-name">{label}</span>
                            <span className="welcome-option-check" aria-hidden="true"><Check size={15} strokeWidth={2.3} /></span>
                          </motion.button>
                        ))}
                      </div>
                    )}
                    {step === 1 && (
                      <>
                        <div className="welcome-selection-count">{subjects.length ? `${subjects.length} ${subjects.length === 1 ? 'selecionada' : 'selecionadas'}` : 'Escolha pelo menos uma'}</div>
                        <div className="welcome-options" role="group" aria-label="Matérias que precisam de atenção">
                          {SUBJECTS.map(({ id, label, Icon }) => (
                            <div key={id}>
                              <motion.button type="button"
                                className="welcome-option" data-selected={subjects.includes(id)}
                                aria-pressed={subjects.includes(id)}
                                onClick={() => toggleSubject(id)}
                                whileTap={reduced ? undefined : { scale: 0.988 }}
                                transition={motionSpring}>
                                <span className="welcome-option-icon"><Icon size={19} strokeWidth={1.7} aria-hidden="true" /></span>
                                <span className="welcome-option-name">{label}</span>
                                <span className="welcome-option-check" aria-hidden="true"><Check size={15} strokeWidth={2.3} /></span>
                              </motion.button>
                              {id === 'outro' && hasOther && (
                                <div className="welcome-other-field">
                                  <label htmlFor="welcome-other">Qual matéria?</label>
                                  <input id="welcome-other" type="text" value={otherSubject}
                                    onChange={event => setOtherSubject(event.target.value)}
                                    maxLength={50} autoComplete="off" placeholder="Conte para a Kira" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    {step === 2 && (
                      <div className="welcome-name-area">
                        <label htmlFor="welcome-name">SEU NOME</label>
                        <input type="text" id="welcome-name" maxLength={30} value={name}
                          onChange={event => { setName(event.target.value); setError('') }}
                          autoComplete="given-name" enterKeyHint="done" placeholder="Como quer ser chamado?" />
                        <p>É assim que a Kira vai se dirigir a você.</p>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="welcome-actions">
                {error && <p className="welcome-error" role="alert">{error}</p>}
                <div className="welcome-actions-row">
                  {step > 0 && (
                    <button type="button" className="welcome-back" aria-label="Voltar etapa" disabled={loading}
                      onClick={() => { setStep(current => current - 1); setError('') }}>
                      <ArrowLeft size={19} strokeWidth={1.7} aria-hidden="true" />
                    </button>
                  )}
                  <motion.button type="submit" className="welcome-next"
                    disabled={!canContinue || loading} whileTap={reduced || !canContinue || loading ? undefined : { scale: 0.988 }}>
                    <span>{loading ? 'Salvando seu espaço…' : step < 2 ? 'Continuar' : 'Entrar no StudyOS'}</span>
                    {!loading && <ArrowRight size={18} strokeWidth={1.8} aria-hidden="true" />}
                  </motion.button>
                </div>
                <p className="welcome-privacy">SUAS ESCOLHAS PODEM SER ALTERADAS DEPOIS.</p>
              </div>
            </form>
          </section>
        </div>
      </div>
    </main>
  )
}
