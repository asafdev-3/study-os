export const SCORE_AREAS = [['lc', 'Linguagens'], ['ch', 'Humanas'], ['cn', 'Natureza'], ['mt', 'Matemática'], ['red', 'Redação']]
export const normalizePlace = text => String(text ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim()
export function parseScores(values) {
  const scores = SCORE_AREAS.map(([id]) => {
    const text = String(values[id] ?? '').trim().replace(',', '.')
    return /^\d{1,4}(\.\d{1,2})?$/.test(text) ? Number(text) : NaN
  })
  return scores.every(n => Number.isFinite(n) && n >= 0 && n <= 1000) ? scores : null
}
export function compareOffer(offer, scores) {
  const weighted = scores.reduce((sum, score, index) => sum + score * offer.weights[index], 0) / offer.weights.reduce((sum, w) => sum + w, 0)
  const meetsMinimums = scores[4] > 0 && scores.every((score, index) => score >= offer.minimums[index]) && weighted >= offer.minimum
  return { weighted, meetsMinimums, reaches: meetsMinimums && weighted >= offer.cutoff }
}
