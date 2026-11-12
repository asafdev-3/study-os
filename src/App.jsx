import { createBrowserRouter, RouterProvider, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { lazy, Suspense, useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { readPreferences } from './lib/preferences'
import { StudyMotion, PageMotion } from './components/StudyMotion'
import { loadStudyRoute, warmStudyRoutes } from './lib/studyRoutes'

import { pendingDestination, clearDestination } from './lib/nfc'
import Splash from './pages/Splash'
import Login from './pages/Login'
import TopBar from './components/TopBar'
import Navbar from './components/Navbar'
import PaywallModal from './components/PaywallModal'
import './components/glass.css'

const Lock = lazy(() => import('./pages/Lock'))
const Dashboard = lazy(loadStudyRoute['/dashboard'])
const Anotacoes = lazy(loadStudyRoute['/anotacoes'])
const Chat = lazy(loadStudyRoute['/chat'])
const Lembretes = lazy(() => import('./pages/Lembretes'))
const Perfil = lazy(loadStudyRoute['/perfil'])
const Configuracoes = lazy(loadStudyRoute['/configuracoes'])
const Upgrade = lazy(() => import('./pages/Upgrade'))
const Sucesso = lazy(() => import('./pages/Sucesso'))
const EsqueciSenha = lazy(() => import('./pages/EsqueciSenha'))
const NFC = lazy(loadStudyRoute['/nfc'])
const NovaAnotacao = lazy(() => import('./pages/NovaAnotacao'))
const EnemScreen = lazy(loadStudyRoute['/enem'])
const Onboarding = lazy(() => import('./pages/Onboarding'))

const oauthReturn = new URLSearchParams(window.location.search).has('code')
  || new URLSearchParams(window.location.hash.slice(1)).has('access_token')

function TelaCarregando() {
  return <div className="study-loading" role="status">Carregando StudyOS…</div>
}

const ROTAS_PUBLICAS = ['/', '/login', '/upgrade', '/esqueci-senha']

// Rotas sem sidebar desktop (públicas + onboarding)
const SEM_SIDEBAR = ['/', '/login', '/upgrade', '/sucesso', '/esqueci-senha', '/onboarding', '/lock']

function PageWrapper({ children }) {
  return <PageMotion>{children}</PageMotion>
}

function DashboardEntry() {
  const [destination] = useState(pendingDestination)
  useEffect(() => { clearDestination() }, [])
  return destination ? <Navigate to={destination} replace /> : <Dashboard />
}

function AppRoutes({ sessao, bloqueado, desbloquear }) {
  const location = useLocation()
  const publica = ROTAS_PUBLICAS.includes(location.pathname)

  if (sessao && bloqueado && location.pathname !== '/lock') {
    return <Navigate to="/lock" replace state={{ destino: publica ? '/dashboard' : location.pathname + location.search }} />
  }

  if (sessao && ['/', '/login'].includes(location.pathname)) {
    return <Navigate to="/dashboard" replace />
  }

  if (!sessao && !publica) {
    return <Navigate to="/login" replace state={{ destino: location.pathname + location.search }} />
  }

  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={<PageWrapper><Splash /></PageWrapper>} />
      <Route path="/login" element={<Login />} />
      <Route path="/lock" element={<Lock onUnlock={desbloquear} />} />
      <Route path="/dashboard" element={<PageWrapper><DashboardEntry /></PageWrapper>} />
      <Route path="/anotacoes" element={<PageWrapper><Anotacoes /></PageWrapper>} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/lembretes" element={<PageWrapper><Lembretes /></PageWrapper>} />
      <Route path="/perfil" element={<PageWrapper><Perfil /></PageWrapper>} />
      <Route path="/configuracoes/:secao?" element={<PageWrapper><Configuracoes /></PageWrapper>} />
      <Route path="/upgrade" element={<PageWrapper><Upgrade /></PageWrapper>} />
      <Route path="/sucesso" element={<PageWrapper><Sucesso /></PageWrapper>} />
      <Route path="/esqueci-senha" element={<PageWrapper><EsqueciSenha /></PageWrapper>} />
      <Route path="/nfc" element={<PageWrapper><NFC /></PageWrapper>} />
      <Route path="/nova-anotacao" element={<NovaAnotacao />} />
      <Route path="/enem" element={<PageWrapper><EnemScreen userId={sessao?.user.id} /></PageWrapper>} />
      <Route path="/onboarding" element={<Onboarding />} />
    </Routes>
  )
}

function AppContent({ sessao, bloqueado, desbloquear }) {
  const userId = sessao?.user.id
  useEffect(() => {
    if (!userId || bloqueado) return
    return warmStudyRoutes()
  }, [userId, bloqueado])
  const location = useLocation()
  const comSidebar = !!sessao && !bloqueado && !SEM_SIDEBAR.includes(location.pathname)

  return (
    <>
      {comSidebar && <TopBar />}
      {comSidebar && <Navbar />}
      {comSidebar && <PaywallModal />}
      <div style={{ paddingLeft: comSidebar ? undefined : 0 }} className={comSidebar && location.pathname !== '/dashboard' ? 'md:pl-[88px]' : ''}>
        <Suspense fallback={<TelaCarregando />}>
          <AppRoutes sessao={sessao} bloqueado={bloqueado} desbloquear={desbloquear} />
        </Suspense>
      </div>
    </>
  )
}

function StudySession() {
  useEffect(() => {
    document.documentElement.dataset.studyMotion = readPreferences().reduceMotion ? 'reduced' : 'system'
  }, [])

  const [auth, setAuth] = useState({ session: undefined, locked: false })

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setAuth((previous) => {
        if (event === 'INITIAL_SESSION') return { session, locked: Boolean(session) && !oauthReturn && readPreferences().lock }
        if (previous.session === undefined) return previous
        return { session, locked: Boolean(session) && previous.locked }
      })
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!auth.session?.user.id) return
    let hiddenAt = null
    function onVisibility() {
      if (document.hidden) {
        hiddenAt = Date.now()
      } else {
        if (hiddenAt !== null && Date.now() - hiddenAt >= 60_000 && readPreferences().lock) {
          setAuth((previous) => previous.session ? { ...previous, locked: true } : previous)
        }
        hiddenAt = null
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [auth.session?.user.id])

  function desbloquear() {
    setAuth((previous) => ({ ...previous, locked: false }))
  }

  if (auth.session === undefined) return <TelaCarregando />

  return <AppContent key={auth.session?.user.id ?? 'visitante'} sessao={auth.session}
    bloqueado={auth.locked} desbloquear={desbloquear} />
}

const router = createBrowserRouter([{ path: '*', element: <StudySession /> }])

export default function App() {
  return <StudyMotion><RouterProvider router={router} /></StudyMotion>
}
