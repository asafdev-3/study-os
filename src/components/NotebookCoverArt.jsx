import { coverDetails } from '../lib/coverRewards'

export default function NotebookCoverArt({ coverId, title = '', className = '' }) {
  const cover = coverDetails(coverId)
  const edition = typeof coverId === 'string' && /^\d{4}-\d{2}-\d{2}_/.test(coverId)
    ? coverId.slice(0, 10) : null
  const editionDays = edition ? Math.floor(Date.parse(edition + 'T12:00:00Z') / 86400000) : 0
  return <span
    className={`study-cover-art ${className}`}
    aria-hidden="true"
    data-motif={cover?.motif ?? 'default'}
    style={cover ? {
      '--cover-low': cover.colors[0],
      '--cover-mid': cover.colors[1],
      '--cover-high': cover.colors[2],
      '--cover-edition-hue': `${(editionDays * 13) % 48 - 24}deg`,
    } : undefined}
  >
    <span className="study-cover-art-shape" />
    <span className="study-cover-art-line" />
    {edition && <span className="study-cover-art-edition">EDIÇÃO {edition.slice(5).replace('-', '.')}</span>}
    <span className="study-cover-art-imprint">{cover?.name ?? 'STUDYOS'}</span>
    <span className="study-cover-art-title">{title}</span>
    {cover && <span className="study-cover-art-tagline">{cover.tagline}</span>}
  </span>
}
