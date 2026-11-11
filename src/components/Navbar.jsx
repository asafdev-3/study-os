import { useLocation, useNavigate } from 'react-router-dom'
import { Home, FileText, MessageCircle, GraduationCap, User, Settings } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const itensBase = [
  { label: 'Início', icon: Home,          rota: '/dashboard' },
  { label: 'Notas',  icon: FileText,       rota: '/anotacoes' },
  { label: 'Kira',   icon: MessageCircle,  rota: '/chat'      },
  { label: 'ENEM',   icon: GraduationCap,  rota: '/enem'      },
  { label: 'Perfil', icon: User,           rota: '/perfil'    },
]
const itemConfig = { label: 'Config', icon: Settings, rota: '/configuracoes' }

const semNavbar = [
  '/', '/login', '/lock', '/upgrade', '/sucesso',
  '/esqueci-senha', '/nfc', '/onboarding',
]

const glassBg = {
  background: 'linear-gradient(135deg, rgba(255,255,255,.06) 0%, transparent 52%), rgba(10,10,14,.85)',
  backdropFilter: 'blur(32px) saturate(180%)',
  WebkitBackdropFilter: 'blur(32px) saturate(180%)',
  border: '1px solid rgba(255,255,255,.12)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.18), inset 0 -1px 0 rgba(255,255,255,.06), 0 10px 28px rgba(0,0,0,.35)',
}

function NavItem({ label, icon: Icon, rota, ativo }) {
  const navigate = useNavigate()
  const isEnem = rota === '/enem'

  return (
    <motion.button
      onClick={() => navigate(rota)}
      whileTap={{ scale: 0.9 }}
      style={{
        position: 'relative', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 4, padding: '8px 12px',
        background: 'none', border: 'none', cursor: 'pointer',
      }}
    >
      <AnimatePresence>
        {ativo && (
          <motion.div
            layoutId="navbar-pill"
            style={{
              position: 'absolute', inset: 0, borderRadius: 16,
              background: isEnem ? 'rgba(29,78,216,0.18)' : 'rgba(255,255,255,0.08)',
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 250, damping: 20 }}
          />
        )}
      </AnimatePresence>
      <Icon
        size={22}
        style={{
          position: 'relative', zIndex: 1,
          color: ativo ? (isEnem ? '#60a5fa' : '#fff') : '#52525b',
        }}
      />
      <span style={{
        position: 'relative', zIndex: 1, fontSize: 10,
        color: ativo ? (isEnem ? '#60a5fa' : '#fff') : '#52525b',
        fontWeight: ativo ? 700 : 400,
      }}>
        {label}
      </span>
    </motion.button>
  )
}

function Navbar() {
  const location = useLocation()
  if (semNavbar.includes(location.pathname)) return null

  const emConfig = location.pathname === '/configuracoes'
  const itens = emConfig ? [...itensBase, itemConfig] : itensBase

  return (
    <>
      {/* ── MOBILE: barra inferior ── */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        maxWidth: 430, margin: '0 auto', padding: '0 16px 8px',
        zIndex: 50,
      }}
        className="md:hidden"
      >
        <div style={{ ...glassBg, borderRadius: 50, display: 'flex', justifyContent: 'space-around', padding: '8px 16px' }}>
          {itens.map(({ label, icon, rota }) => (
            <NavItem key={rota} label={label} icon={icon} rota={rota} ativo={location.pathname === rota} />
          ))}
        </div>
      </nav>

      {/* ── DESKTOP: sidebar flutuante esquerda ── */}
      <nav style={{
        position: 'fixed', left: 24,
        top: '50%', transform: 'translateY(-50%)',
        zIndex: 50, display: 'none',
      }}
        className="hidden md:block"
      >
        <div style={{ ...glassBg, borderRadius: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 12, gap: 4 }}>
          {/* Logo */}
          <div style={{
            width: 36, height: 36, borderRadius: 10, marginBottom: 8,
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 14,
          }}>
            S
          </div>

          {itens.map(({ label, icon, rota }) => (
            <NavItem key={rota} label={label} icon={icon} rota={rota} ativo={location.pathname === rota} />
          ))}
        </div>
      </nav>
    </>
  )
}

export default Navbar