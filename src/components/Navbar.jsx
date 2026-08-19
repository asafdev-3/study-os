// Navbar.jsx — barra de navegação inferior
// Sem borda superior, fundo escuro sólido, ícone ativo em violeta

import { useLocation, useNavigate } from 'react-router-dom'
import { Home, FileText, MessageCircle, StickyNote, User } from 'lucide-react'

const itens = [
  { label: 'Início',   icon: Home,          rota: '/dashboard' },
  { label: 'Notas',    icon: FileText,       rota: '/anotacoes' },
  { label: 'Nyx',      icon: MessageCircle,  rota: '/chat'      },
  { label: 'Post-its', icon: StickyNote,     rota: '/lembretes' },
  { label: 'Perfil',   icon: User,           rota: '/perfil'    },
]

function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-sm mx-auto px-4 pb-6 pt-0">
  <div className="flex justify-around items-center px-4 pt-3 pb-3 rounded-2xl"
    style={{
      background: 'rgba(12, 12, 14, 0.75)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: '24px',
    }}>
    {itens.map(({ label, icon: Icon, rota }) => {
      const ativo = location.pathname === rota
      return (
        <button
          key={rota}
          onClick={() => navigate(rota)}
          className="flex flex-col items-center gap-1"
        >
          <Icon size={22} className={ativo ? 'text-white' : 'text-zinc-600'} />
          <span className={`text-[10px] ${ativo ? 'text-white' : 'text-zinc-600'}`}>
            {label}
          </span>
        </button>
      )
    })}
  </div>
</nav>
  )
}

export default Navbar