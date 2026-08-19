// App.jsx — define as rotas da aplicação
// Cada rota corresponde a uma tela do StudyOS

import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Dashboard from './pages/Dashboard'
import Anotacoes from './pages/Anotacoes'
import Chat from './pages/Chat'
import Lembretes from './pages/Lembretes'
import Perfil from './pages/Perfil'
import Configuracoes from './pages/Configuracoes'
import Login from './pages/Login'
import Lock from './pages/Lock'
import Splash from './pages/Splash'
import Configuracoes from './pages/Configuracoes'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/anotacoes" element={<Anotacoes />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/lembretes" element={<Lembretes />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
        <Route path="/lock" element={<Lock />} />
        <Route path="/" element={<Splash />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App