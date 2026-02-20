import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { AppLayout } from './components/layout/AppLayout'
import ProtectedRoute from './components/auth/ProtectedRoute'

// Páginas
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
        {/* Login fuera del layout */}
        <Route path="/login" element={<LoginPage />} />

        {/* Layout principal */}
        <Route element={<AppLayout />}>
          {/* Inicio: todos */}
          <Route path="/" element={<HomePage />} />

          {/* Avisos / Documentos / Perfil: todos */}
          <Route path="/avisos" element={<AvisosPage />} />
          <Route path="/documentos" element={<DocumentosPage />} />
          <Route path="/perfil" element={<PerfilPage />} />

          {/* Panel: Director y Administrador */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allow={['director', 'administrador']}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Cuotas: Director y Administrador */}
          <Route
            path="/cuotas"
            element={
              <ProtectedRoute allow={['director', 'administrador']}>
                <CuotasPage />
              </ProtectedRoute>
            }
          />

          {/* Gestión de Socios: SOLO Administrador */}
          <Route
            path="/socios"
            element={
              <ProtectedRoute allow={['administrador']}>
                <SociosPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
