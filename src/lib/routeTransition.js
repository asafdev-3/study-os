import { flushSync } from 'react-dom'
import { readPreferences } from './preferences'

const paths=['/dashboard','/anotacoes','/chat','/enem','/perfil','/configuracoes']
let cancelCurrent

function reduceMotion() {
  return readPreferences().reduceMotion
    || window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function transitionTo(change,nextIndex,prevIndex,target) {
  cancelCurrent?.()
  if (reduceMotion() || document.documentElement.hasAttribute('data-study-keyboard')) {
    change()
    return
  }
  const direction=nextIndex>=prevIndex?1:-1
  const root=document.documentElement
  if (typeof document.startViewTransition === 'function') {
    root.dataset.studyTransition='crossfade'
    root.style.setProperty('--study-crossfade-direction',String(direction))
    const transition=document.startViewTransition(() => flushSync(change))
    const cleanup=()=>{
      delete root.dataset.studyTransition
      root.style.removeProperty('--study-crossfade-direction')
      if (cancelCurrent===cancel) cancelCurrent=undefined
    }
    const cancel=()=>{ transition.skipTransition();cleanup() }
    cancelCurrent=cancel
    void transition.finished.then(cleanup,cleanup)
    return
  }

  // For browsers without View Transitions, retain a short outgoing animation
  // and React's existing incoming PageMotion. No permanent filters or layers.
  const content=target ?? document.querySelector('main') ?? document.querySelector('.study-page-enter')
  if (!content?.animate) { change();return }
  const original=content.style.willChange
  content.style.willChange='opacity, transform, filter'
  const frames=[
    { opacity:1, transform:'perspective(1200px) rotateY(0deg) scale(1)', filter:'none' },
    { opacity:.3, transform:`perspective(1200px) rotateY(${-2*direction}deg) scale(.985)`, filter:'blur(5px)' },
  ]
  const exit=content.animate(frames,{duration:135,easing:'cubic-bezier(.22,1,.36,1)',fill:'forwards'})
  let cancelled=false
  const cleanup=()=>{ cancelled=true;exit.cancel();content.style.willChange=original;if(cancelCurrent===cleanup)cancelCurrent=undefined }
  cancelCurrent=cleanup
  void exit.finished.then(()=>{if(cancelled)return;cleanup();change()},cleanup)
}
export function transitionRoute(path,change) {
  const index=value=>paths.findIndex(route=>value.startsWith(route))
  transitionTo(change,index(path),index(location.pathname))
}
