import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function NativeSession() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  useEffect(() => {
    let mounted = true
    async function receive(event) {
      const { access_token, refresh_token } = event.detail || {}
      if (typeof access_token !== 'string' || typeof refresh_token !== 'string') return
      const { error: authError } = await supabase.auth.setSession({ access_token, refresh_token })
      if (!mounted) return
      if (authError) setError('A sessão expirou. Volte e entre novamente.')
      else navigate('/dashboard', { replace: true })
    }
    if (!window.ReactNativeWebView) { navigate('/login', { replace: true }); return }
    window.addEventListener('studyos-native-session', receive)
    window.ReactNativeWebView.postMessage('STUDYOS_READY')
    return () => { mounted = false; window.removeEventListener('studyos-native-session', receive) }
  }, [navigate])
  return <main className="study-loading" role="status">{error || 'Preparando StudyOS…'}</main>
}
