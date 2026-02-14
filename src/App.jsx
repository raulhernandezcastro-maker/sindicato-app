import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { DashboardPage } from './pages/DashboardPage'
import CuotasPage from './pages/CuotasPage'
import { SociosPage } from './pages/SociosPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        <Route path="/cuotas" element={<CuotasPage />} />
        <Route path="/socios" element={<SociosPage />} />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
