import { useEffect, useRef } from 'react'

// Render the beads once per image or pane size. Only the sliding drops need animation.
function paintPane(canvas, photo) {
  const { clientWidth: width, clientHeight: height } = canvas
  if (!width || !height || !photo.naturalWidth) return
  const scale = Math.min(window.devicePixelRatio || 1, width < 900 ? 1 : 1.5, 2000 / Math.max(width, height))
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0)

  const fit = Math.max(width / photo.naturalWidth, height / photo.naturalHeight)
  const position = getComputedStyle(photo).objectPosition.split(' ')
  const cropX = (photo.naturalWidth - width / fit) * parseFloat(position[0]) / 100
  const cropY = (photo.naturalHeight - height / fit) * parseFloat(position[1]) / 100
  let seed = 1687
  function random() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
  function drawDrop(x, y, radius) {
    const h = radius * (.87 + random() * .48)
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate((random() - .5) * .95)
    ctx.scale(radius, h)
    ctx.beginPath()
    ctx.moveTo(-.96, -.07)
    ctx.bezierCurveTo(-.93, -.62, -.53, -.99, .02, -1)
    ctx.bezierCurveTo(.66, -1.04, 1, -.45, .94, .17)
    ctx.bezierCurveTo(.89, 1.22, -.98, 1.32, -.96, -.07)
    ctx.closePath()
    ctx.clip()
    // Each bead acts as a tiny inverted lens on its own part of the park.
    const sample = Math.min((radius * 27 + 42) / fit, photo.naturalWidth, photo.naturalHeight)
    const sx = Math.min(photo.naturalWidth - sample, Math.max(0, cropX + x / fit - sample / 2))
    const sy = Math.min(photo.naturalHeight - sample, Math.max(0, cropY + y / fit - sample / 2))
    ctx.save()
    ctx.scale(-1, -1)
    ctx.drawImage(photo, sx, sy, sample, sample, -1, -1.15, 2, 2.3)
    ctx.restore()
    const rim = ctx.createRadialGradient(-.15, .3, .1, 0, .1, 1.1)
    rim.addColorStop(0, 'rgba(204,224,238,.14)')
    rim.addColorStop(.58, 'rgba(23,35,46,.15)')
    rim.addColorStop(.85, 'rgba(5,14,21,.67)')
    rim.addColorStop(1, 'rgba(172,186,197,.22)')
    ctx.fillStyle = rim
    ctx.fillRect(-1, -1.2, 2, 2.4)
    ctx.fillStyle = x > width * .62 ? 'rgba(255,218,159,.73)' : 'rgba(204,226,241,.56)'
    ctx.beginPath()
    ctx.ellipse(-.32, -.56, .21, .11, -.55, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(248,221,183,.45)'
    ctx.lineWidth = .1
    ctx.beginPath()
    ctx.ellipse(0, .04, .67, .74, 0, .56, 1.62)
    ctx.stroke()
    ctx.restore()
  }

  const count = Math.min(width < 900 ? 200 : 740, Math.ceil(width * height / 1650))
  for (let i = 0; i < count; i++) {
    const x = random() * width, y = random() * height
    const radius = .72 + Math.pow(random(), 3.6) * 7.8
    drawDrop(x, y, radius)
    if (radius > 3.5) {
      drawDrop(x + 4 + random() * 8, y - 3 - random() * 17, .66 + random() * 1.05)
    }
  }
}

export default function WetGlass({ photoRef }) {
  const pane = useRef(null)
  useEffect(() => {
    const canvas = pane.current
    const photo = photoRef.current
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
