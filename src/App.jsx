import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { AppLayout } from './components/layout/AppLayout'

// Páginas
import { DashboardPage } from './pages/DashboardPage'
import CuotasPage from './pages/CuotasPage'
import { SociosPage } from './pages/SociosPage'

// Estas páginas pueden ser simples por ahora
import AvisosPage from './pages/AvisosPage'
import DocumentosPage from './pages/DocumentosPage'
import PerfilPage from './pages/PerfilPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Todas las páginas internas usan AppLayout */}
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
