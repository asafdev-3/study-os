export function KiraAvatar({ size = 64, hero = false }) {
  return (
    <span className={'study-kira-character' + (hero ? ' study-kira-character--hero' : '')}
      style={{ '--kira-size': size + 'px' }} aria-hidden="true">
      <img src="/apresentacao/kira-avatar.webp" alt="" width="420" height="280" draggable="false" />
      <i className="kira-lid kira-lid-left" /><i className="kira-lid kira-lid-right" />
    </span>
  )
}
