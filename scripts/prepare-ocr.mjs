import { mkdir, copyFile } from 'node:fs/promises'

const out = new URL('../public/ocr/', import.meta.url)
await mkdir(out, { recursive: true })
const files = {
  'worker.min.js': 'tesseract.js/dist/worker.min.js',
  'tesseract-core-lstm.wasm.js': 'tesseract.js-core/tesseract-core-lstm.wasm.js',
  'tesseract-core-simd-lstm.wasm.js': 'tesseract.js-core/tesseract-core-simd-lstm.wasm.js',
  'tesseract-core-relaxedsimd-lstm.wasm.js': 'tesseract.js-core/tesseract-core-relaxedsimd-lstm.wasm.js',
  'por.traineddata.gz': '@tesseract.js-data/por/4.0.0_best_int/por.traineddata.gz',
  'eng.traineddata.gz': '@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz',
}
await Promise.all(Object.entries(files).map(([name, source]) =>
  copyFile(new URL('../node_modules/' + source, import.meta.url), new URL(name, out))))
