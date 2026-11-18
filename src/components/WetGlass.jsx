import { useEffect, useRef } from 'react'

// The still beads are painted once, rather than animated each frame.
// Individual falling drops remain CSS animations in RainWindow.
function positionFraction(token) {
  if (token === 'left' || token === 'top') return 0
  if (token === 'right' || token === 'bottom') return 1
  if (token === 'center') return 0.5
  const n = Number.parseFloat(token)
  return Number.isFinite(n) && token?.endsWith('%') ? n / 100 : 0.5
}

function paintPane(canvas, photo) {
  if (!canvas || !photo?.naturalWidth) return
  const width = canvas.clientWidth
  const height = canvas.clientHeight
  if (!width || !height) return

  // Keep one static pane sharp, but cap pixels and droplets for older iPhones.
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(1800000 / (width * height)))
  canvas.width = Math.round(width * pixelRatio)
  canvas.height = Math.round(height * pixelRatio)
  const ctx = canvas.getContext('2d', { alpha: true })
  if (!ctx) return
  ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0)

  const fit = Math.max(width / photo.naturalWidth, height / photo.naturalHeight)
  // CSS object-position uses keywords too. parseFloat('center') was NaN,
  // which prevented canvas refraction from being drawn.
  const [xPosition = '50%', yPosition = '50%'] = getComputedStyle(photo).objectPosition.split(/\s+/)
  const cropX = (photo.naturalWidth - width / fit) * positionFraction(xPosition)
  const cropY = (photo.naturalHeight - height / fit) * positionFraction(yPosition)

  let seed = 1687
  function random() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }

  function bead(x, y, radius, tall = 1, rotation = 0) {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rotation)
    ctx.scale(radius, radius * tall)
    ctx.beginPath()
    ctx.moveTo(-0.91, -0.12)
    ctx.bezierCurveTo(-0.89, -0.75, -0.45, -1.02, 0.06, -0.97)
    ctx.bezierCurveTo(0.65, -1.01, 1.02, -0.55, 0.94, 0.13)
    ctx.bezierCurveTo(0.88, 0.83, 0.34, 1.05, -0.23, 0.97)
    ctx.bezierCurveTo(-0.81, 0.91, -1.03, 0.4, -0.91, -0.12)
    ctx.closePath()
    ctx.clip()

    if (radius > 1.4) {
      // Sample the same photo underneath each bead and invert it slightly;
      // this produces a true tiny lens instead of flat translucent circles.
      const sample = Math.min(Math.max(radius * 14, 18) / fit, photo.naturalWidth, photo.naturalHeight)
      const sx = Math.min(photo.naturalWidth - sample, Math.max(0, cropX + x / fit - sample / 2))
      const sy = Math.min(photo.naturalHeight - sample, Math.max(0, cropY + y / fit - sample / 2))
      ctx.save()
      ctx.scale(-1.08, -1.08)
      ctx.drawImage(photo, sx, sy, sample, sample, -1, -1, 2, 2)
      ctx.restore()
    } else {
      ctx.fillStyle = 'rgba(9, 18, 29, 0.30)'
      ctx.fillRect(-1, -1.1, 2, 2.2)
    }

    const shadow = ctx.createRadialGradient(0.03, 0.26, 0.08, 0, 0.02, 1.15)
    shadow.addColorStop(0, 'rgba(190, 210, 222, 0.02)')
    shadow.addColorStop(0.56, 'rgba(7, 19, 30, 0.07)')
    shadow.addColorStop(0.83, 'rgba(1, 9, 17, 0.47)')
    shadow.addColorStop(1, 'rgba(205, 226, 239, 0.32)')
    ctx.fillStyle = shadow
    ctx.fillRect(-1.05, -1.1, 2.1, 2.2)

    ctx.strokeStyle = 'rgba(6, 15, 23, 0.65)'
    ctx.lineWidth = 0.115
    ctx.stroke()
    ctx.beginPath()
    ctx.ellipse(-0.35, -0.54, 0.22, 0.12, -0.48, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(237, 247, 250, 0.66)'
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(0.13, 0.53, 0.54, 0.26, -0.22, 0, Math.PI)
    ctx.strokeStyle = 'rgba(202, 221, 229, 0.36)'
    ctx.lineWidth = 0.095
    ctx.stroke()
    ctx.restore()
  }

  const compact = width <= 760
  const total = Math.min(compact ? 740 : 1200, Math.ceil(width * height / (compact ? 520 : 1200)))
  for (let i = 0; i < total; i++) {
    const x = random() * width
    const y = random() * height
    const radius = 0.55 + Math.pow(random(), 3.2) * (compact ? 5.5 : 7.3)
    const tall = 0.87 + random() * (radius > 2.5 ? 0.75 : 0.35)
    bead(x, y, radius, tall, (random() - 0.5) * 0.28)
    if (radius > 3.8 && random() > 0.42) {
      bead(x + 4 + random() * 9, y - 5 - random() * 17, 0.6 + random() * 0.85)
    }
  }
}

export default function WetGlass({ photoRef }) {
  const pane = useRef(null)
  useEffect(() => {
    const canvas = pane.current
    const photo = photoRef.current
    if (!canvas || !photo) return undefined
    let frame = 0
    function schedule() {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => paintPane(canvas, photo))
    }
    const observer = new ResizeObserver(schedule)
    observer.observe(canvas)
    photo.addEventListener('load', schedule)
    schedule()
    return () => {
      observer.disconnect()
      photo.removeEventListener('load', schedule)
      cancelAnimationFrame(frame)
    }
  }, [photoRef])
  return <canvas ref={pane} className="rain-pane" />
}
