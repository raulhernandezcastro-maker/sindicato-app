import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { AppLayout } from './components/layout/AppLayout'
import RequireRole from './components/auth/RequireRole'

// PÁGINAS – NAMED EXPORTS
import { DashboardPage } from './pages/DashboardPage'
import { AvisosPage } from './pages/AvisosPage'
import { DocumentosPage } from './pages/DocumentosPage'
import { PerfilPage } from './pages/PerfilPage'
import { SociosPage } from './pages/SociosPage'

// PÁGINAS – DEFAULT EXPORTS
import CuotasPage from './pages/CuotasPage'
import LoginPage from './pages/LoginPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* LOGIN */}
        <Route path="/login" element={<LoginPage />} />

        {/* APP */}
        <Route element={<AppLayout />}>
          {/* SOCIO */}
          <Route path="/" element={<AvisosPage />} />
          <Route path="/avisos" element={<AvisosPage />} />
          <Route path="/documentos" element={<DocumentosPage />} />
          <Route path="/perfil" element={<PerfilPage />} />

          {/* DIRECTOR + ADMIN */}
          <Route
            path="/dashboard"
            element={
              <RequireRole allow={['director', 'administrador']}>
                <DashboardPage />
              </RequireRole>
            }
          />

          <Route
            path="/cuotas"
            element={
              <RequireRole allow={['director', 'administrador']}>
                <CuotasPage />
              </RequireRole>
            }
          />

          {/* SOLO ADMIN */}
          <Route
            path="/socios"
            element={
              <RequireRole allow={['administrador']}>
                <SociosPage />
              </RequireRole>
            }
          />
        </Route>

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
