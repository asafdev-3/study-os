import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'

const conquistas = [
  {
    id: 1, emoji: '🦉', nome: 'Coruja',
    desc: '10 sessões depois das 23h',
    detalhe: 'Complete 10 sessões de estudo entre 23h e meia-noite.',
  },
  {
    id: 2, emoji: '🔥', nome: 'Fôlego',
    desc: 'Uma semana inteira sem quebrar sequência',
    detalhe: 'Sete dias consecutivos de estudo sem falhar.',
  },
  {
    id: 3, emoji: '🗺️', nome: 'Cartógrafo',
    desc: '50 anotações organizadas pela IA',
    detalhe: 'Organize 50 anotações com a ajuda da Kira para desbloquear.',
  },
]

const XP_POR_SESSAO = 30
const XP_POR_NIVEL = 300
const DIA = 86400000
const formatoDia = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
})
const formatoHora = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo', hour: '2-digit', hourCycle: 'h23',
})
const chaveDia = (dia) => new Date(dia).toISOString().slice(0, 10)
function chaveDiaLocal(data) {
  const partes = Object.fromEntries(
    formatoDia.formatToParts(data).map(({ type, value }) => [type, value]),
  )
  return [partes.year, partes.month, partes.day].join('-')
}

async function carregarSessoes(userId) {
  const sessoes = []
  const tamanho = 500
  for (let inicio = 0; ; inicio += tamanho) {
    const { data, error } = await supabase
      .from('study_sessions')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .order('id')
      .range(inicio, inicio + tamanho - 1)
    if (error) throw error
    sessoes.push(...data)
    if (data.length < tamanho) return sessoes
  }
}

function resumirSessoes(sessoes, hoje) {
  const porDia = new Map()
  let noturnas = 0
  for (const sessao of sessoes) {
    if (!sessao.created_at) continue
    const data = new Date(sessao.created_at)
    const dia = chaveDiaLocal(data)
    porDia.set(dia, (porDia.get(dia) ?? 0) + 1)
    if (formatoHora.format(data) === '23') noturnas += 1
  }

  let seguidos = 0
  let cursor = porDia.has(chaveDia(hoje)) ? hoje : hoje - DIA
  while (porDia.has(chaveDia(cursor))) {
    seguidos += 1
    cursor -= DIA
  }

  let recorde = 0
  let sequencia = 0
  let anterior = null
  for (const dia of [...porDia.keys()].sort()) {
    const data = Date.parse(dia)
    sequencia = anterior === data - DIA ? sequencia + 1 : 1
    recorde = Math.max(recorde, sequencia)
    anterior = data
  }

  const semanas = Array.from({ length: 12 }, (_, semana) =>
    Array.from({ length: 7 }, (_, dia) => {
      const data = chaveDia(hoje - (83 - semana * 7 - dia) * DIA)
      return { data, sessoes: porDia.get(data) ?? 0 }
    }),
  )
  return { semanas, seguidos, recorde, noturnas }
}

const intensidade = ['bg-[#111111]', 'bg-[#2d1f5e]', 'bg-[#4a3494]', 'bg-[#6b4fc8]', 'bg-[#8B5CF6]']

