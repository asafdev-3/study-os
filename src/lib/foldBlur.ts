/** Temporary, opt-in edge blur for viewport width/posture changes.
 * Uses Viewport Segments and Device Posture when available, with resize fallback.
 * No persistent compositing layers, no React renders per frame.
 */
type Segment = { left:number; top:number; width:number; height:number }
type WindowWithSegments = Window & { getWindowSegments?:()=>Segment[] }
export function installFoldBlur():()=>void {
  // Most browsers (including iOS Safari) expose neither fold posture nor
  // viewport segments. Avoid keeping a global resize listener there.
  if (!("getWindowSegments" in window) && !window.matchMedia?.('(device-posture: folded)').matches) {
    return () => {}
  }
  let previousWidth=window.innerWidth
  let overlay:HTMLDivElement|null=null
  let current:Animation|null=null
  const posture=window.matchMedia?.('(device-posture: folded)')
  const screenSegments=()=>{
    try { return (window as WindowWithSegments).getWindowSegments?.().length ?? 1 }
    catch { return 1 }
  }
  let oldSegments=screenSegments()
  function clear() { current?.cancel();overlay?.remove();overlay=null;current=null }
  function trigger(force=false) {
    const width=window.innerWidth
    const segments=screenSegments()
    const meaningful=force || Math.abs(width-previousWidth)>45 || segments!==oldSegments
    previousWidth=width
    oldSegments=segments
    if (!meaningful || document.visibilityState==='hidden'
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches
      || window.matchMedia('(prefers-reduced-transparency: reduce)').matches
      || document.documentElement.dataset.studyMotion==='reduced') return
    clear()
    const veil=document.createElement('div')
    veil.className='study-fold-resize'
    veil.setAttribute('aria-hidden','true')
    document.body.append(veil)
    overlay=veil
    current=veil.animate([
      {opacity:0,transform:'perspective(1100px) rotateY(-1.2deg)'},
      {opacity:.75,offset:.35,transform:'perspective(1100px) rotateY(0deg)'},
      {opacity:0,transform:'none'},
    ],{duration:250,easing:'cubic-bezier(.22,1,.36,1)'})
    void current.finished.then(clear,()=>{})
  }
  const onResize=()=>trigger()
  const onPosture=()=>trigger(true)
  window.addEventListener('resize',onResize,{passive:true})
  posture?.addEventListener?.('change',onPosture)
  return ()=>{window.removeEventListener('resize',onResize);posture?.removeEventListener?.('change',onPosture);clear()}
}
