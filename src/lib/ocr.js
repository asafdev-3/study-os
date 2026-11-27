// Keep the OCR engine out of the initial chat bundle.
export async function readPhoto(file, onProgress) {
  if (!file || !file.type.startsWith('image/')) throw new Error('Selecione uma imagem válida.')
  if (file.size > 20 * 1024 * 1024) throw new Error('Escolha uma foto de até 20 MB.')
  const url = URL.createObjectURL(file)
  let worker
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    const scale = Math.min(1, 2200 / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Não foi possível abrir a foto.')
    context.fillStyle = '#fff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const { createWorker } = await import('tesseract.js')
    const base = new URL('/ocr/', window.location.origin).href
    worker = await createWorker(['por', 'eng'], 1, {
      workerPath: base + 'worker.min.js',
      corePath: base,
      langPath: base,
      workerBlobURL: false,
      logger: ({ status, progress }) => {
        if (status === 'recognizing text') onProgress?.(Math.round(progress * 100))
      },
    })
    const { data } = await worker.recognize(canvas)
    const text = data.text.trim()
    if (!text) throw new Error('Nenhum texto encontrado. Tente uma foto mais nítida.')
    return text
  } finally {
    URL.revokeObjectURL(url)
    if (worker) await worker.terminate()
  }
}
