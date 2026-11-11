import { useLocation } from 'react-router-dom'
import { Settings } from 'lucide-react'
import { StudyLink } from './StudyLink'

const semTopBar = ['/', '/login', '/lock', '/upgrade', '/sucesso', '/esqueci-senha', '/nfc', '/chat', '/onboarding']

function TopBar() {
  const location = useLocation()

  if (semTopBar.includes(location.pathname)) return null

  return (
    <div className="study-topbar fixed top-0 right-0 z-50 p-4 max-w-sm w-full mx-auto flex justify-end pointer-events-none">
      <StudyLink to="/configuracoes"
        aria-label="Configurações"
        className="pointer-events-auto w-11 h-11 rounded-full bg-[#0a0a0c] border border-[#16161b] flex items-center justify-center hover:border-zinc-600 transition"
      >
        <Settings size={15} className="text-[#a1a1aa]" />
      </StudyLink>
    </div>
  )
}

export default TopBar