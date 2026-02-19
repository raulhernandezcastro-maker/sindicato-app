import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

/**
 * rolesPermitidos: array de strings
 * ejemplo: ['administrador', 'director']
 */
export function RequireRole({ rolesPermitidos, children }) {
  const { user, roles, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Cargando…</p>
      </div>
    )
  }

  // No autenticado → login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // No tiene rol permitido → inicio
  const tienePermiso = roles.some(r => rolesPermitidos.includes(r))

  if (!tienePermiso) {
    return <Navigate to="/" replace />
  }

  return children
}
