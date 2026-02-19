import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function ProtectedRoute({ allow, children }) {
  const { user, loading, isAdministrador, isDirector } = useAuth()

  if (loading) {
    return null // o spinner si quieres
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const roleMap = {
    admin: isAdministrador,
    director: isDirector,
    socio: !isAdministrador && !isDirector,
  }

  const isAllowed = allow.some(role => roleMap[role])

  if (!isAllowed) {
    return <Navigate to="/" replace />
  }

  return children
}
