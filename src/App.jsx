import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Layout
import { AppLayout } from './components/layout/AppLayout'

// Guards
import { RequireRole } from './components/auth/RequireRole'

// Pages (TODAS con named export)
import { DashboardPage } from './pages/DashboardPage'
import { AvisosPage } from './pages/AvisosPage'
import { DocumentosPage } from './pages/DocumentosPage'
import { PerfilPage } from './pages/PerfilPage'
import { SociosPage } from './pages/SociosPage'
import { LoginPage } from './pages/LoginPage'

// Cuotas es la ÚNICA con default export
import CuotasPage from './pages/CuotasPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* LOGIN */}
        <Route path="/login" element={<LoginPage />} />

        {/* APP CON LAYOUT */}
        <Route element={<AppLayout />}>

          {/* SOCIO (todos los roles) */}
          <Route path="/" element={<AvisosPage />} />
          <Route path="/avisos" element={<AvisosPage />} />
          <Route path="/documentos" element={<DocumentosPage />} />
          <Route path="/perfil" element={<PerfilPage />} />

          {/* DIRECTOR + ADMIN */}
          <Route
            path="/dashboard"
            element={
              <RequireRole rolesPermitidos={['director', 'administrador']}>
                <DashboardPage />
              </RequireRole>
            }
          />

          <Route
            path="/cuotas"
            element={
              <RequireRole rolesPermitidos={['director', 'administrador']}>
                <CuotasPage />
              </RequireRole>
            }
          />

          {/* SOLO ADMIN */}
          <Route
            path="/socios"
            element={
              <RequireRole rolesPermitidos={['administrador']}>
                <SociosPage />
              </RequireRole>
            }
          />

        </Route>

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
