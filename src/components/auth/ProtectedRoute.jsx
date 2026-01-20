import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Spinner } from '../ui/spinner'

export function ProtectedRoute({ children, requireRole }) {
  const { user, loading, hasRole } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requireRole) {
    const allowed = hasRole(requireRole) || hasRole('administrador')
    if (!allowed) return <Navigate to="/" replace />
  }

  return children
}
