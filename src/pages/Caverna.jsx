import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Pause, RotateCcw } from 'lucide-react'

const FOCO_TOTAL = 25 * 60
const PAUSA_TOTAL = 5 * 60
const SEGMENTOS = 32

function lerp(a, b, t) { return a + (b - a) * t }
function hexToRgb(hex) {
  return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)]
}
function rgbToHex(r,g,b) {
  return '#'+[r,g,b].map(v=>Math.round(v).toString(16).padStart(2,'0')).join('')
}

const COR_A = hexToRgb('#8B5CF6')
const COR_B = hexToRgb('#22D3A0')

function corSegmento(index, total) {
  const t = index / (total - 1)
  return rgbToHex(...[0,1,2].map(i => lerp(COR_A[i], COR_B[i], t)))
}

function Caverna() {
  const navigate = useNavigate()
  const [modo, setModo] = useState('foco')
  const [segundos, setSegundos] = useState(FOCO_TOTAL)
  const [rodando, setRodando] = useState(false)
  const [concluido, setConcluido] = useState(false)
  const [piscando, setPiscando] = useState(false)
  const intervalRef = useRef(null)

  const total = modo === 'foco' ? FOCO_TOTAL : PAUSA_TOTAL
  const progresso = 1 - segundos / total
  const segmentosAtivos = Math.floor(progresso * SEGMENTOS)

  useEffect(() => {
    if (rodando) {
      intervalRef.current = setInterval(() => {
        setSegundos(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current)
            setRodando(false)
            setConcluido(true)
            let count = 0
            const pisca = setInterval(() => {
              setPiscando(p => !p)
              count++
              if (count >= 6) clearInterval(pisca)
            }, 300)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [rodando])

  function resetar() {
    clearInterval(intervalRef.current)
    setRodando(false); setConcluido(false); setPiscando(false)
    setSegundos(modo === 'foco' ? FOCO_TOTAL : PAUSA_TOTAL)
  }

  function alternarModo(novoModo) {
    clearInterval(intervalRef.current)
    setRodando(false); setConcluido(false); setPiscando(false)
    setModo(novoModo)
    setSegundos(novoModo === 'foco' ? FOCO_TOTAL : PAUSA_TOTAL)
  }

  const min = String(Math.floor(segundos / 60)).padStart(2, '0')
  const sec = String(segundos % 60).padStart(2, '0')
  const cx = 160, cy = 160, raioExterno = 130, raioInterno = 104, gap = 5

  function segmentoPath(index) {
    const angleTotal = (2 * Math.PI) / SEGMENTOS
    const angleGap = gap * (Math.PI / 180)
    const startAngle = index * angleTotal - Math.PI / 2 + angleGap / 2
    const endAngle = startAngle + angleTotal - angleGap
    const x1 = cx + raioExterno * Math.cos(startAngle), y1 = cy + raioExterno * Math.sin(startAngle)
    const x2 = cx + raioExterno * Math.cos(endAngle), y2 = cy + raioExterno * Math.sin(endAngle)
    const x3 = cx + raioInterno * Math.cos(endAngle), y3 = cy + raioInterno * Math.sin(endAngle)
    const x4 = cx + raioInterno * Math.cos(startAngle), y4 = cy + raioInterno * Math.sin(startAngle)
    return `M ${x1} ${y1} A ${raioExterno} ${raioExterno} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${raioInterno} ${raioInterno} 0 0 0 ${x4} ${y4} Z`
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-between max-w-sm mx-auto" style={{background:'#000'}}>
      <div className="w-full flex items-center justify-between px-6 pt-14 pb-4">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors">
          <span style={{fontSize:'20px'}}>←</span>
          <span style={{fontFamily:'Geist,sans-serif',fontSize:'13px',letterSpacing:'0.05em'}}>SAIR</span>
        </button>
        <div className="flex gap-1 p-1 rounded-full" style={{background:'#0a0a0c',border:'1px solid #26262e'}}>
          {['foco','pausa'].map(m => (
            <button key={m} onClick={() => alternarModo(m)} className="px-4 py-1.5 rounded-full transition-all duration-300"
              style={{fontFamily:'Geist,sans-serif',fontSize:'11px',letterSpacing:'0.1em',textTransform:'uppercase',
                background: modo===m ? 'linear-gradient(135deg,#8B5CF6,#22D3A0)' : 'transparent',
                color: modo===m ? '#fff' : '#a1a1aa'}}>
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <div style={{position:'relative',width:320,height:320}}>
          <svg width="320" height="320" viewBox="0 0 320 320">
            {Array.from({length:SEGMENTOS}).map((_,i) => {
              const ativo = i < segmentosAtivos
              const mostrarCor = ativo || (concluido && piscando)
              return (
                <path key={i} d={segmentoPath(i)}
                  fill={mostrarCor ? corSegmento(i, SEGMENTOS) : '#1a1a1a'}
                  opacity={mostrarCor ? 1 : 0.4}
                  style={{transition:'fill 0.4s ease, opacity 0.4s ease',
                    filter: mostrarCor ? `drop-shadow(0 0 4px ${corSegmento(i,SEGMENTOS)}99)` : 'none'}}
                />
              )
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span style={{fontFamily:'Geist Mono,monospace',fontSize:'52px',fontWeight:'300',
              letterSpacing:'-2px',color:concluido?'#22D3A0':'#f4f4f5',transition:'color 0.3s ease'}}>
              {min}:{sec}
            </span>
            <span style={{fontFamily:'Geist,sans-serif',fontSize:'10px',letterSpacing:'0.2em',color:'#a1a1aa',marginTop:'4px'}}>
              {concluido ? 'SESSÃO CONCLUÍDA' : modo==='foco' ? 'MODO CAVERNA' : 'PAUSA ATIVA'}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {[1,2,3,4].map(i => (
            <div key={i} className="w-2 h-2 rounded-full"
              style={{background: i===1 ? 'linear-gradient(135deg,#8B5CF6,#22D3A0)' : '#26262e'}} />
          ))}
        </div>
      </div>

      <div className="w-full flex items-center justify-center gap-6 px-6 pb-16">
        <button onClick={resetar} className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{background:'#0a0a0c',border:'1px solid #26262e'}}>
          <RotateCcw size={18} className="text-zinc-500" />
        </button>
        <button onClick={() => concluido ? resetar() : setRodando(r => !r)}
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{background:'linear-gradient(135deg,#8B5CF6,#22D3A0)',
            boxShadow: rodando ? '0 0 32px rgba(139,92,246,0.5)' : 'none',transition:'box-shadow 0.3s ease'}}>
          {concluido ? <RotateCcw size={28} className="text-white" />
            : rodando ? <Pause size={28} className="text-white" />
            : <Play size={28} className="text-white" style={{marginLeft:'3px'}} />}
        </button>
        <div className="w-12 h-12" />
      </div>
    </div>
  )
}

export default Caverna