import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

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
import Caverna from './pages/Caverna'
import EsqueciSenha from './pages/EsqueciSenha'
import NFC from './pages/NFC'

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

function AnimatedRoutes() {
  const location = useLocation()

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
        <Route path="/caverna" element={<PageWrapper><Caverna /></PageWrapper>} />
        <Route path="/esqueci-senha" element={<PageWrapper><EsqueciSenha /></PageWrapper>} />
        <Route path="/nfc" element={<PageWrapper><NFC /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  return (
    <BrowserRouter>
      <TopBar />
      <Navbar />
      <AnimatedRoutes />
    </BrowserRouter>
  )
}

export default App