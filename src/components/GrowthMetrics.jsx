import { useEffect } from 'react'
import { useMetricsChoice, setMetricsChoice, recordMetrics } from '../lib/growthMetrics'
import './GrowthMetrics.css'

export default function GrowthMetrics({ path, mode }) {
  const choice = useMetricsChoice()
  useEffect(() => { recordMetrics(path, mode) }, [path, mode, choice])
  if (choice !== null) return null
  return <aside className="growth-consent" aria-label="Métricas opcionais">
    <div><strong>Ajude a melhorar o StudyOS</strong><small>Permita contagens de uso sem vincular sua conta, mensagens ou anotações. Opcional, sem publicidade personalizada.</small></div>
    <div className="growth-actions"><button type="button" onClick={() => setMetricsChoice('no')}>Não permitir</button><button type="button" onClick={() => setMetricsChoice('yes')}>Permitir</button></div>
  </aside>
}
export function GrowthMetricsPreference() {
  const choice = useMetricsChoice()
  return <label className="study-settings-row">
    <span><strong>Métricas opcionais de uso</strong><small>Contagens sem vínculo com a conta. Desative quando quiser.</small></span>
    <input type="checkbox" checked={choice === 'yes'} onChange={event => setMetricsChoice(event.target.checked ? 'yes' : 'no')} />
  </label>
}
