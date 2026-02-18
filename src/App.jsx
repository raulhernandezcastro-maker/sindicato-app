import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'

import { AppLayout } from './components/layout/AppLayout'

// pages (named exports)
import { DashboardPage } from './pages/DashboardPage'
import { AvisosPage } from './pages/AvisosPage'
import { DocumentosPage } from './pages/DocumentosPage'
import { PerfilPage } from './pages/PerfilPage'
import { SociosPage } from './pages/SociosPage'
import { LoginPage } from './pages/LoginPage'

// default export
import CuotasPage from './pages/CuotasPage'

function ProtectedLayout() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Cargando…</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <AppLayout />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PÚBLICA */}
        <Route path="/login" element={<LoginPage />} />

        {/* PROTEGIDAS */}
        <Route element={<ProtectedLayout />}>
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
