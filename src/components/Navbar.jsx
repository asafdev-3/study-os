import { NavLink, useLocation } from 'react-router-dom'
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
  if (hiddenRoutes.has(pathname)) return null
  const visibleItems = pathname.startsWith('/configuracoes') ? [...items, settings] : items

  return (
    <nav className="study-navigation" aria-label="Navegação principal">
      <div className="study-navigation-inner">
        <img className="study-navigation-brand" src="/icons/icon-192.png" alt="StudyOS" width="34" height="34" />
        {visibleItems.map(({ label, icon: Icon, path }) => (
          <NavLink key={path} to={path} className="study-tab">
            <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
