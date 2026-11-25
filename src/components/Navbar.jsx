import { NavLink, useLocation } from 'react-router-dom'
import { StudyLink } from './StudyLink'
import { preloadStudyRoute } from '../lib/studyRoutes'

function SfIcon({ id, active }) {
  const fillOpacity = active ? 0.25 : 0
  const strokeWidth = active ? 2.15 : 1.75

  switch (id) {
    case 'inicio':
      return (
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M3.5 10.4L12 3.5l8.5 6.9v8.8a1.8 1.8 0 0 1-1.8 1.8h-4.2v-5.6a1.5 1.5 0 0 0-1.5-1.5h-2a1.5 1.5 0 0 0-1.5 1.5V21H5.3a1.8 1.8 0 0 1-1.8-1.8v-8.8Z"
            fill="currentColor"
            fillOpacity={fillOpacity}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'notas':
      return (
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect
            x="4.5"
            y="3.5"
            width="15"
            height="17"
            rx="3.4"
            fill="currentColor"
            fillOpacity={fillOpacity}
            stroke="currentColor"
            strokeWidth={strokeWidth}
          />
          <path
            d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4.5"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </svg>
      )
    case 'kira':
      return (
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 3.5l1.9 5.3 5.3 1.9-5.3 1.9L12 17.9l-1.9-5.3-5.3-1.9 5.3-1.9L12 3.5Z"
            fill="currentColor"
            fillOpacity={fillOpacity}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
          <path
            d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z"
            fill="currentColor"
            fillOpacity={active ? 0.7 : 0.28}
          />
        </svg>
      )
    case 'enem':
      return (
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M2.5 9.5L12 5l9.5 4.5L12 14 2.5 9.5Z"
            fill="currentColor"
            fillOpacity={fillOpacity}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
          <path
            d="M6.2 11.4v4.4c0 1.7 2.6 3.2 5.8 3.2s5.8-1.5 5.8-3.2v-4.4M20.5 10.2v4.8"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    default:
      return (
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle
            cx="12"
            cy="8.3"
            r="3.6"
            fill="currentColor"
            fillOpacity={fillOpacity}
            stroke="currentColor"
            strokeWidth={strokeWidth}
          />
          <path
            d="M5 19.5c0-3.3 3.1-5.5 7-5.5s7 2.2 7 5.5"
            fill="currentColor"
            fillOpacity={fillOpacity}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </svg>
      )
  }
}

const items = [
  { id: 'inicio', label: 'Início', path: '/dashboard', isMatch: (p) => p.startsWith('/dashboard') },
  { id: 'notas', label: 'Notas', path: '/anotacoes', isMatch: (p) => p.startsWith('/anotacoes') || p.startsWith('/lembretes') },
  { id: 'kira', label: 'Kira', path: '/chat', isMatch: (p) => p.startsWith('/chat') },
  { id: 'enem', label: 'ENEM', path: '/enem', isMatch: (p) => p.startsWith('/enem') },
  { id: 'perfil', label: 'Perfil', path: '/perfil', isMatch: (p) => p.startsWith('/perfil') || p.startsWith('/configuracoes') },
]

const hiddenRoutes = new Set(['/', '/login', '/lock', '/upgrade', '/sucesso', '/esqueci-senha', '/nfc', '/onboarding', '/caverna', '/native-session'])

export default function Navbar() {
  const { pathname } = useLocation()
  if (hiddenRoutes.has(pathname)) return null

  return (
    <nav className="study-navigation" aria-label="Navegação principal">
      <div className="study-navigation-inner">
        <img className="study-navigation-brand" src="/icons/icon-192.png" alt="StudyOS" width="34" height="34" />
        {items.map(({ id, label, path, isMatch }) => {
          const active = isMatch(pathname)
          return (
            <StudyLink
              as={NavLink}
              key={path}
              to={path}
              className="study-tab"
              aria-current={active ? 'page' : undefined}
              onPointerEnter={() => { try { void preloadStudyRoute(path) } catch { /* ignore */ } }}
              style={{
                color: active ? '#f8fbff' : '#9fb1cb',
                fontWeight: active ? 600 : 500,
              }}
            >
              {active && <span className="study-tab-indicator" aria-hidden="true" />}
              <SfIcon id={id} active={active} />
              <span>{label}</span>
            </StudyLink>
          )
        })}
      </div>
    </nav>
  )
}