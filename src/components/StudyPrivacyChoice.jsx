import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import './StudyPrivacyChoice.css'

export default function StudyPrivacyChoice({ userId }) {
  const [choice, setChoice] = useState(undefined)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    let active = true
    supabase.rpc('studyos_my_consents').then(({ data }) => {
      if (active) { setChoice(data ?? null); setOpen(false) }
    }).catch(() => { if (active) { setChoice(null); setOpen(false) } })
    return () => { active = false }
  }, [userId])

  async function save(analytics, marketing) {
    setSaving(true)
    const { error } = await supabase.rpc('studyos_set_my_consents', { p_analytics: analytics, p_marketing: marketing })
    if (!error) { setChoice({ analytics_consent: analytics, marketing_consent: marketing }); setOpen(false) }
    setSaving(false)
  }

  useEffect(() => {
    if (!choice?.analytics_consent) return
    const track = () => {
      if (document.visibilityState !== 'visible') return
      supabase.rpc('studyos_track_visit').then(({ error }) => { if (error) console.warn('[StudyOS] Atividade não registrada.', error.message) })
    }
    track()
    document.addEventListener('visibilitychange', track)
    return () => document.removeEventListener('visibilitychange', track)
  }, [choice, userId])

  if (choice === undefined) return null
  return <>
    <button className="study-privacy-reopen" onClick={() => setOpen((value) => !value)}>{choice ? 'Privacidade' : 'Configurar privacidade'}</button>
    {open && <aside className="study-privacy-choice" aria-label="Preferências de privacidade">
    <div><strong>Privacidade e personalização</strong><p>Com métricas, registramos os dias em que sua conta entra. Se autorizar novidades, seu email e frequência aparecerão no painel para campanhas. Isso não envia mensagens automaticamente.</p></div>
    <div className="study-privacy-actions"><button disabled={saving} onClick={() => save(false, false)}>Não permitir</button><button disabled={saving} onClick={() => save(true, false)}>Permitir métricas</button><button className="study-privacy-primary" disabled={saving} onClick={() => save(true, true)}>Métricas e novidades</button></div>
  </aside>}
  </>
}
