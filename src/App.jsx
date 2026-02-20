import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { AppLayout } from './components/layout/AppLayout'
import ProtectedRoute from './components/auth/ProtectedRoute'

// Páginas (default export)
import HomePage from './pages/HomePage'
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
        {/* Login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Layout principal */}
        <Route element={<AppLayout />}>
          {/* Público */}
          <Route path="/" element={<HomePage />} />
          <Route path="/avisos" element={<AvisosPage />} />
          <Route path="/documentos" element={<DocumentosPage />} />
          <Route path="/perfil" element={<PerfilPage />} />

          {/* Director / Administrador */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowDirector>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/cuotas"
            element={
              <ProtectedRoute allowDirector>
                <CuotasPage />
              </ProtectedRoute>
            }
          />

          {/* Solo Administrador */}
          <Route
            path="/socios"
            element={
              <ProtectedRoute allowAdmin>
                <SociosPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
