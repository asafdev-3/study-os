import { m as motion, LayoutGroup } from 'framer-motion'
import { useStudyReducedMotion } from '../lib/motion'
import { NavLink, useLocation } from 'react-router-dom'
import { StudyLink } from './StudyLink'
import { Home, FileText, MessageCircle, GraduationCap, User, Settings } from 'lucide-react'

const items = [
  { label: 'Início', icon: Home, path: '/dashboard' },
  { label: 'Notas', icon: FileText, path: '/anotacoes' },
  { label: 'Kira', icon: MessageCircle, path: '/chat' },
  { label: 'ENEM', icon: GraduationCap, path: '/enem' },
  { label: 'Perfil', icon: User, path: '/perfil' },
]
const settings = { label: 'Config', icon: Settings, path: '/configuracoes' }
const hiddenRoutes = new Set(['/', '/login', '/lock', '/upgrade', '/sucesso', '/esqueci-senha', '/nfc', '/onboarding'])

export default function Navbar() {
  const { pathname } = useLocation()
  const reduced = useStudyReducedMotion()
  if (hiddenRoutes.has(pathname)) return null
  const visibleItems = pathname.startsWith('/configuracoes') ? [...items, settings] : items

  return (
    <nav className="study-navigation" aria-label="Navegação principal">
      <LayoutGroup id="study-navigation"><div className="study-navigation-inner">
        <img className="study-navigation-brand" src="/icons/icon-192.png" alt="StudyOS" width="34" height="34" />
        {visibleItems.map(({ label, icon: Icon, path }) => (
          <StudyLink as={NavLink} key={path} to={path} className="study-tab">
            {(pathname === path || (path === '/configuracoes' && pathname.startsWith(path))) && <motion.span
              className="study-tab-indicator" layoutId="active-tab" aria-hidden="true"
              transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 38, mass: .7 }} />}
            <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
            <span>{label}</span>
          </StudyLink>
        ))}
      </div></LayoutGroup>
    </nav>
  )
}
