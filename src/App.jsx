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
import TopBar from './components/TopBar'
import Navbar from './components/Navbar'

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
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  return (
    <BrowserRouter>
      <TopBar />
      <Navbar />        {/* fora do AnimatePresence — nunca some */}
      <AnimatedRoutes />
    </BrowserRouter>
  )
}

export default App