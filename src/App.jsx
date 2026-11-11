import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'

import Splash from './pages/Splash'
import Login from './pages/Login'
import Lock from './pages/Lock'
import Dashboard from './pages/Dashboard'
import Anotacoes from './pages/Anotacoes'
import Chat from './pages/Chat'
import Lembretes from './pages/Lembretes'
import Perfil from './pages/Perfil'
import Configuracoes from './pages/Configuracoes'
import Upgrade from './pages/Upgrade'
import Sucesso from './pages/Sucesso'
import TopBar from './components/TopBar'
import Navbar from './components/Navbar'
import EsqueciSenha from './pages/EsqueciSenha'
import NFC from './pages/NFC'
import NovaAnotacao from './pages/NovaAnotacao'
import EnemScreen from './pages/EnemScreen'
import Onboarding from './pages/Onboarding'
import './components/glass.css'

const ROTAS_PUBLICAS = ['/', '/login', '/upgrade', '/sucesso', '/esqueci-senha']

// Rotas sem sidebar desktop (públicas + onboarding)
const SEM_SIDEBAR = ['/', '/login', '/upgrade', '/sucesso', '/esqueci-senha', '/onboarding', '/lock']

function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  )
}

function AnimatedRoutes({ sessao }) {
  const location = useLocation()
  const publica = ROTAS_PUBLICAS.includes(location.pathname)

  if (!sessao && !publica) {
    return <Navigate to="/login" replace />
  }

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><Splash /></PageWrapper>} />
        <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
        <Route path="/lock" element={<PageWrapper><Lock /></PageWrapper>} />
        <Route path="/dashboard" element={<PageWrapper><Dashboard /></PageWrapper>} />
        <Route path="/anotacoes" element={<PageWrapper><Anotacoes /></PageWrapper>} />
        <Route path="/chat" element={<PageWrapper><Chat /></PageWrapper>} />
        <Route path="/lembretes" element={<PageWrapper><Lembretes /></PageWrapper>} />
        <Route path="/perfil" element={<PageWrapper><Perfil /></PageWrapper>} />
        <Route path="/configuracoes" element={<PageWrapper><Configuracoes /></PageWrapper>} />
        <Route path="/upgrade" element={<PageWrapper><Upgrade /></PageWrapper>} />
        <Route path="/sucesso" element={<PageWrapper><Sucesso /></PageWrapper>} />
        <Route path="/esqueci-senha" element={<PageWrapper><EsqueciSenha /></PageWrapper>} />
        <Route path="/nfc" element={<PageWrapper><NFC /></PageWrapper>} />
        <Route path="/nova-anotacao" element={<NovaAnotacao />} />
        <Route path="/enem" element={<EnemScreen />} />
        <Route path="/onboarding" element={<Onboarding />} />
      </Routes>
    </AnimatePresence>
  )
}

function AppContent({ sessao }) {
  const location = useLocation()
  const comSidebar = !SEM_SIDEBAR.includes(location.pathname)

  return (
    <>
      <TopBar />
      <Navbar />
      <div style={{ paddingLeft: comSidebar ? undefined : 0 }} className={comSidebar ? 'md:pl-[88px]' : ''}>
        <AnimatedRoutes sessao={sessao} />
      </div>
    </>
  )
}

function App() {
  const [sessao, setSessao] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessao(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessao(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (sessao === undefined) {
    return <div style={{ minHeight: '100vh', background: '#0a0a0a' }} />
  }

  return (
    <BrowserRouter>
      <AppContent sessao={sessao} />
    </BrowserRouter>
  )
}

export default App
