import { NavLink, useLocation } from 'react-router-dom'
import { StudyLink } from './StudyLink'
import { m as motion } from 'framer-motion'
import { microSpring, useStudyReducedMotion } from '../lib/motion'

import { House, BookOpen, MessageCircle, GraduationCap, CircleUserRound } from 'lucide-react'

const icons = { inicio: House, notas: BookOpen, kira: MessageCircle, enem: GraduationCap, perfil: CircleUserRound }

const items = [
  { id: 'inicio', label: 'Início', path: '/dashboard', isMatch: (p) => p.startsWith('/dashboard') },
  { id: 'notas', label: 'Notas', path: '/anotacoes', isMatch: (p) => p.startsWith('/anotacoes') || p.startsWith('/lembretes') },
  { id: 'kira', label: 'Kira', path: '/chat', isMatch: (p) => p.startsWith('/chat') },
  { id: 'enem', label: 'ENEM', path: '/enem', isMatch: (p) => p.startsWith('/enem') },
  { id: 'perfil', label: 'Perfil', path: '/perfil', isMatch: (p) => p.startsWith('/perfil') || p.startsWith('/configuracoes') },
]

const hiddenRoutes = new Set(['/', '/login', '/lock', '/upgrade', '/sucesso', '/esqueci-senha', '/nfc', '/onboarding', '/caverna', '/native-session'])

export default function Navbar() {
  const reduced = useStudyReducedMotion()
  const { pathname } = useLocation()
  if (hiddenRoutes.has(pathname)) return null

  return (
    <nav className="study-navigation" aria-label="Navegação principal">
      <div className="study-navigation-inner">
        <img className="study-navigation-brand" src="/icons/icon-192.png" alt="StudyOS" width="34" height="34" />
        {items.map(({ id, label, path, isMatch }) => {
          const active = isMatch(pathname)
          const Icon = icons[id]
          return (
            <StudyLink
              as={NavLink}
              key={path}
              to={path}
              className="study-tab"
              aria-current={active ? 'page' : undefined}
              style={{
                color: active ? '#f8fbff' : '#9fb1cb',
                fontWeight: active ? 600 : 500,
              }}
            >
              {active && <motion.span layoutId={reduced ? undefined : 'study-current-tab'}
                initial={false} transition={reduced ? { duration: 0 } : microSpring}
                className="study-tab-indicator" aria-hidden="true" />}
              <Icon size={23} strokeWidth={active ? 2 : 1.65} aria-hidden="true" />
              <span>{label}</span>
            </StudyLink>
          )
        })}
      </div>
    </nav>
  )
}