import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { AppLayout } from './components/layout/AppLayout'
import { RoleRoute } from './components/auth/RoleRoute'

// Páginas
import HomePage from './pages/HomePage'
import { DashboardPage } from './pages/DashboardPage'
import { AvisosPage } from './pages/AvisosPage'
import { DocumentosPage } from './pages/DocumentosPage'
import { PerfilPage } from './pages/PerfilPage'
import { SociosPage } from './pages/SociosPage'
import CuotasPage from './pages/CuotasPage'
import { LoginPage } from './pages/LoginPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* LOGIN */}
        <Route path="/login" element={<LoginPage />} />

        {/* ÁREA PROTEGIDA */}
        <Route element={<AppLayout />}>
          {/* Acceso general */}
          <Route path="/" element={<HomePage />} />
          <Route path="/avisos" element={<AvisosPage />} />
          <Route path="/documentos" element={<DocumentosPage />} />
          <Route path="/perfil" element={<PerfilPage />} />

          {/* Director + Admin */}
          <Route
            path="/dashboard"
            element={
              <RoleRoute allow={['director', 'administrador']}>
                <DashboardPage />
              </RoleRoute>
            }
          />

          <Route
            path="/cuotas"
            element={
              <RoleRoute allow={['director', 'administrador']}>
                <CuotasPage />
              </RoleRoute>
            }
          />

          {/* SOLO Admin */}
          <Route
            path="/socios"
            element={
              <RoleRoute allow={['administrador']}>
                <SociosPage />
              </RoleRoute>
            }
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
