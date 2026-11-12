import { m, useTransform } from 'framer-motion'

const radii = [1, 2, 4, 8]

function BlurLayer({ angle, radius, index }) {
  const filter = useTransform(angle, value => `blur(${Math.min(1, Math.abs(value) / 50) * radius}px)`)
  const fade = 16 + index * 9
  const mask = `linear-gradient(to bottom, transparent ${fade}%, black 50%, transparent ${100 - fade}%)`
  return <m.div className="study-fold-blur-layer" style={{ backdropFilter: filter, WebkitBackdropFilter: filter, maskImage: mask, WebkitMaskImage: mask }} />
}

export function ProgressiveBlur({ angle }) {
  const opacity = useTransform(angle, [0, 50], [0, 1], { clamp: true })
  return <m.div className="study-fold-crease" style={{ opacity }}>
    {radii.map((radius, index) => <BlurLayer key={radius} angle={angle} radius={radius} index={index} />)}
  </m.div>
}
