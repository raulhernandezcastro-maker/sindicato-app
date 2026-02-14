import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { DashboardPage } from './pages/DashboardPage'
import CuotasPage from './pages/CuotasPage'
import { SociosPage } from './pages/SociosPage'

import { AppLayout } from './components/layout/AppLayout'
import { useAuth } from './contexts/AuthContext'

function ProtectedLayout({ children }) {
  const { loading, user } = useAuth()

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />

  return <AppLayout>{children}</AppLayout>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedLayout>
              <DashboardPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/cuotas"
          element={
            <ProtectedLayout>
              <CuotasPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/socios"
          element={
            <ProtectedLayout>
              <SociosPage />
            </ProtectedLayout>
          }
        />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