function ModalConquista({ conquista, onClose }) {
  return (
    <>
      <div
        className="fixed inset-0 z-50"
        style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(16px)' }}
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-6 pointer-events-none">
        <div className="w-full max-w-sm pointer-events-auto" style={{
          background: 'rgba(16,16,20,0.97)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 28,
          boxShadow: '0 30px 80px rgba(0,0,0,0.8)',
        }}>
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#1f1f27]">
            <span className="text-xs tracking-[0.2em] text-zinc-500 uppercase">Conquista</span>
            <button onClick={onClose} className="text-zinc-600 hover:text-zinc-400"><X size={18} /></button>
          </div>
          <div className="px-5 py-6 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-4" style={{
              background: conquista.desbloqueada
                ? 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(34,211,160,0.10))'
                : 'rgba(255,255,255,0.03)',
              border: conquista.desbloqueada
                ? '1px solid rgba(139,92,246,0.3)'
                : '1px solid rgba(255,255,255,0.06)',
              filter: conquista.desbloqueada ? 'none' : 'grayscale(1) opacity(0.4)',
            }}>
              {conquista.emoji}
            </div>
            {conquista.desbloqueada
              ? <span className="text-[10px] tracking-[0.2em] text-[#22D3A0] uppercase mb-2">✦ Desbloqueada</span>
              : <span className="text-[10px] tracking-[0.2em] text-zinc-600 uppercase mb-2">◇ Bloqueada</span>
            }
            <h2 className="text-xl font-semibold mb-1">{conquista.nome}</h2>
            <p className="text-zinc-500 text-sm mb-4">{conquista.desc}</p>
            <p className="text-zinc-400 text-sm leading-relaxed">{conquista.detalhe}</p>
          </div>
          <div className="px-5 pb-6">
            <button onClick={onClose} className="w-full py-3 rounded-2xl text-sm font-medium" style={{
              background: conquista.desbloqueada ? 'linear-gradient(135deg, #8B5CF6, #6366F1)' : 'rgba(255,255,255,0.05)',
              color: conquista.desbloqueada ? '#fff' : '#a1a1aa',
            }}>
              {conquista.desbloqueada ? 'Fechar' : 'Entendido'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function Perfil() {
  const navigate = useNavigate()
  const [conquistaSelecionada, setConquistaSelecionada] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [user, setUser] = useState(null)
  const [sessoes, setSessoes] = useState(null)
  const [erroSessoes, setErroSessoes] = useState(false)
  const [hoje] = useState(() => Date.parse(chaveDiaLocal(new Date())))
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    let ativo = true
    async function carregar() {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (!ativo) return
      if (error && error.name !== 'AuthSessionMissingError') throw error
      if (!user) { navigate('/login'); return }
      setUser(user)
      const perfilQuery = supabase.from('profiles')
        .select('nome, curso_objetivo, area_dificuldade')
        .eq('id', user.id)
        .single()
      const [perfilResultado, sessoesResultado] = await Promise.allSettled([
        perfilQuery, carregarSessoes(user.id),
      ])
      if (!ativo) return
      if (perfilResultado.status === 'fulfilled') setPerfil(perfilResultado.value.data)
      if (sessoesResultado.status === 'fulfilled') setSessoes(sessoesResultado.value)
      else setErroSessoes(true)
    }
    carregar().catch(() => { if (ativo) setErroSessoes(true) })
    return () => { ativo = false }
  }, [navigate, tentativa])

  const nome = perfil?.nome ?? user?.user_metadata?.full_name?.split(' ')[0] ?? '...'
  const iniciais = nome !== '...'
    ? nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'
  const username = (user?.user_metadata?.full_name ?? 'vitor').replace(' ', '').toLowerCase()

  const total = sessoes?.length ?? 0
  const { semanas, seguidos, recorde, noturnas } = resumirSessoes(sessoes ?? [], hoje)
  const xpAtual = total * XP_POR_SESSAO
  const nivel = Math.floor(xpAtual / XP_POR_NIVEL) + 1
  const xpProximo = nivel * XP_POR_NIVEL
  const pct = (xpAtual % XP_POR_NIVEL) / XP_POR_NIVEL * 100
  const conquistasAtuais = conquistas.map((conquista, i) => ({
    ...conquista,
    desbloqueada: i === 0 ? noturnas >= 10 : i === 1 && recorde >= 7,
  }))

  return (
    <div className="min-h-screen bg-black text-white pb-32 max-w-sm mx-auto" style={{ padding: '0 16px' }}>

      {/* Botão voltar — apenas desktop (mobile usa navbar) */}
      <div className="hidden md:flex items-center pt-14 pb-2">
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12, padding: '8px 14px',
            color: '#a1a1aa', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
          }}
        >
          <ArrowLeft size={14} /> Início
        </button>
      </div>
      {/* Espaço do topo no mobile */}
      <div className="md:hidden pt-14" />

      {/* Avatar + nível */}
      <div className="flex flex-col items-center pt-4 pb-4">
        <div className="relative w-24 h-24 mb-3">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="44" fill="none" stroke="#1a1a1a" strokeWidth="6" />
            <circle cx="48" cy="48" r="44" fill="none"
              stroke="url(#grad)" strokeWidth="6"
              strokeDasharray={`${2 * Math.PI * 44}`}
              strokeDashoffset={`${2 * Math.PI * 44 * (1 - pct / 100)}`}
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#22D3A0" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-semibold">{iniciais}</span>
            <span className="text-[#a1a1aa] text-[9px] tracking-widest">NÍVEL</span>
            <span className="text-xs font-medium">{sessoes ? String(nivel).padStart(2, '0') : '—'}</span>
          </div>
        </div>

        <h1 className="text-2xl font-semibold">{nome}</h1>
        <p className="text-[#a1a1aa] text-xs tracking-widest mt-0.5">
          @{username.toUpperCase()}
        </p>
        {sessoes && <p className="text-[#a1a1aa] text-xs mt-3">
          <span style={{ fontFamily: 'Geist Mono, monospace' }} className="text-white">{xpAtual.toLocaleString('pt-BR')}</span>
          {' '}/ {xpProximo.toLocaleString('pt-BR')} XP
          <span className="text-[#26262e] mx-2">·</span>
          faltam {xpProximo - xpAtual} para o nível {nivel + 1}
        </p>}
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {[
          { icon: '◎', valor: sessoes ? seguidos : '—', label: 'DIAS\nSEGUIDOS' },
          { icon: '⚡', valor: sessoes ? total : '—', label: 'SESSÕES' },
          { icon: '△', valor: sessoes ? total : '—', label: 'ÁRVORES\nPLANTADAS' },
        ].map(({ icon, valor, label }) => (
          <div key={label} className="bg-[#0a0a0c] border border-[#16161b] rounded-2xl p-4 flex flex-col gap-1">
            <span className="text-[#a1a1aa] text-sm">{icon}</span>
            <span style={{ fontFamily: 'Geist Mono, monospace' }} className="text-3xl font-medium">{valor}</span>
            <span className="text-[#a1a1aa] text-[9px] tracking-widest whitespace-pre-line">{label}</span>
          </div>
        ))}
      </div>

      {erroSessoes && (
        <div role="status" className="mb-5 text-sm text-zinc-400">
          Histórico de estudo indisponível.{' '}
          <button className="underline" onClick={() => {
            setErroSessoes(false)
            setTentativa((valor) => valor + 1)
          }}>Tentar novamente</button>
        </div>
      )}

      {/* Ritmo */}
      <p className="text-[#a1a1aa] text-[10px] tracking-widest uppercase mb-3">Seu ritmo · últimas 12 semanas</p>
      <div className="bg-[#0a0a0c] border border-[#16161b] rounded-2xl p-4 mb-6">
        <div className="flex gap-1">
          {semanas.map((semana, s) => (
            <div key={s} className="flex flex-col gap-1">
              {semana.map(({ data, sessoes }) => (
                <div key={data} title={`${data} · ${sessoes} sessão(ões)`}
                  className={`w-4 h-4 rounded-sm ${intensidade[Math.min(4, sessoes)]}`} />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-[#a1a1aa] text-[10px]">menos</span>
          <div className="flex gap-1">
            {intensidade.map((c, i) => <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />)}
          </div>
          <span className="text-[#a1a1aa] text-[10px]">mais</span>
        </div>
      </div>

      {/* Conquistas */}
      <p className="text-[#a1a1aa] text-[10px] tracking-widest uppercase mb-3">Conquistas</p>
      <div className="flex flex-col gap-2">
        {conquistasAtuais.map((conquista) => (
          <button
            key={conquista.id}
            onClick={() => setConquistaSelecionada(conquista)}
            className="bg-[#0a0a0c] border border-[#16161b] rounded-2xl px-4 py-3 flex items-center gap-3 text-left w-full active:scale-[0.98] transition-all"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg
              ${conquista.desbloqueada ? 'bg-[#1a1a1a]' : 'bg-[#0d0d0d] border border-[#1a1a1a] opacity-40'}`}>
              {conquista.emoji}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${!conquista.desbloqueada && 'text-[#a1a1aa]'}`}>{conquista.nome}</p>
              <p className="text-[#a1a1aa] text-xs mt-0.5">{conquista.desc}</p>
            </div>
            <span className="text-[#a1a1aa] text-xs flex-shrink-0">{conquista.desbloqueada ? 'Concluída' : 'Pendente'}</span>
          </button>
        ))}
      </div>

      {conquistaSelecionada && (
        <ModalConquista conquista={conquistaSelecionada} onClose={() => setConquistaSelecionada(null)} />
      )}
    </div>
  )
}

export default Perfil
