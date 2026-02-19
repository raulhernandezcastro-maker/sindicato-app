import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function ProtectedRoute({ allow, children }) {
  const { user, loading, isAdministrador, isDirector } = useAuth()

  if (loading) {
    return null
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // 🔑 Rol efectivo (jerarquía clara)
  let effectiveRole = 'socio'

  if (isAdministrador) {
    effectiveRole = 'admin'
  } else if (isDirector) {
    effectiveRole = 'director'
  }

  if (!allow.includes(effectiveRole)) {
    return <Navigate to="/" replace />
  }

  return children
}
