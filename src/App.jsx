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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/anotacoes" element={<Anotacoes />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/lembretes" element={<Lembretes />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App