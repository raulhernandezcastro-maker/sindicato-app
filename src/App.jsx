import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Layout
import { AppLayout } from './components/layout/AppLayout'

// Guards
import ProtectedRoute from './components/auth/ProtectedRoute'

// Pages
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
          {/* Público */}
          <Route path="/" element={<HomePage />} />
          <Route path="/avisos" element={<AvisosPage />} />
          <Route path="/documentos" element={<DocumentosPage />} />
          <Route path="/perfil" element={<PerfilPage />} />

          {/* Director + Admin */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allow={['director', 'admin']}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/cuotas"
            element={
              <ProtectedRoute allow={['director', 'admin']}>
                <CuotasPage />
              </ProtectedRoute>
            }
          />

          {/* Solo Admin */}
          <Route
            path="/socios"
            element={
              <ProtectedRoute allow={['admin']}>
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
