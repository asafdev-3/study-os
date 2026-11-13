import { useState } from 'react'
import { createPortal } from 'react-dom'
import { m } from 'framer-motion'
import { useStudyReducedMotion } from '../lib/motion'

function Blur() {
  const [finished, setFinished] = useState(false)
  if (finished) return null
  return createPortal(<m.div className="study-route-blur" aria-hidden="true"
    initial={{ opacity: 1 }} animate={{ opacity: 0 }}
    transition={{ duration: .24, ease: [.22, 1, .36, 1] }}
    onAnimationComplete={() => setFinished(true)} />, document.body)
}

// Kept as an export alias to preserve existing route integration.
export function FoldableTransition({ screen }) {
  const reduced = useStudyReducedMotion()
  return reduced ? null : <Blur key={screen} />
}
