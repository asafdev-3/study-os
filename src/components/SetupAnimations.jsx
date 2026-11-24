import { Radio, Smartphone, Share, Home } from 'lucide-react'

export function NfcAnimation() {
  return <div className="study-setup-animation" role="img" aria-label="Animação demonstrando um celular aproximando-se de uma etiqueta NFC"><div className="setup-nfc-phone"><Smartphone size={34} strokeWidth={1.3} /></div><span className="setup-nfc-wave" /><span className="setup-nfc-wave" /><span className="setup-nfc-wave" /><div className="setup-nfc-tag"><Radio size={25} strokeWidth={1.5} /></div><span className="study-setup-caption">Aproxime. Toque. Estude.</span></div>
}

export function InstallAnimation() {
  return <div className="study-setup-animation" role="img" aria-label="Animação demonstrando o StudyOS sendo adicionado à tela inicial do celular"><div className="setup-phone"><div className="setup-phone-screen"><div className="setup-app-icon"><Home size={21} /></div><span className="setup-home-dot" /></div><div className="setup-share"><Share size={17} /></div></div><span className="study-setup-caption">Adicionar à tela inicial</span></div>
}
