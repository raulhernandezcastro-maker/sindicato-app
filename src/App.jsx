import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Toaster } from './components/ui/sonner';

// Pages
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { AvisosPage } from './pages/AvisosPage';
import { DocumentosPage } from './pages/DocumentosPage';
import { PerfilPage } from './pages/PerfilPage';
import { DashboardPage } from './pages/DashboardPage';
import { CuotasPage } from './pages/CuotasPage';
import { SociosPage } from './pages/SociosPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/avisos"
            element={
              <ProtectedRoute>
                <AvisosPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/documentos"
            element={
              <ProtectedRoute>
                <DocumentosPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <PerfilPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requireRole="director">
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/cuotas"
            element={
              <ProtectedRoute requireRole="director">
                <CuotasPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/socios"
            element={
              <ProtectedRoute requireRole="administrador">
                <SociosPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  );
}
