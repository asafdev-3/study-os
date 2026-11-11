export const FOCUS_SECONDS = 25 * 60
const areas = new Set(['lc', 'ch', 'cn', 'mt', 'red'])

export function readFocus(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key))
    if (value?.id && areas.has(value.areaId)
      && Number.isFinite(value.seconds) && value.seconds >= 0 && value.seconds <= FOCUS_SECONDS
      && (value.deadline === null || Number.isFinite(value.deadline))) return value
  } catch { /* O timer pode funcionar sem armazenamento. */ }
  return null
}
