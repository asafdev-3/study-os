import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Wifi,
  Check,
  X,
  ExternalLink,
  Smartphone,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const LANDING_PAGE_URL = 'https://studyos.app'

const TAGS = {
  1: {
    destino: '/anotacoes',
    label: 'Anotações',
    descricao: 'Abrir suas notas',
  },
  2: {
    destino: '/lembretes',
    label: 'Lembretes',
    descricao: 'Ver lembretes do dia',
  },
  3: {
    destino: '/dashboard',
    label: 'StudyOS',
    descricao: 'Abrir página do app',
  },
}

// =========================================================
// IDENTIDADE VISUAL STUDYOS
// =========================================================

const PURPLE = '#8B5CF6'
const INDIGO = '#6366F1'
const GREEN = '#22D3A0'

const appleEase = [0.22, 1, 0.36, 1]

const appleSpring = {
  type: 'spring',
  stiffness: 170,
  damping: 25,
  mass: 0.82,
}

const softSpring = {
  type: 'spring',
  stiffness: 125,
  damping: 22,
  mass: 0.85,
}

// =========================================================
// DEMO NFC
// =========================================================

function simularLeitura() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const sucesso = Math.random() > 0.2

      if (sucesso) {
        resolve(Math.ceil(Math.random() * 3))
      } else {
        reject()
      }
    }, 2200)
  })
}

// =========================================================
// COMPONENTE
// =========================================================

