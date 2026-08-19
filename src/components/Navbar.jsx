import { useLocation, useNavigate } from 'react-router-dom'
import { Home, FileText, MessageCircle, StickyNote, User, Settings } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const itensBase = [
  { label: 'Início',   icon: Home,          rota: '/dashboard' },
  { label: 'Notas',    icon: FileText,       rota: '/anotacoes' },
  { label: 'Kira',     icon: MessageCircle,  rota: '/chat'      },
  { label: 'Post-its', icon: StickyNote,     rota: '/lembretes' },
  { label: 'Perfil',   icon: User,           rota: '/perfil'    },
]

const itemConfig = { label: 'Config', icon: Settings, rota: '/configuracoes' }

function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()

  const emConfig = location.pathname === '/configuracoes'
  const itens = emConfig ? [...itensBase, itemConfig] : itensBase

  // Não mostra navbar em splash/login/lock
  if (['/', '/login', '/lock'].includes(location.pathname)) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-sm mx-auto px-4 pb-6 pt-0 z-50">
      <div
        className="flex justify-around items-center px-4 pt-3 pb-3"
        style={{
          background: 'rgba(12, 12, 14, 0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '24px',
        }}
      >
        {itens.map(({ label, icon: Icon, rota }) => {
          const ativo = location.pathname === rota
          return (
            <motion.button
              key={rota}
              onClick={() => navigate(rota)}
              className="relative flex flex-col items-center gap-1 px-3 py-1"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              <AnimatePresence>
                {ativo && (
                  <motion.div
                    layoutId="navbar-pill"
                    className="absolute inset-0 rounded-2xl"
                    style={{ background: 'rgba(255,255,255,0.08)' }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </AnimatePresence>
              <Icon size={22} className={`relative z-10 transition-colors duration-200 ${ativo ? 'text-white' : 'text-zinc-600'}`} />
              <span className={`relative z-10 text-[10px] transition-colors duration-200 ${ativo ? 'text-white' : 'text-zinc-600'}`}>
                {label}
              </span>
            </motion.button>
          )
        })}
      </div>
    </nav>
  )
}

export default Navbar