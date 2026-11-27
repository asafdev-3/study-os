import { useEffect, useState } from 'react'
import { demoExpiry, endDemo } from '../lib/demo'
import './DemoSession.css'

export default function DemoSession({session,onEnd}) {
  const [remaining,setRemaining] = useState(()=>Math.max(0,Math.ceil((demoExpiry(session)-Date.now())/1000)))
  const [ending,setEnding] = useState(false)
  const expiry=demoExpiry(session)
  useEffect(()=>{
    let ended=false
    const update=()=>{
      const seconds=Math.max(0,Math.ceil((expiry-Date.now())/1000))
      setRemaining(seconds)
      if(!seconds && !ended){ended=true;onEnd();void endDemo()}
    }
    update()
    const timer=setInterval(update,1000)
    document.addEventListener('visibilitychange',update)
    return ()=>{clearInterval(timer);document.removeEventListener('visibilitychange',update)}
  },[expiry,onEnd])
  const label=String(Math.floor(remaining/60)).padStart(2,'0')+':'+String(remaining%60).padStart(2,'0')
  async function leave(){
    setEnding(true)
    try { await endDemo() } finally { onEnd() }
  }
  return <aside className="study-demo-session" aria-label="Sessão de demonstração">
    <span className="study-demo-indicator" aria-hidden="true"/>
    <span>Visitante <time aria-label="Tempo restante">{label}</time></span>
    <button type="button" onClick={leave} disabled={ending}>{ending?'Saindo…':'Encerrar'}</button>
  </aside>
}
