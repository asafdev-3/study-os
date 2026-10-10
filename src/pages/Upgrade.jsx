// Upgrade.jsx — tela de seleção de plano PRO
// Rota: /upgrade
// Animação: stagger hierárquico — header → hero → recursos (cascata) → planos → CTA

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Check, Zap } from 'lucide-react'

const PLANOS = [
  {
    id: 'anual',
    label: 'Anual',
    badge: '2 MESES GRÁTIS',
    preco: 'R$ 15,82',
    sub: '/mês · cobrado R$ 189,90/ano',
    destaque: true,
  },
  {
    id: 'mensal',
    label: 'Mensal',
    badge: null,
    preco: 'R$ 18,99',
    sub: '/mês · cancela quando quiser',
    destaque: false,
  },
]

const RECURSOS = [
  { emoji: '🧠', label: 'Kira sem limite de respostas' },
  { emoji: '📷', label: 'Fotos ilimitadas todo mês' },
  { emoji: '🗒️', label: 'Post-its infinitos' },
  { emoji: '📊', label: 'Histórico completo de estudos' },
  { emoji: '⚡', label: '7 dias grátis pra testar' },
]

// Variantes de animação reutilizáveis
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.38, ease: [0.25, 0.1, 0.25, 1], delay },
})

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.3, ease: 'easeOut', delay },
})

