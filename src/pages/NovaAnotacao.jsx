import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { X, Zap, RotateCcw } from 'lucide-react'

function NovaAnotacao() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const modo = params.get('modo') // 'camera'

  const videoRef = useRef(null)
  const [fase, setFase] = useState('preview') // preview | capturando | processando | resultado
  const [flashAtivo, setFlashAtivo] = useState(false)
  const streamRef = useRef(null)

  useEffect(() => {
    iniciarCamera()
    return () => pararCamera()
  }, [])

  async function iniciarCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch {
      // câmera negada ou indisponível — mantém tela de fallback
    }
  }

  function pararCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop())
  }

  function voltar() {
    pararCamera()
    navigate(-1)
  }

  function capturar() {
    setFlashAtivo(true)
    setFase('capturando')

    setTimeout(() => setFlashAtivo(false), 120)

    // simula processamento OCR
    setTimeout(() => setFase('processando'), 300)
    setTimeout(() => setFase('resultado'), 2200)
  }

  function novamente() {
    setFase('preview')
    iniciarCamera()
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">

      {/* flash */}
      {flashAtivo && (
        <div className="absolute inset-0 bg-white z-50 pointer-events-none" style={{ opacity: 0.85 }} />
      )}

      {/* header */}
      <div
        className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-5"
        style={{ paddingTop: 'max(20px, env(safe-area-inset-top))' }}
      >
        <button onClick={voltar} className="w-9 h-9 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
          <X size={18} className="text-white" />
        </button>
        <span className="text-xs tracking-[0.2em] text-white/70">OCR · CÂMERA</span>
        <div className="w-9" />
      </div>

      {/* viewfinder */}
      {fase !== 'resultado' && (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {/* overlay de enquadramento */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="rounded-2xl"
              style={{
                width: '80%',
                height: '55%',
                border: '2px solid rgba(139, 92, 246, 0.6)',
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
              }}
            />
          </div>

          {/* dica */}
          <div className="absolute bottom-36 left-0 right-0 flex justify-center pointer-events-none">
            {fase === 'preview' && (
              <span className="text-white/60 text-xs bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm">
                Posicione o texto dentro do quadro
              </span>
            )}
            {fase === 'processando' && (
              <span className="text-violet-300 text-xs bg-black/60 px-4 py-2 rounded-full backdrop-blur-sm animate-pulse">
                Kira está lendo...
              </span>
            )}
          </div>

          {/* botão capturar */}
          <div
            className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-10"
            style={{ paddingBottom: 'max(40px, env(safe-area-inset-bottom))' }}
          >
            <div className="w-10" />

            <button
              onClick={capturar}
              disabled={fase !== 'preview'}
              className="w-18 h-18 rounded-full flex items-center justify-center transition-transform active:scale-95"
              style={{
                width: 72,
                height: 72,
                background: 'linear-gradient(135deg, #8B5CF6, #6366F1, #22D3A0)',
                padding: 3,
                opacity: fase !== 'preview' ? 0.4 : 1,
              }}
            >
              <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                <Zap size={26} className="text-white" />
              </div>
            </button>

            <button onClick={novamente} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <RotateCcw size={16} className="text-white/70" />
            </button>
          </div>
        </>
      )}

      {/* tela de resultado */}
      {fase === 'resultado' && (
        <div className="flex-1 flex flex-col px-5 pt-20 pb-10 gap-6 overflow-y-auto">
          <div>
            <p className="text-[10px] text-[#4ADE80] tracking-widest mb-1">● RECONHECIDO · CÁLCULO</p>
            <p className="text-white/40 text-xs mb-4">Kira identificou o texto abaixo. Revise antes de salvar.</p>
          </div>

          <div
            className="rounded-2xl p-5 border border-[#26262e] flex-1"
            style={{ background: 'rgba(22,22,27,0.97)' }}
          >
            <p className="text-sm font-semibold text-white mb-2">Regra do produto</p>
            <p className="text-zinc-400 text-sm leading-relaxed" style={{ fontFamily: 'Instrument Serif, serif' }}>
              (fg)' = f'g + fg'<br /><br />
              Se f(x) = x² e g(x) = sin(x), então:<br />
              (fg)' = 2x · sin(x) + x² · cos(x)
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={novamente}
              className="flex-1 py-3.5 rounded-2xl border border-[#26262e] text-zinc-400 text-sm"
            >
              Capturar novamente
            </button>
            <button
              onClick={voltar}
              className="flex-1 py-3.5 rounded-2xl text-sm font-medium text-white"
              style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1)' }}
            >
              Salvar anotação
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default NovaAnotacao