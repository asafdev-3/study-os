import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'

const CURSOS = [
  { id: 'medicina',    label: 'Medicina',       emoji: '🩺' },
  { id: 'psicologia',  label: 'Psicologia',     emoji: '🧠' },
  { id: 'direito',     label: 'Direito',         emoji: '⚖️' },
  { id: 'engenharia',  label: 'Engenharia',      emoji: '⚙️' },
  { id: 'computacao',  label: 'Computação / TI', emoji: '💻' },
  { id: 'outros',      label: 'Outro curso',     emoji: '📚' },
]

const DIFICULDADES = [
  { id: 'matematica', label: 'Matemática',          emoji: '📐' },
  { id: 'natureza',   label: 'Ciências da Natureza', emoji: '🔬' },
  { id: 'humanas',    label: 'Ciências Humanas',     emoji: '🌍' },
  { id: 'linguagens', label: 'Linguagens',           emoji: '📝' },
  { id: 'redacao',    label: 'Redação',              emoji: '✍️' },
  { id: 'outro',      label: 'Outro',                emoji: '➕' },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [nome, setNome] = useState('')
  const [curso, setCurso] = useState('')
  const [dificuldades, setDificuldades] = useState([])
  const [outroDificuldade, setOutroDificuldade] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [nomeGoogle, setNomeGoogle] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { navigate('/login'); return }
      const full = user.user_metadata?.full_name || user.user_metadata?.name || ''
      const primeiro = full.split(' ')[0]
      setNomeGoogle(primeiro)
      setNome(primeiro)
    })
  }, [navigate])

  function toggleDificuldade(id) {
    setDificuldades(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    )
  }

  async function finalizar() {
    if (!nome.trim() || !curso || dificuldades.length === 0) return
    setLoading(true)

    const dificuldadesFinais = dificuldades.map(d =>
      d === 'outro' ? (outroDificuldade.trim() || 'outro') : d
    )

    setErro('')
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw new Error('Sessão indisponível')
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        nome: nome.trim(),
        curso_objetivo: curso,
        area_dificuldade: JSON.stringify(dificuldadesFinais),
        onboarding_completo: true,
      })
      if (error) throw error
      navigate('/dashboard', { replace: true })
    } catch {
      setErro('Não foi possível salvar seu perfil. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const temOutro = dificuldades.includes('outro')

  const podeAvancar =
    (step === 0 && !!curso) ||
    (step === 1 && dificuldades.length > 0 && (!temOutro || outroDificuldade.trim())) ||
    (step === 2 && !!nome.trim())

  const container = {
    minHeight: '100dvh',
    background: '#0a0a0a',
    display: 'flex',
    flexDirection: 'column',
    padding: '0 20px',
    maxWidth: 430,
    margin: '0 auto',
    boxSizing: 'border-box',
  }

  const btnOpcao = (selecionado) => ({
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '14px 18px', borderRadius: 14, cursor: 'pointer',
    border: selecionado
      ? '1.5px solid rgba(99,102,241,0.7)'
      : '1.5px solid rgba(255,255,255,0.08)',
    background: selecionado
      ? 'rgba(99,102,241,0.12)'
      : 'rgba(255,255,255,0.04)',
    color: '#fff', fontSize: 16,
    fontWeight: selecionado ? 600 : 400,
    transition: 'all 0.2s', textAlign: 'left',
    width: '100%',
  })

  return (
    <div style={container}>
      {/* Barra de progresso */}
      <div style={{ paddingTop: 60, paddingBottom: 28 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: i <= step
                ? 'linear-gradient(90deg, #3b82f6, #8b5cf6)'
                : 'rgba(255,255,255,0.1)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>
          {step + 1} de 3
        </p>
      </div>

      {/* Conteúdo */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 8 }}>
        <AnimatePresence mode="wait">

          {/* PASSO 1 — Curso */}
          {step === 0 && (
            <motion.div key="s0"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.22 }}
            >
              <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: '0 0 8px', lineHeight: 1.2 }}>
                {nomeGoogle ? `Olá, ${nomeGoogle}.` : 'Olá.'}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 16, margin: '0 0 28px' }}>
                Qual curso você quer entrar?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {CURSOS.map(c => (
                  <button key={c.id} onClick={() => setCurso(c.id)} style={btnOpcao(curso === c.id)}>
                    <span style={{ fontSize: 20 }}>{c.emoji}</span>
                    {c.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* PASSO 2 — Dificuldades (multiselect) */}
          {step === 1 && (
            <motion.div key="s1"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.22 }}
            >
              <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: '0 0 6px', lineHeight: 1.2 }}>
                Onde você trava?
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, margin: '0 0 6px' }}>
                Pode marcar mais de uma.
              </p>
              {dificuldades.length > 0 && (
                <p style={{ color: 'rgba(99,102,241,0.9)', fontSize: 13, margin: '0 0 20px' }}>
                  {dificuldades.length} selecionada{dificuldades.length > 1 ? 's' : ''}
                </p>
              )}
              {!dificuldades.length && (
                <div style={{ marginBottom: 20 }} />
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {DIFICULDADES.map(d => (
                  <div key={d.id}>
                    <button onClick={() => toggleDificuldade(d.id)} style={btnOpcao(dificuldades.includes(d.id))}>
                      <span style={{ fontSize: 20 }}>{d.emoji}</span>
                      <span style={{ flex: 1 }}>{d.label}</span>
                      {dificuldades.includes(d.id) && (
                        <span style={{ fontSize: 14, color: 'rgba(99,102,241,0.9)' }}>✓</span>
                      )}
                    </button>
                    {/* Campo de texto quando "Outro" está selecionado */}
                    {d.id === 'outro' && dificuldades.includes('outro') && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ marginTop: 8 }}
                      >
                        <input
                          type="text"
                          value={outroDificuldade}
                          onChange={e => setOutroDificuldade(e.target.value)}
                          placeholder="Qual dificuldade?"
                          maxLength={50}
                          autoFocus
                          style={{
                            width: '100%', padding: '12px 16px', borderRadius: 12,
                            border: '1.5px solid rgba(99,102,241,0.5)',
                            background: 'rgba(99,102,241,0.08)',
                            color: '#fff', fontSize: 15, outline: 'none',
                            boxSizing: 'border-box', fontFamily: 'inherit',
                          }}
                        />
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* PASSO 3 — Nome */}
          {step === 2 && (
            <motion.div key="s2"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.22 }}
            >
              <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: '0 0 8px', lineHeight: 1.2 }}>
                Como a Kira<br />te chama?
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 16, margin: '0 0 32px' }}>
                Pode ser apelido.
              </p>
              <input
                type="text"
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Seu nome ou apelido"
                maxLength={30}
                autoFocus
                style={{
                  width: '100%', padding: '16px 18px', borderRadius: 14,
                  border: '1.5px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#fff', fontSize: 18, outline: 'none',
                  boxSizing: 'border-box', fontFamily: 'inherit',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.8)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
              />
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, margin: '12px 0 0' }}>
                A Kira vai usar esse nome em todas as conversas.
              </p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Botões */}
      <div style={{ padding: '20px 0 48px', display: 'flex', gap: 10, flexShrink: 0 }}>
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} style={{
            padding: '16px 20px', borderRadius: 14,
            border: '1.5px solid rgba(255,255,255,0.1)',
            background: 'transparent', color: 'rgba(255,255,255,0.5)',
            fontSize: 18, cursor: 'pointer',
          }}>
            ←
          </button>
        )}
        {erro && <p role="alert" className="text-rose-300 text-sm mb-2">{erro}</p>}
        <button
          onClick={() => step < 2 ? setStep(s => s + 1) : finalizar()}
          disabled={!podeAvancar || loading}
          style={{
            flex: 1, padding: '16px', borderRadius: 14, border: 'none',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer',
            opacity: (!podeAvancar || loading) ? 0.35 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          {loading ? 'Salvando...' : step < 2 ? 'Continuar' : 'Começar'}
        </button>
      </div>
    </div>
  )
}