function Upgrade() {
  const [selecionado, setSelecionado] = useState('anual')
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000000',
      color: '#f4f4f5',
      paddingBottom: 48,
      maxWidth: 390,
      margin: '0 auto',
      overflowX: 'hidden',
    }}>

      {/* Header — entra primeiro */}
      <motion.div
        {...fadeUp(0)}
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '56px 20px 20px' }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 12,
            background: '#16161b',
            border: 'none',
            cursor: 'pointer',
            color: '#a1a1aa',
            flexShrink: 0,
          }}
        >
          <ArrowLeft size={16} color="#a1a1aa" />
        </button>
        <div>
          <p style={{
            fontSize: 10, letterSpacing: '0.2em', color: '#a1a1aa',
            textTransform: 'uppercase', marginBottom: 2, fontFamily: 'Geist, sans-serif',
          }}>
            StudyOS
          </p>
          <p style={{ fontSize: 15, fontWeight: 600, fontFamily: 'Geist, sans-serif', color: '#f4f4f5' }}>
            Plano PRO
          </p>
        </div>
      </motion.div>

      {/* Hero — entra logo depois */}
      <motion.div {...fadeUp(0.08)} style={{ padding: '0 20px 28px' }}>
        <div style={{
          borderRadius: 20,
          padding: 1,
          background: 'linear-gradient(135deg, #8B5CF6, #6366F1, #22D3A0)',
        }}>
          <div style={{
            background: '#0a0a0c',
            borderRadius: 19,
            padding: '20px',
          }}>
            <p style={{
              fontSize: 10, letterSpacing: '0.2em', color: '#a1a1aa',
              textTransform: 'uppercase', marginBottom: 12,
              display: 'flex', alignItems: 'center', gap: 8,
              fontFamily: 'Geist, sans-serif',
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: '#22D3A0', display: 'inline-block',
              }} />
              KIRA PRO
            </p>
            <p style={{
              fontSize: 20, fontWeight: 500, lineHeight: 1.35,
              marginBottom: 8, color: '#f4f4f5',
              fontFamily: 'Geist, sans-serif',
            }}>
              Kira sem freio.{' '}
              <em style={{ fontFamily: 'Instrument Serif, serif', fontWeight: 400 }}>
                Você no controle.
              </em>
            </p>
            <p style={{ fontSize: 13, color: '#a1a1aa', fontFamily: 'Geist, sans-serif' }}>
              7 dias grátis — cancela antes e não cobra nada.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Label recursos */}
      <motion.p
        {...fadeIn(0.16)}
        style={{
          fontSize: 10, letterSpacing: '0.2em', color: '#a1a1aa',
          textTransform: 'uppercase', padding: '0 20px',
          marginBottom: 14, fontFamily: 'Geist, sans-serif',
        }}
      >
        O que você ganha
      </motion.p>

      {/* Recursos — cascata com stagger */}
      <div style={{ padding: '0 20px', marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {RECURSOS.map(({ emoji, label }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: 0.2 + i * 0.06,
              duration: 0.32,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px',
              borderRadius: 14,
              background: 'transparent',
            }}
          >
            <div style={{
              width: 38, height: 38,
              borderRadius: 11,
              background: '#0d0d10',
              border: '1px solid #16161b',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 17, flexShrink: 0,
            }}>
              {emoji}
            </div>
            <span style={{ fontSize: 14, color: '#e4e4e7', fontFamily: 'Geist, sans-serif' }}>
              {label}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Divisor */}
      <motion.div
        {...fadeIn(0.52)}
        style={{ height: 1, background: '#16161b', margin: '0 20px 24px' }}
      />

      {/* Label planos */}
      <motion.p
        {...fadeIn(0.56)}
        style={{
          fontSize: 10, letterSpacing: '0.2em', color: '#a1a1aa',
          textTransform: 'uppercase', padding: '0 20px',
          marginBottom: 12, fontFamily: 'Geist, sans-serif',
        }}
      >
        Escolhe seu plano
      </motion.p>

      {/* Seletor de plano */}
      <div style={{ padding: '0 20px', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {PLANOS.map(({ id, label, badge, preco, sub, destaque }, i) => (
          <motion.div
            key={id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + i * 0.07, duration: 0.3, ease: 'easeOut' }}
          >
            <button
              onClick={() => setSelecionado(id)}
              style={{
                position: 'relative',
                width: '100%',
                textAlign: 'left',
                borderRadius: 18,
                padding: '14px 16px',
                background: selecionado === id ? 'rgba(139,92,246,0.1)' : '#0a0a0c',
                border: selecionado === id
                  ? '1px solid rgba(139,92,246,0.5)'
                  : '1px solid #16161b',
                cursor: 'pointer',
                transition: 'background 0.2s, border 0.2s',
              }}
            >
              {badge && (
                <span style={{
                  position: 'absolute', top: 12, right: 12,
                  fontSize: 9, fontWeight: 600, letterSpacing: '0.15em',
                  padding: '2px 8px', borderRadius: 999,
                  background: 'rgba(34,211,160,0.12)',
                  color: '#22D3A0',
                  fontFamily: 'Geist, sans-serif',
                }}>
                  {badge}
                </span>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  background: selecionado === id ? '#8B5CF6' : 'transparent',
                  border: selecionado === id ? 'none' : '1.5px solid #26262e',
                  transition: 'all 0.2s',
                }}>
                  {selecionado === id && <Check size={11} color="#ffffff" />}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontSize: 15, fontWeight: 600, color: '#f4f4f5',
                    fontFamily: 'Geist, sans-serif', marginBottom: 2,
                  }}>
                    {label}
                    {destaque && (
                      <span style={{ fontSize: 11, fontWeight: 400, color: '#8B5CF6', marginLeft: 6 }}>
                        · recomendado
                      </span>
                    )}
                  </p>
                  <p style={{ fontSize: 12, color: '#a1a1aa', fontFamily: 'Geist, sans-serif' }}>
                    {sub}
                  </p>
                </div>
                <p style={{
                  fontSize: 15, fontWeight: 600, color: '#f4f4f5',
                  fontFamily: 'Geist, sans-serif', flexShrink: 0,
                }}>
                  {preco}
                </p>
              </div>
            </button>
          </motion.div>
        ))}
      </div>

      {/* CTA — entra por último */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.76, duration: 0.35, ease: 'easeOut' }}
        style={{ padding: '0 20px' }}
      >
        <button
          onClick={() => navigate('/sucesso')}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8,
            padding: '15px 0',
            borderRadius: 18,
            background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'Geist, sans-serif',
            fontSize: 15, fontWeight: 600,
            color: '#ffffff',
            marginBottom: 12,
          }}
        >
          <Zap size={15} color="#ffffff" />
          {selecionado === 'anual' ? 'Começar 7 dias grátis' : 'Assinar mensalmente'}
        </button>

        <p style={{
          fontSize: 11, color: '#3f3f46',
          textAlign: 'center',
          fontFamily: 'Geist, sans-serif',
        }}>
          Cancela quando quiser · sem pegadinha
        </p>
      </motion.div>

    </div>
  )
}

export default Upgrade