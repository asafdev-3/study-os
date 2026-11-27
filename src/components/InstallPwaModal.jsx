import { useEffect, useState } from 'react'
import { Download, Share, PlusSquare, X } from 'lucide-react'
import './InstallPwaModal.css'

const SEEN_KEY = 'studyos:pwa-install-seen-v2'
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true
const isIosDevice = () => /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1)
function seen(){try{return localStorage.getItem(SEEN_KEY)==='1'}catch{return true}}
function remember(){try{localStorage.setItem(SEEN_KEY,'1')}catch{/* no storage */}}

export default function InstallPwaModal({auto}) {
  const [deferredPrompt,setDeferredPrompt]=useState(()=>window.studyInstallPrompt)
  const [open,setOpen]=useState(false)
  const [details,setDetails]=useState(false)
  const [installing,setInstalling]=useState(false)
  const ios=isIosDevice()
  useEffect(()=>{
    let timer
    const eligible=()=>auto&&!isStandalone()&&!seen()&&(ios||/Android/i.test(navigator.userAgent)||window.studyInstallPrompt)
    const schedule=()=>{
      clearTimeout(timer)
      if(eligible()) timer=setTimeout(()=>{if(eligible()){remember();setDetails(false);setOpen(true)}},12000)
    }
    const manual=()=>{remember();setDetails(true);setOpen(true)}
    const ready=()=>{setDeferredPrompt(window.studyInstallPrompt);schedule()}
    const installed=()=>{remember();setDeferredPrompt(null);setOpen(false)}
    schedule()
    window.addEventListener('studyos:install',manual)
    window.addEventListener('studyos:install-ready',ready)
    window.addEventListener('appinstalled',installed)
    return()=>{clearTimeout(timer);window.removeEventListener('studyos:install',manual);window.removeEventListener('studyos:install-ready',ready);window.removeEventListener('appinstalled',installed)}
  },[auto,ios])
  useEffect(()=>{
    if(!open||details)return
    const timer=setTimeout(()=>setOpen(false),14000)
    return()=>clearTimeout(timer)
  },[open,details])
  function close(){remember();setOpen(false);setDetails(false)}
  async function installNow(){
    if(!deferredPrompt){setDetails(true);return}
    if(installing)return
    setInstalling(true)
    try{await deferredPrompt.prompt();await deferredPrompt.userChoice;close()}
    catch{setDetails(true)}
    finally{window.studyInstallPrompt=null;setDeferredPrompt(null);setInstalling(false)}
  }
  if(!open)return null
  return <aside className="study-install-banner" aria-label="Instalar StudyOS">
    <div className="study-install-head">
      <img src="/icons/icon-192.png" width="38" height="38" alt=""/>
      <div><strong>StudyOS</strong><p>{isStandalone()?'Já instalado neste dispositivo.':'Adicione à sua tela inicial.'}</p></div>
      <button className="study-install-close" type="button" onClick={close} aria-label="Fechar aviso de instalação"><X size={16}/></button>
    </div>
    {!isStandalone() && (!details||deferredPrompt) && <button type="button" className="study-install-action" onClick={installNow} disabled={installing}><Download size={15}/>{installing?'Instalando…':deferredPrompt?'Instalar':'Como instalar'}</button>}
    {details&&!deferredPrompt&&!isStandalone()&&(ios?<div className="study-install-steps"><p><Share size={16}/> Safari: toque em Compartilhar.</p><p><PlusSquare size={16}/> Adicionar à Tela de Início.</p></div>:<p className="study-install-steps">No menu do navegador, escolha Instalar aplicativo ou Adicionar à tela inicial.</p>)}
  </aside>
}
