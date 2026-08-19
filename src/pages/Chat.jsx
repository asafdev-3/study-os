// Chat.jsx — conversa com a Nyx, IA do StudyOS

import { useState } from 'react'
import { Mic, ArrowUp, Image } from 'lucide-react'
import Navbar from '../components/Navbar'

const mensagensIniciais = [
  {
    id: 1, tipo: 'nyx',
    texto: 'Vi que você tá com oxirredução aberto desde ontem. Quer que eu monte 3 perguntas rápidas pra ver se colou?',
    tag: 'BASEADO NO SEU HISTÓRICO',
    opcoes: ['Sim, manda', 'Explica de novo', 'Só um exemplo']
  },
  {
    id: 2, tipo: 'user',
    texto: 'ta, manda uma. mas fácil que to cansado'
  },
  {
    id: 3, tipo: 'nyx',
    texto: 'Beleza. Vou de uma nível 1.',
    pergunta: {
      label: 'PERGUNTA · 1 DE 1',
      enunciado: 'Numa reação, o agente redutor é aquele que:',
      alternativas: [
        { letra: 'A', texto: 'ganha elétrons' },
        { letra: 'B', texto: 'perde elétrons' },
        { letra: 'C', texto: 'não muda de NOX' },
      ]
    }
  },
  {
    id: 4, tipo: 'user', texto: 'b'
  },
  {
    id: 5, tipo: 'nyx',
    texto: 'Exato. Quem perde elétron sofre oxidação — então é o redutor. +15 XP.',
    sub: 'anotei que esse conceito colou. amanhã eu não pergunto de novo.'
  },
]

function Chat() {
  const [input, setInput] = useState('')
  const [mensagens] = useState(mensagensIniciais)

  return (
    <div className="min-h-screen bg-black text-white flex flex-col max-w-sm mx-auto">

      {/* Header Nyx */}
      <div className="px-4 pt-12 pb-4 flex items-center gap-3 border-b border-[#16161b]">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
          style={{ background: 'linear-gradient(135deg, #8B5CF6, #22D3A0)' }}>
          Nx
        </div>
        <div>
          <p className="font-medium text-sm">Nyx</p>
          <p className="text-[#a1a1aa] text-xs">lembra do que você estudou nas últimas 2 semanas</p>
        </div>
        <div className="ml-auto w-2 h-2 rounded-full bg-[#22D3A0]" />
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-4 pb-36">

        <p className="text-[#a1a1aa] text-[10px] tracking-widest text-center">HOJE · 23:51</p>

        {mensagens.map(({ id, tipo, texto, tag, opcoes, pergunta, sub }) => (
          <div key={id} className={`flex flex-col gap-2 ${tipo === 'user' ? 'items-end' : 'items-start'}`}>

            {tipo === 'nyx' && (
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-full flex-shrink-0 mt-0.5"
                  style={{ background: 'linear-gradient(135deg, #8B5CF6, #22D3A0)', padding: '1px' }}>
                  <div className="w-full h-full rounded-full bg-black" />
                </div>
                <div className="flex flex-col gap-2 max-w-[85%]">
                  {tag && (
                    <p className="text-[#a1a1aa] text-[10px] tracking-widest flex items-center gap-1">
                      ✦ {tag}
                    </p>
                  )}
                  <p className="text-sm leading-relaxed">
                    {texto.includes('oxirredução')
                      ? <><em style={{ fontFamily: 'Instrument Serif, serif' }}>oxirredução</em>{texto.split('oxirredução')[1]}</>
                      : texto.includes('perde elétron')
                      ? <>{texto.split('perde elétron')[0]}<strong>perde elétron</strong>{texto.split('perde elétron')[1]}</>
                      : texto
                    }
                  </p>
                  {sub && <p className="text-[#a1a1aa] text-xs">{sub}</p>}
                  {opcoes && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {opcoes.map(o => (
                        <button key={o} className="text-xs border border-[#26262e] text-white px-3 py-1.5 rounded-full hover:border-zinc-500 transition">
                          {o}
                        </button>
                      ))}
                    </div>
                  )}
                  {pergunta && (
                    <div className="bg-[#0a0a0c] border border-[#16161b] rounded-2xl p-4 mt-1">
                      <p className="text-[#a1a1aa] text-[10px] tracking-widest mb-3">{pergunta.label}</p>
                      <p className="text-sm font-medium mb-3">
                        {pergunta.enunciado.includes('redutor')
                          ? <>{pergunta.enunciado.split('redutor')[0]}<strong className="text-white">redutor</strong>{pergunta.enunciado.split('redutor')[1]}</>
                          : pergunta.enunciado
                        }
                      </p>
                      {pergunta.alternativas.map(({ letra, texto: t }) => (
                        <div key={letra} className={`flex items-center gap-3 border rounded-xl px-3 py-2.5 mb-2
                          ${letra === 'B' ? 'border-violet-500 bg-violet-500/10' : 'border-[#26262e]'}`}>
                          <span className="w-6 h-6 rounded-lg bg-[#16161b] flex items-center justify-center text-xs text-[#a1a1aa]">{letra}</span>
                          <span className="text-sm">{t}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {tipo === 'user' && (
              <div className="bg-[#1a1a1a] border border-[#26262e] rounded-2xl px-4 py-3 max-w-[75%]">
                <p className="text-sm">{texto}</p>
              </div>
            )}

          </div>
        ))}
      </div>

      {/* Input */}
      <div className="fixed bottom-20 left-0 right-0 max-w-sm mx-auto px-4 pb-2">
        <div className="flex items-center bg-[#0a0a0c] border border-[#16161b] rounded-2xl px-4 py-3 gap-3">
          <Image size={18} className="text-[#a1a1aa]" />
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="pergunta pra Nyx..."
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder-[#a1a1aa]"
          />
          <Mic size={18} className="text-[#a1a1aa]" />
          <button
            style={{ background: 'linear-gradient(135deg, #8B5CF6, #22D3A0)' }}
            className="w-8 h-8 rounded-full flex items-center justify-center"
          >
            <ArrowUp size={16} className="text-white" />
          </button>
        </div>
      </div>

      <Navbar />
    </div>
  )
}

export default Chat