import { useNavigate, useLocation } from 'react-router-dom'
import { Settings } from 'lucide-react'

const semTopBar = ['/', '/login', '/lock', '/upgrade', '/sucesso', '/esqueci-senha', '/nfc', '/chat']

function TopBar() {
  const navigate = useNavigate()
  const location = useLocation()

  if (semTopBar.includes(location.pathname)) return null

  return (
    <div className="fixed top-0 right-0 z-50 p-4 max-w-sm w-full mx-auto flex justify-end pointer-events-none">
      <button
        onClick={() => navigate('/configuracoes')}
        className="pointer-events-auto w-9 h-9 rounded-full bg-[#0a0a0c] border border-[#16161b] flex items-center justify-center hover:border-zinc-600 transition"
      >
        <Settings size={15} className="text-[#a1a1aa]" />
      </button>
    </div>
  )
}

export default TopBar