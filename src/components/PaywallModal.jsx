// PaywallModal.jsx — modal de limite atingido
// Uso: <PaywallModal tipo="ia" onClose={fn} onVerPlanos={fn} />
// tipos: 'ia' | 'ocr' | 'postit' | 'generico'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Zap } from 'lucide-react'
import kiraImg from "../assets/kira.png"

const COPYS = {
  ia: {
    titulo: 'Kira precisa respirar',
    corpo: 'Ela deu o máximo hoje — respondeu mais do que o plano grátis permite. Volta amanhã ou deixa ela sem teto com o PRO.',
    cta: 'Turbinar a Kira',
    sub: 'Ela descansa até amanhã',
  },

  ocr: {
    titulo: 'A câmera da Kira travou',
    corpo: 'Você capturou tanto esse mês que ela pediu férias. Com o PRO, ela digitaliza caderno amassado, letra ilegível — sem drama.',
    cta: 'Desbloquear câmera',
    sub: 'Aguarda o próximo mês',
  },

  postit: {
    titulo: 'Sua cabeça tá transbordando',
    corpo: 'Mais ideias do que a Kira consegue segurar. Ela pediu mais espaço — o PRO dá isso sem contar.',
    cta: 'Abrir mais espaço',
    sub: 'Remove um post-it pra continuar',
  },

  generico: {
    titulo: 'Você foi longe no grátis',
    corpo: 'Chegou no teto do plano. Isso quer dizer que você tá usando de verdade — faz sentido ir além.',
    cta: 'Ver o que o PRO libera',
    sub: 'Continua com o que tem',
  },
}

const BENEFICIOS = [
  'Kira sem limite de respostas',
  'OCR ilimitado todo mês',
  'Post-its infinitos',
  'Histórico completo de estudos',
]

function PaywallModal({ tipo = 'generico', onClose, onVerPlanos }) {
  const copy = COPYS[tipo] ?? COPYS.generico

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
        onClick={onClose}
      >

        {/* CONTAINER */}
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 380,
            damping: 34,
          }}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '390px',
            margin: '0 16px 24px',
            borderRadius: '28px',
            overflow: 'visible',
            background: '#0a0a0c',
            border: '1px solid #16161b',
          }}
        >

          {/* =====================================================
              KIRA
              Atrás do modal — surge de dentro dele
          ====================================================== */}

          <motion.div
            initial={{
              y: 55,
              opacity: 0,
              scale: 0.82,
            }}
            animate={{
              y: 0,
              opacity: 1,
              scale: 1,
            }}
            exit={{
              y: 35,
              opacity: 0,
              scale: 0.9,
            }}
            transition={{
              duration: 0.65,
              delay: 0.08,
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{
              position: 'absolute',

              /*
               * A Kira fica parcialmente para fora do modal.
               * Como o modal tem z-index maior, a parte inferior
               * dela fica escondida atrás do card.
               */
              top: -66,
              left: '50%',
              transform: 'translateX(-50%)',

              width: 125,
              height: 115,

              zIndex: 0,

              pointerEvents: 'none',

              filter:
                'drop-shadow(0 0 18px rgba(99,102,241,0.55)) drop-shadow(0 0 8px rgba(34,211,160,0.25))',
            }}
          >
            <img
              src={kiraImg}
              alt="Kira"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          </motion.div>

          {/* =====================================================
              MODAL
          ====================================================== */}

          <div
            style={{
              position: 'relative',
              zIndex: 2,
              borderRadius: '28px',
              background: '#0a0a0c',
              overflow: 'hidden',
            }}
          >

            {/* Linha gradiente topo */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '1px',
                borderRadius: '28px 28px 0 0',
                background:
                  'linear-gradient(90deg, #8B5CF6, #6366F1, #22D3A0)',
              }}
            />

            {/* Fechar */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                background: '#16161b',
                border: 'none',
                cursor: 'pointer',
                color: '#a1a1aa',
                zIndex: 5,
              }}
            >
              <X size={14} />
            </button>

            <div
              style={{
                padding: '64px 24px 28px',
              }}
            >

              {/* Título */}
              <h2
                style={{
                  fontFamily: 'Geist, sans-serif',
                  fontSize: 22,
                  fontWeight: 600,
                  color: '#f4f4f5',
                  marginBottom: 8,
                  lineHeight: 1.3,
                }}
              >
                {copy.titulo}
              </h2>

              {/* Corpo */}
              <p
                style={{
                  fontFamily: 'Geist, sans-serif',
                  fontSize: 15,
                  color: '#a1a1aa',
                  lineHeight: 1.6,
                  marginBottom: 24,
                }}
              >
                {copy.corpo}
              </p>

              {/* Benefícios */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  marginBottom: 24,
                }}
              >
                {BENEFICIOS.map((item) => (
                  <div
                    key={item}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: 'rgba(34,211,160,0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontSize: 10,
                        color: '#22D3A0',
                        fontWeight: 700,
                      }}
                    >
                      ✓
                    </div>

                    <span
                      style={{
                        fontFamily: 'Geist, sans-serif',
                        fontSize: 14,
                        color: '#e4e4e7',
                      }}
                    >
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              {/* Card preço */}
              <div
                style={{
                  borderRadius: 16,
                  padding: '12px 16px',
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(139,92,246,0.08)',
                  border: '1px solid rgba(139,92,246,0.2)',
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: 11,
                      color: '#a1a1aa',
                      marginBottom: 2,
                      letterSpacing: '0.05em',
                      fontFamily: 'Geist, sans-serif',
                    }}
                  >
                    PRO · anual
                  </p>

                  <p
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: '#f4f4f5',
                      fontFamily: 'Geist, sans-serif',
                    }}
                  >
                    R$ 15,82

                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 400,
                        color: '#a1a1aa',
                      }}
                    >
                      {' '}
                      /mês
                    </span>
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: '0.15em',
                      color: '#22D3A0',
                      marginBottom: 2,
                      fontFamily: 'Geist, sans-serif',
                    }}
                  >
                    2 MESES GRÁTIS
                  </p>

                  <p
                    style={{
                      fontSize: 12,
                      color: '#a1a1aa',
                      fontFamily: 'Geist, sans-serif',
                    }}
                  >
                    R$ 189,90/ano
                  </p>
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={onVerPlanos}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '15px 0',
                  borderRadius: 18,
                  background:
                    'linear-gradient(135deg, #8B5CF6, #6366F1)',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'Geist, sans-serif',
                  fontSize: 15,
                  fontWeight: 600,
                  color: '#ffffff',
                  marginBottom: 12,
                }}
              >
                <Zap size={15} color="#ffffff" />
                {copy.cta}
              </button>

              {/* Secundário */}
              <button
                onClick={onClose}
                style={{
                  width: '100%',
                  textAlign: 'center',
                  padding: '8px 0',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'Geist, sans-serif',
                  fontSize: 13,
                  color: '#a1a1aa',
                }}
              >
                {copy.sub}
              </button>

            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default PaywallModal