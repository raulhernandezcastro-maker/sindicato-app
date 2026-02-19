import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { AppLayout } from './components/layout/AppLayout'

// 📄 Páginas (TODAS con NAMED EXPORT)
import { DashboardPage } from './pages/DashboardPage'
import { AvisosPage } from './pages/AvisosPage'
import { DocumentosPage } from './pages/DocumentosPage'
import { PerfilPage } from './pages/PerfilPage'
import { SociosPage } from './pages/SociosPage'

// 📄 Cuotas es DEFAULT export
import CuotasPage from './pages/CuotasPage'

// 🔐 Login es DEFAULT export
import LoginPage from './pages/LoginPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* 🔐 LOGIN (sin layout) */}
        <Route path="/login" element={<LoginPage />} />

        {/* 🧱 LAYOUT PRINCIPAL */}
        <Route element={<AppLayout />}>
          {/* Inicio */}
          <Route path="/" element={<DashboardPage />} />

          {/* Socio */}
          <Route path="/avisos" element={<AvisosPage />} />
          <Route path="/documentos" element={<DocumentosPage />} />
          <Route path="/perfil" element={<PerfilPage />} />

          {/* Director / Admin */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/cuotas" element={<CuotasPage />} />

          {/* Admin */}
          <Route path="/socios" element={<SociosPage />} />
        </Route>

        {/* ❌ fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
