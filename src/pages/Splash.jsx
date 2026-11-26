import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'

export default function Splash() {
  const installed = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true
  useEffect(() => {
    if (!installed) window.location.replace('/apresentacao/index.html')
  }, [installed])
  return installed ? <Navigate to="/login" replace /> : <a className="study-primary" href="/apresentacao/index.html">Conhecer o StudyOS</a>
}