function NFC() {
  const navigate = useNavigate()

  const [estado, setEstado] = useState('idle')
  const [tagLida, setTagLida] = useState(null)
  const [mostrarAfiliado, setMostrarAfiliado] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)

  // =======================================================
  // REDUCED MOTION
  // =======================================================

  useEffect(() => {
    const media = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    )

    const update = () => {
      setReduceMotion(media.matches)
    }

    update()

    media.addEventListener?.('change', update)

    return () => {
      media.removeEventListener?.('change', update)
    }
  }, [])

  // =======================================================
  // LEITURA
  // =======================================================

  useEffect(() => {
    if (estado !== 'lendo') return

    simularLeitura()
      .then(tag => {
        setTagLida(tag)
        setEstado('sucesso')

        setTimeout(() => {
          setMostrarAfiliado(true)
        }, 520)
      })
      .catch(() => {
        setEstado('erro')
      })
  }, [estado])

  // =======================================================
  // AÇÕES
  // =======================================================

  function iniciarLeitura() {
    setMostrarAfiliado(false)
    setTagLida(null)
    setEstado('lendo')
  }

  function resetar() {
    setMostrarAfiliado(false)
    setTagLida(null)
    setEstado('idle')
  }

  function continuar() {
    if (!tagLida) return

    const tag = TAGS[tagLida]

    if (tag.externo) {
      window.open(
        LANDING_PAGE_URL,
        '_blank',
        'noopener,noreferrer'
      )
      return
    }

    navigate(tag.destino)
  }

  // =======================================================
  // TRANSIÇÕES
  // =======================================================

  const fadeTransition = reduceMotion
    ? { duration: 0 }
    : {
        duration: 0.42,
        ease: appleEase,
      }

  return (
    <div
      className="
        relative
        flex
        min-h-[100svh]
        max-w-sm
        mx-auto
        flex-col
        overflow-hidden
        bg-black
        text-white
      "
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >

      {/* ===================================================
          BACKGROUND
      =================================================== */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        <motion.div
          animate={
            reduceMotion
              ? {}
              : {
                  opacity: [0.06, 0.10, 0.06],
                  scale: [1, 1.08, 1],
                }
          }
          transition={
            reduceMotion
              ? {}
              : {
                  duration: 8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }
          }
          className="
            absolute
            left-1/2
            top-[-100px]
            h-[300px]
            w-[300px]
            -translate-x-1/2
            rounded-full
            blur-[120px]
          "
          style={{
            background: PURPLE,
          }}
        />

        <motion.div
          animate={
            reduceMotion
              ? {}
              : {
                  opacity: [0.025, 0.05, 0.025],
                  x: [0, 14, 0],
                }
          }
          transition={
            reduceMotion
              ? {}
              : {
                  duration: 10,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }
          }
          className="
            absolute
            bottom-[-100px]
            right-[-100px]
            h-[240px]
            w-[240px]
            rounded-full
            blur-[120px]
          "
          style={{
            background: GREEN,
          }}
        />

      </div>

      {/* ===================================================
          HEADER
      =================================================== */}

      <motion.header
        initial={
          reduceMotion
            ? false
            : {
                opacity: 0,
                y: -8,
              }
        }
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : {
                duration: 0.55,
                ease: appleEase,
              }
        }
        className="
          relative
          z-20
          flex
          items-center
          px-5
          pt-5
          pb-3
        "
      >

        <motion.button
          onClick={() => navigate('/dashboard')}
          whileTap={
            reduceMotion
              ? {}
              : {
                  scale: 0.9,
                }
          }
          transition={softSpring}
          className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-full
            text-zinc-500
            transition-colors
            hover:text-white
          "
          aria-label="Voltar"
        >
          <ArrowLeft
            size={19}
            strokeWidth={1.8}
          />
        </motion.button>

        <div className="flex-1 text-center">
          <p
            className="
              text-[11px]
              font-medium
              uppercase
              tracking-[0.22em]
              text-zinc-400
            "
            style={{
              fontFamily: 'Geist, sans-serif',
            }}
          >
            NFC
          </p>
        </div>

        <div className="w-10" />
      </motion.header>

      {/* ===================================================
          CONTEÚDO
      =================================================== */}

      <main
        className="
          relative
          z-10
          flex
          flex-1
          flex-col
          items-center
          justify-center
          gap-9
          px-6
          pb-20
        "
      >

        {/* =================================================
            LEITOR FACE ID
        ================================================= */}

        <motion.div
          initial={
            reduceMotion
              ? false
              : {
                  opacity: 0,
                  scale: 0.94,
                }
          }
          animate={{
            opacity: 1,
            scale: 1,
          }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : {
                  duration: 0.7,
                  ease: appleEase,
                }
          }
          className="
            relative
            flex
            h-[240px]
            w-[240px]
            items-center
            justify-center
          "
        >

          {/* ===============================================
              CÍRCULO BASE
          =============================================== */}

          <svg
            viewBox="0 0 240 240"
            className="
              absolute
              inset-0
              h-full
              w-full
            "
          >
            <circle
              cx="120"
              cy="120"
              r="88"
              fill="none"
              stroke="rgba(139,92,246,0.10)"
              strokeWidth="1"
            />

            {Array.from({ length: 24 }).map((_, i) => {
              const angle = i * 15
              const radians =
                (angle * Math.PI) / 180

              const outer = 99
              const inner =
                i % 2 === 0
                  ? 92
                  : 95

              const x1 =
                120 +
                Math.cos(radians) * inner

              const y1 =
                120 +
                Math.sin(radians) * inner

              const x2 =
                120 +
                Math.cos(radians) * outer

              const y2 =
                120 +
                Math.sin(radians) * outer

              return (
                <motion.line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={
                    estado === 'sucesso'
                      ? GREEN
                      : estado === 'erro'
                      ? '#EF4444'
                      : PURPLE
                  }
                  strokeWidth={
                    i % 2 === 0
                      ? 1.5
                      : 1
                  }
                  strokeLinecap="round"
                  animate={
                    estado === 'lendo' &&
                    !reduceMotion
                      ? {
                          opacity:
                            i % 4 === 0
                              ? [0.12, 0.9, 0.12]
                              : 0.16,
                        }
                      : {
                          opacity:
                            estado === 'sucesso'
                              ? 0.72
                              : estado === 'erro'
                              ? 0.5
                              : 0.16,
                        }
                  }
                  transition={
                    estado === 'lendo' &&
                    !reduceMotion
                      ? {
                          duration: 1.7,
                          delay: i * 0.035,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }
                      : {
                          duration: 0.4,
                          ease: appleEase,
                        }
                  }
                />
              )
            })}
          </svg>

          {/* ===============================================
              ARCO DE SCAN
          =============================================== */}

          <AnimatePresence>
            {estado === 'lendo' && (
              <motion.svg
                viewBox="0 0 240 240"
                className="
                  absolute
                  inset-0
                  h-full
                  w-full
                "
                initial={{
                  opacity: 0,
                  scale: 0.97,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  scale: 1.02,
                }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : {
                        duration: 0.4,
                        ease: appleEase,
                      }
                }
              >
                <motion.circle
                  cx="120"
                  cy="120"
                  r="88"
                  fill="none"
                  stroke={PURPLE}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="58 495"
                  animate={
                    reduceMotion
                      ? {}
                      : {
                          rotate: 360,
                        }
                  }
                  transition={
                    reduceMotion
                      ? {}
                      : {
                          duration: 2.4,
                          repeat: Infinity,
                          ease: 'linear',
                        }
                  }
                  style={{
                    transformOrigin:
                      '120px 120px',
                  }}
                />

                <motion.circle
                  cx="120"
                  cy="120"
                  r="88"
                  fill="none"
                  stroke="rgba(139,92,246,0.12)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray="58 495"
                  animate={
                    reduceMotion
                      ? {}
                      : {
                          rotate: 360,
                        }
                  }
                  transition={
                    reduceMotion
                      ? {}
                      : {
                          duration: 2.4,
                          repeat: Infinity,
                          ease: 'linear',
                        }
                  }
                  style={{
                    transformOrigin:
                      '120px 120px',
                  }}
                />
              </motion.svg>
            )}
          </AnimatePresence>

          {/* ===============================================
              CENTRO
          =============================================== */}

          <motion.div
            animate={{
              scale:
                estado === 'lendo' &&
                !reduceMotion
                  ? [1, 1.018, 1]
                  : 1,

              boxShadow:
                estado === 'lendo'
                  ? [
                      '0 0 0 rgba(139,92,246,0)',
                      '0 0 36px rgba(139,92,246,0.28)',
                      '0 0 0 rgba(139,92,246,0)',
                    ]
                  : estado === 'sucesso'
                  ? '0 0 32px rgba(34,211,160,0.20)'
                  : estado === 'erro'
                  ? '0 0 28px rgba(239,68,68,0.16)'
                  : '0 0 20px rgba(139,92,246,0.08)',
            }}
            transition={
              estado === 'lendo' &&
              !reduceMotion
                ? {
                    duration: 2.3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }
                : {
                    duration: 0.55,
                    ease: appleEase,
                  }
            }
            className="
              relative
              z-10
              flex
              h-[82px]
              w-[82px]
              items-center
              justify-center
              overflow-hidden
              rounded-full
              border
              border-white/[0.08]
              bg-[#0A0A0C]
            "
          >

            <div
              className="
                absolute
                inset-0
                rounded-full
                opacity-60
              "
              style={{
                background:
                  'linear-gradient(135deg, rgba(139,92,246,0.16), rgba(99,102,241,0.05))',
              }}
            />

            <AnimatePresence mode="wait">

              {estado === 'idle' && (
                <motion.div
                  key="idle"
                  initial={{
                    opacity: 0,
                    scale: 0.75,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.8,
                  }}
                  transition={appleSpring}
                  className="relative z-10"
                >
                  <Wifi
                    size={28}
                    strokeWidth={1.65}
                    className="text-white/90"
                    style={{
                      transform:
                        'rotate(90deg)',
                    }}
                  />
                </motion.div>
              )}

              {estado === 'lendo' && (
                <motion.div
                  key="reading"
                  initial={{
                    opacity: 0,
                    scale: 0.75,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.8,
                  }}
                  transition={appleSpring}
                  className="
                    relative
                    z-10
                    flex
                    items-center
                    justify-center
                  "
                >
                  <motion.div
                    animate={
                      reduceMotion
                        ? {}
                        : {
                            rotate: [
                              0,
                              5,
                              0,
                              -5,
                              0,
                            ],
                          }
                    }
                    transition={
                      reduceMotion
                        ? {}
                        : {
                            duration: 1.8,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }
                    }
                  >
                    <Smartphone
                      size={27}
                      strokeWidth={1.6}
                      className="text-white/90"
                    />
                  </motion.div>
                </motion.div>
              )}

              {estado === 'sucesso' && (
                <motion.div
                  key="success"
                  initial={{
                    opacity: 0,
                    scale: 0.45,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                  transition={appleSpring}
                  className="relative z-10"
                >
                  <Check
                    size={31}
                    strokeWidth={2.2}
                    className="text-[#22D3A0]"
                  />
                </motion.div>
              )}

              {estado === 'erro' && (
                <motion.div
                  key="error"
                  initial={{
                    opacity: 0,
                    scale: 0.45,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                  transition={appleSpring}
                  className="relative z-10"
                >
                  <X
                    size={31}
                    strokeWidth={2.1}
                    className="text-red-300"
                  />
                </motion.div>
              )}

            </AnimatePresence>
          </motion.div>

          {/* ===============================================
              PONTOS DE SCAN
          =============================================== */}

          {estado === 'lendo' &&
            [0, 1, 2, 3].map(i => (
              <motion.div
                key={i}
                className="
                  absolute
                  h-1
                  w-1
                  rounded-full
                "
                style={{
                  background: PURPLE,

                  top:
                    i === 0
                      ? 26
                      : i === 1
                      ? 106
                      : i === 2
                      ? 202
                      : 106,

                  left:
                    i === 0
                      ? 119
                      : i === 1
                      ? 202
                      : i === 2
                      ? 119
                      : 26,
                }}
                animate={
                  reduceMotion
                    ? {}
                    : {
                        opacity: [
                          0.15,
                          0.85,
                          0.15,
                        ],
                        scale: [
                          0.8,
                          1.5,
                          0.8,
                        ],
                      }
                }
                transition={
                  reduceMotion
                    ? {}
                    : {
                        duration: 1.5,
                        delay: i * 0.2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }
                }
              />
            ))}
        </motion.div>

        {/* =================================================
            TEXTO
        ================================================= */}

        <AnimatePresence mode="wait">
          <motion.div
            key={estado}
            initial={
              reduceMotion
                ? false
                : {
                    opacity: 0,
                    y: 7,
                    filter: 'blur(3px)',
                  }
            }
            animate={{
              opacity: 1,
              y: 0,
              filter: 'blur(0px)',
            }}
            exit={
              reduceMotion
                ? undefined
                : {
                    opacity: 0,
                    y: -5,
                    filter: 'blur(2px)',
                  }
            }
            transition={fadeTransition}
            className="
              max-w-[285px]
              text-center
            "
          >
            {estado === 'idle' && (
              <>
                <h2 className="
                  text-[21px]
                  font-semibold
                  tracking-[-0.02em]
                  text-white
                ">
                  Aproxime a tag
                </h2>

                <p className="
                  mt-2
                  text-sm
                  leading-relaxed
                  text-zinc-500
                ">
                  Encoste uma tag NFC no celular para ativar uma função do StudyOS.
                </p>
              </>
            )}

            {estado === 'lendo' && (
              <>
                <h2 className="
                  text-[21px]
                  font-semibold
                  tracking-[-0.02em]
                  text-white
                ">
                  Segure próximo
                </h2>

                <p className="
                  mt-2
                  text-sm
                  text-zinc-500
                ">
                  Procurando a tag NFC...
                </p>
              </>
            )}

            {estado === 'sucesso' && tagLida && (
              <>
                <h2 className="
                  text-[21px]
                  font-semibold
                  tracking-[-0.02em]
                  text-white
                ">
                  Tag reconhecida
                </h2>

                <p className="
                  mt-2
                  text-sm
                  text-zinc-500
                ">
                  {TAGS[tagLida].label}
                </p>
              </>
            )}

            {estado === 'erro' && (
              <>
                <h2 className="
                  text-[21px]
                  font-semibold
                  tracking-[-0.02em]
                  text-white
                ">
                  Tag não encontrada
                </h2>

                <p className="
                  mt-2
                  text-sm
                  text-zinc-500
                ">
                  Tente aproximar novamente.
                </p>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* =================================================
            BOTÕES
        ================================================= */}

        <div className="w-full">

          <AnimatePresence mode="wait">

            {estado === 'idle' && (
              <motion.button
                key="start"
                initial={{
                  opacity: 0,
                  y: 7,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: -5,
                }}
                transition={{
                  duration: 0.42,
                  ease: appleEase,
                }}
                whileTap={
                  reduceMotion
                    ? {}
                    : {
                        scale: 0.985,
                      }
                }
                onClick={iniciarLeitura}
                className="
                  relative
                  w-full
                  overflow-hidden
                  rounded-[19px]
                  border
                  border-white/[0.08]
                  py-4
                  text-sm
                  font-medium
                  text-white
                "
                style={{
                  background: `
                    linear-gradient(
                      135deg,
                      ${PURPLE},
                      ${INDIGO},
                      ${GREEN}
                    )
                  `,
                }}
              >
                <span className="relative z-10">
                  Iniciar leitura
                </span>
              </motion.button>
            )}

            {estado === 'sucesso' && (
              <motion.div
                key="success-actions"
                initial={{
                  opacity: 0,
                  y: 8,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.45,
                  ease: appleEase,
                }}
                className="
                  flex
                  flex-col
                  gap-2
                "
              >
                <motion.button
                  whileTap={
                    reduceMotion
                      ? {}
                      : {
                          scale: 0.985,
                        }
                  }
                  onClick={continuar}
                  className="
                    w-full
                    rounded-[19px]
                    border
                    border-white/[0.08]
                    py-4
                    text-sm
                    font-medium
                    text-white
                  "
                  style={{
                    background: `
                      linear-gradient(
                        135deg,
                        ${PURPLE},
                        ${INDIGO},
                        ${GREEN}
                      )
                    `,
                  }}
                >
                  <span className="
                    flex
                    items-center
                    justify-center
                    gap-2
                  ">
                    {TAGS[tagLida]?.externo && (
                      <ExternalLink size={15} />
                    )}

                    Abrir {TAGS[tagLida]?.label}
                  </span>
                </motion.button>

                <motion.button
                  whileTap={
                    reduceMotion
                      ? {}
                      : {
                          scale: 0.985,
                        }
                  }
                  onClick={resetar}
                  className="
                    w-full
                    py-3
                    text-sm
                    text-zinc-500
                  "
                >
                  Ler outra tag
                </motion.button>
              </motion.div>
            )}

            {estado === 'erro' && (
              <motion.button
                key="retry"
                initial={{
                  opacity: 0,
                  y: 8,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.42,
                  ease: appleEase,
                }}
                whileTap={
                  reduceMotion
                    ? {}
                    : {
                        scale: 0.985,
                      }
                }
                onClick={resetar}
                className="
                  w-full
                  rounded-[19px]
                  border
                  border-white/[0.08]
                  py-4
                  text-sm
                  font-medium
                  text-white
                "
                style={{
                  background: `
                    linear-gradient(
                      135deg,
                      ${PURPLE},
                      ${INDIGO},
                      ${GREEN}
                    )
                  `,
                }}
              >
                Tentar novamente
              </motion.button>
            )}

          </AnimatePresence>
        </div>

        {/* =================================================
            TAGS CONFIGURADAS
        ================================================= */}

        {estado === 'idle' && (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              duration: 0.35,
              delay: 0.08,
              ease: appleEase,
            }}
            className="w-full"
          >

            <p className="
              mb-3
              text-center
              text-[10px]
              font-medium
              tracking-[0.2em]
              text-zinc-600
            ">
              TAGS CONFIGURADAS
            </p>

            <div className="
              flex
              flex-col
              gap-2
            ">

              {Object.entries(TAGS).map(
                ([num, tag], index) => (
                  <motion.div
                    key={num}

                    initial={
                      reduceMotion
                        ? false
                        : {
                            opacity: 0,
                            y: 10,
                            scale: 0.985,
                          }
                    }

                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                    }}

                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : {
                            duration: 0.48,
                            delay:
                              0.16 +
                              index * 0.085,
                            ease: appleEase,
                          }
                    }

                    whileHover={
                      reduceMotion
                        ? {}
                        : {
                            y: -1,
                            scale: 1.006,
                          }
                    }

                    whileTap={
                      reduceMotion
                        ? {}
                        : {
                            scale: 0.992,
                          }
                    }

                    className="
                      group
                      relative
                      flex
                      items-center
                      gap-3
                      overflow-hidden
                      rounded-[18px]
                      border
                      border-zinc-900
                      px-3.5
                      py-3
                    "
                    style={{
                      background: '#0A0A0C',
                    }}
                  >

                    <motion.div
                      className="
                        pointer-events-none
                        absolute
                        inset-0
                        opacity-0
                      "
                      whileHover={{
                        opacity: 1,
                      }}
                      transition={{
                        duration: 0.3,
                      }}
                      style={{
                        background: `
                          linear-gradient(
                            120deg,
                            rgba(139,92,246,0.045),
                            transparent 55%
                          )
                        `,
                      }}
                    />

                    <div
                      className="
                        relative
                        z-10
                        flex
                        h-9
                        w-9
                        flex-shrink-0
                        items-center
                        justify-center
                        rounded-[11px]
                        text-xs
                        font-medium
                      "
                      style={{
                        background: `
                          linear-gradient(
                            135deg,
                            rgba(139,92,246,0.12),
                            rgba(34,211,160,0.05)
                          )
                        `,
                        color: PURPLE,
                      }}
                    >
                      {num}
                    </div>

                    <div className="
                      relative
                      z-10
                      min-w-0
                    ">
                      <p className="
                        text-sm
                        text-white
                      ">
                        {tag.label}
                      </p>

                      <p className="
                        mt-0.5
                        text-xs
                        text-zinc-600
                      ">
                        {tag.descricao}
                      </p>
                    </div>

                    {tag.externo && (
                      <ExternalLink
                        size={13}
                        strokeWidth={1.7}
                        className="
                          relative
                          z-10
                          ml-auto
                          text-zinc-700
                          transition-colors
                          group-hover:text-zinc-500
                        "
                      />
                    )}

                  </motion.div>
                )
              )}

            </div>
          </motion.div>
        )}

      </main>

      {/* ===================================================
          MODAL CENTRAL
      =================================================== */}

      <AnimatePresence>
        {mostrarAfiliado && (
          <motion.div
            className="
              fixed
              inset-0
              z-50
              flex
              items-center
              justify-center
              px-5
            "
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : {
                    duration: 0.42,
                    ease: appleEase,
                  }
            }
            style={{
              background:
                'rgba(0,0,0,0.58)',
              backdropFilter:
                'blur(16px)',
              WebkitBackdropFilter:
                'blur(16px)',
            }}
            onClick={() =>
              setMostrarAfiliado(false)
            }
          >

            <motion.div
              initial={
                reduceMotion
                  ? false
                  : {
                      opacity: 0,
                      scale: 0.94,
                      y: 8,
                      filter: 'blur(8px)',
                    }
              }
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
                filter: 'blur(0px)',
              }}
              exit={
                reduceMotion
                  ? undefined
                  : {
                      opacity: 0,
                      scale: 0.96,
                      y: 4,
                      filter: 'blur(5px)',
                    }
              }
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : {
                      type: 'spring',
                      stiffness: 150,
                      damping: 24,
                      mass: 0.8,
                    }
              }
              className="
                relative
                w-full
                max-w-[340px]
                overflow-hidden
                rounded-[28px]
                border
                border-white/[0.08]
                bg-[#0A0A0C]/95
                px-5
                pb-5
                pt-4
              "
              style={{
                boxShadow: `
                  0 30px 80px rgba(0,0,0,0.55),
                  0 0 0 1px rgba(139,92,246,0.025)
                `,
                backdropFilter:
                  'blur(30px)',
                WebkitBackdropFilter:
                  'blur(30px)',
              }}
              onClick={e =>
                e.stopPropagation()
              }
            >

              {/* =========================================
                  BRILHO SUPERIOR
              ========================================= */}

              <motion.div
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                transition={{
                  duration: 0.8,
                  delay: 0.05,
                  ease: appleEase,
                }}
                className="
                  pointer-events-none
                  absolute
                  inset-x-0
                  top-0
                  h-32
                "
                style={{
                  background: `
                    radial-gradient(
                      ellipse at top,
                      rgba(139,92,246,0.10),
                      transparent 68%
                    )
                  `,
                }}
              />

              {/* =========================================
                  ÍCONE
              ========================================= */}

              <motion.div
                initial={
                  reduceMotion
                    ? false
                    : {
                        opacity: 0,
                        scale: 0.7,
                      }
                }
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : {
                        ...appleSpring,
                        delay: 0.05,
                      }
                }
                className="
                  relative
                  mx-auto
                  mb-4
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-violet-400/10
                  bg-violet-500/[0.08]
                "
              >
                <motion.div
                  animate={
                    reduceMotion
                      ? {}
                      : {
                          opacity: [0.5, 1, 0.5],
                          scale: [0.9, 1, 0.9],
                        }
                  }
                  transition={
                    reduceMotion
                      ? {}
                      : {
                          duration: 2.2,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }
                  }
                  className="
                    h-1.5
                    w-1.5
                    rounded-full
                  "
                  style={{
                    background: GREEN,
                    boxShadow:
                      `0 0 12px ${GREEN}`,
                  }}
                />
              </motion.div>

              {/* =========================================
                  CONTEÚDO
              ========================================= */}

              <motion.div
                initial={
                  reduceMotion
                    ? false
                    : {
                        opacity: 0,
                        y: 6,
                      }
                }
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : {
                        duration: 0.42,
                        delay: 0.10,
                        ease: appleEase,
                      }
                }
                className="
                  relative
                  z-10
                  text-center
                "
              >

                <p className="
                  text-[10px]
                  font-medium
                  uppercase
                  tracking-[0.18em]
                  text-zinc-600
                ">
                  ✦ DICA DA KIRA
                </p>

                <h3 className="
                  mt-2
                  text-xl
                  font-semibold
                  tracking-[-0.025em]
                  text-white
                ">
                  Quer suas próprias tags?
                </h3>

                <p
                  className="
                    mt-2
                    text-sm
                    leading-relaxed
                    text-zinc-400
                  "
                  style={{
                    fontFamily:
                      'Instrument Serif, serif',
                    fontStyle: 'italic',
                  }}
                >
                  "Tags NFC custam menos de R$2 cada. Com elas você ativa o StudyOS sem abrir o app."
                </p>

              </motion.div>

              {/* =========================================
                  AÇÕES
              ========================================= */}

              <motion.div
                initial={
                  reduceMotion
                    ? false
                    : {
                        opacity: 0,
                        y: 8,
                      }
                }
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : {
                        duration: 0.42,
                        delay: 0.16,
                        ease: appleEase,
                      }
                }
                className="
                  relative
                  z-10
                  mt-6
                  flex
                  flex-col
                  gap-1
                "
              >

                <motion.a
                  whileTap={
                    reduceMotion
                      ? {}
                      : {
                          scale: 0.985,
                        }
                  }
                  href="https://s.shopee.com.br/AUtdpS7L2a"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    flex
                    w-full
                    items-center
                    justify-center
                    gap-2
                    rounded-[17px]
                    py-3.5
                    text-sm
                    font-medium
                    text-white
                  "
                  style={{
                    background: `
                      linear-gradient(
                        135deg,
                        ${PURPLE},
                        ${INDIGO},
                        ${GREEN}
                      )
                    `,
                  }}
                >
                  <ExternalLink
                    size={14}
                    strokeWidth={1.8}
                  />

                  Ver no Shopee
                </motion.a>

                <motion.button
                  whileTap={
                    reduceMotion
                      ? {}
                      : {
                          scale: 0.985,
                        }
                  }
                  onClick={() =>
                    setMostrarAfiliado(false)
                  }
                  className="
                    w-full
                    py-3
                    text-sm
                    text-zinc-500
                  "
                >
                  Agora não
                </motion.button>

              </motion.div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}

export default NFC