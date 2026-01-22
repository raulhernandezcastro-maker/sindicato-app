import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export function ProtectedRoute({ children, requireRole }) {
  const { user, loading, hasRole } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Cargando sesión…</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requireRole) {
    const hasAccess = hasRole(requireRole) || hasRole('administrador')
    if (!hasAccess) {
      return <Navigate to="/" replace />
    }
  }

  return children
}
