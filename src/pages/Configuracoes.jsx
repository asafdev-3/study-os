// Configuracoes.jsx — ajustes do app

import { useState } from 'react'
import { ChevronRight, LogOut } from 'lucide-react'

function Toggle({ ativo, onChange }) {
  return (
    <button
      onClick={() => onChange(!ativo)}
      className={`w-12 h-6 rounded-full transition-colors duration-300 flex items-center px-1
        ${ativo ? 'bg-violet-600' : 'bg-[#2a2a2a]'}`}
    >
      <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300
        ${ativo ? 'translate-x-6' : 'translate-x-0'}`} />
    </button>
  )
}

function Secao({ titulo, children }) {
  return (
    <div className="mb-5">
      <p className="text-[#a1a1aa] text-[10px] tracking-widest uppercase mb-2">{titulo}</p>
      <div className="bg-[#0a0a0c] border border-[#16161b] rounded-2xl overflow-hidden divide-y divide-[#16161b]">
        {children}
      </div>
    </div>
  )
}

function ItemToggle({ icone, titulo, desc, ativo, onChange }) {
  return (
    <div className="flex items-center justify-between px-4 py-4 gap-3">
      <span className="text-lg flex-shrink-0">{icone}</span>
      <div className="flex-1">
        <p className="text-sm font-medium">{titulo}</p>
        <p className="text-[#a1a1aa] text-xs mt-0.5">{desc}</p>
      </div>
      <Toggle ativo={ativo} onChange={onChange} />
    </div>
  )
}

function ItemSeta({ icone, titulo, desc, cor }) {
  return (
    <div className="flex items-center justify-between px-4 py-4 gap-3">
      {icone && <span className="text-lg flex-shrink-0">{icone}</span>}
      <div className="flex-1">
        <p className={`text-sm font-medium ${cor || 'text-white'}`}>{titulo}</p>
        {desc && <p className="text-[#a1a1aa] text-xs mt-0.5">{desc}</p>}
      </div>
      <ChevronRight size={16} className="text-[#a1a1aa]" />
    </div>
  )
}

function Configuracoes() {
  const [toggles, setToggles] = useState({
    modoNoturno: true,
    webPush: true,
    silencio: true,
    puxao: false,
    biometria: true,
    nfc: true,
  })

  const [sotaque, setSotaque] = useState('amigo')

  function set(key) {
    return (val) => setToggles(prev => ({ ...prev, [key]: val }))
  }

  return (
    <div className="min-h-screen bg-black text-white pb-32 px-4 max-w-sm mx-auto">

      {/* Header */}
      <div className="pt-12 pb-6">
        <h1 className="text-3xl font-semibold">Configurações</h1>
        <p style={{ fontFamily: 'Instrument Serif, serif' }} className="text-[#a1a1aa] text-sm italic mt-1">
          personalize como o StudyOS se comporta à noite
        </p>
      </div>

      {/* Perfil */}
      <div className="bg-[#0a0a0c] border border-[#16161b] rounded-2xl px-4 py-4 flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center text-sm font-medium">AV</div>
          <div>
            <p className="text-sm font-medium">Asaf Vitor</p>
            <p className="text-[#a1a1aa] text-xs">asaf@studyos.app</p>
          </div>
        </div>
        <ChevronRight size={16} className="text-[#a1a1aa]" />
      </div>

      {/* Aparência */}
      <Secao titulo="Aparência">
        <ItemToggle
          icone="🌙" titulo="Modo noturno"
          desc="sempre ativo — feito pra noite"
          ativo={toggles.modoNoturno} onChange={set('modoNoturno')}
        />
        <div className="flex items-center justify-between px-4 py-4 gap-3">
          <span className="text-lg">✦</span>
          <div className="flex-1">
            <p className="text-sm font-medium">Sotaque da IA</p>
            <p className="text-[#a1a1aa] text-xs mt-0.5">
              {sotaque === 'formal' ? 'fala com precisão e clareza'
                : sotaque === 'amigo' ? 'Kira fala como um amigo — descontraído'
                : 'respostas curtas e diretas'}
            </p>
          </div>
          <div className="flex gap-1">
            {['formal', 'amigo', 'seco'].map(s => (
              <button
                key={s}
                onClick={() => setSotaque(s)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition
                  ${sotaque === s ? 'bg-white text-black border-white' : 'text-[#a1a1aa] border-[#26262e]'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </Secao>

      {/* Notificações */}
      <Secao titulo="Notificações">
        <ItemToggle icone="🔔" titulo="Web Push" desc="lembretes e checkpoints da noite" ativo={toggles.webPush} onChange={set('webPush')} />
        <ItemToggle icone="🌙" titulo="Silêncio noturno depois das 02h" desc="Kira te deixa dormir" ativo={toggles.silencio} onChange={set('silencio')} />
        <ItemToggle icone="📣" titulo="Puxão de orelha educado" desc="quando você some por 3 dias" ativo={toggles.puxao} onChange={set('puxao')} />
      </Secao>

      {/* Entrada no app */}
      <Secao titulo="Entrada no app">
        <ItemToggle icone="👆" titulo="Tela de bloqueio biométrica" desc="toque pra entrar — sensação de app privado" ativo={toggles.biometria} onChange={set('biometria')} />
        <ItemToggle icone="📡" titulo="Atalho NFC" desc="aproximou → abre anotações direto" ativo={toggles.nfc} onChange={set('nfc')} />
      </Secao>

      {/* Seus dados */}
      <Secao titulo="Seus dados">
        <ItemSeta titulo="Exportar tudo" desc="baixe suas anotações em .md" />
        <ItemSeta titulo="Limpar histórico da IA" desc="Kira começa do zero" cor="text-red-400" />
      </Secao>

      {/* Sobre */}
      <Secao titulo="Sobre">
        <div className="flex items-center justify-between px-4 py-4">
          <div>
            <p className="text-sm font-medium">Versão</p>
            <p className="text-[#a1a1aa] text-xs">0.9.2 · Sprint 2</p>
          </div>
          <span className="text-[#a1a1aa] text-xs border border-[#26262e] px-2 py-0.5 rounded-full">beta</span>
        </div>
        <ItemSeta titulo="Time" desc="Asaf, Pablo, Sara, Marcela, Ket, Júlia" />
        <ItemSeta titulo="Feito para" desc="mostra da escola · 3 meses de amor" />
      </Secao>

      {/* Sair */}
      <button className="w-full bg-[#0a0a0c] border border-[#16161b] rounded-2xl px-4 py-4 flex items-center justify-center gap-2 text-sm text-[#a1a1aa] hover:text-white transition mb-4">
        <LogOut size={16} />
        Sair da conta
      </button>

      <p className="text-[#26262e] text-xs text-center mb-6">STUDYOS · V0.9.2</p>

    </div>
  )
}

export default Configuracoes