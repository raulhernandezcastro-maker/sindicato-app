import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import AppLayout from './components/layout/AppLayout'

// Páginas (TODAS default export)
import DashboardPage from './pages/DashboardPage'
import AvisosPage from './pages/AvisosPage'
import DocumentosPage from './pages/DocumentosPage'
import PerfilPage from './pages/PerfilPage'
import SociosPage from './pages/SociosPage'
import CuotasPage from './pages/CuotasPage'
import LoginPage from './pages/LoginPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login fuera del layout */}
        <Route path="/login" element={<LoginPage />} />

        {/* Layout principal */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/avisos" element={<AvisosPage />} />
          <Route path="/documentos" element={<DocumentosPage />} />
          <Route path="/perfil" element={<PerfilPage />} />
          <Route path="/cuotas" element={<CuotasPage />} />
          <Route path="/socios" element={<SociosPage />} />
        </Route>

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
