// Navbar.jsx — barra de navegação inferior, reutilizada em todas as telas
// Ícones: Lucide React | Rota ativa destacada automaticamente

import { useLocation, useNavigate } from 'react-router-dom'
import { Home, FileText, MessageCircle, StickyNote, User } from 'lucide-react'

// Definição dos itens da navbar
const itens = [
  { label: 'Início',    icon: Home,          rota: '/dashboard'    },
  { label: 'Notas',     icon: FileText,       rota: '/anotacoes'    },
  { label: 'Nyx',       icon: MessageCircle,  rota: '/chat'         },
  { label: 'Post-its',  icon: StickyNote,     rota: '/lembretes'    },
  { label: 'Perfil',    icon: User,           rota: '/perfil'       },
]

function Navbar() {
  const location = useLocation()   // rota atual
  const navigate = useNavigate()   // função de navegação

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 px-4 py-3 flex justify-around items-center max-w-sm mx-auto">
      {itens.map(({ label, icon: Icon, rota }) => {
        const ativo = location.pathname === rota
        return (
          <button
            key={rota}
            onClick={() => navigate(rota)}
            className="flex flex-col items-center gap-1"
          >
            <Icon
              size={22}
              className={ativo ? 'text-violet-400' : 'text-zinc-500'}
            />
            <span className={`text-[10px] ${ativo ? 'text-violet-400' : 'text-zinc-500'}`}>
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

export default Navbar