import kira from '../assets/kira-studyos.webp'

/** Original transparent character: depth without WebGL or continuous rendering. */
export function KiraAvatar({ size = 64, hero = false }) {
  return <span className={'study-kira-character' + (hero ? ' study-kira-character--hero' : '')} style={{ '--kira-size': `${size}px` }} aria-hidden="true">
    <img src={kira} alt="" width="420" height="280" decoding="async" draggable="false" />
  </span>
}
