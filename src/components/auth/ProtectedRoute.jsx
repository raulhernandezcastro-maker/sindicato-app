import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function ProtectedRoute({ allow, children }) {
  const { loading, isAdministrador, isDirector, isSocio } = useAuth()

  if (loading) {
    return null // o spinner si quieres
  }

  const roleMap = {
    administrador: isAdministrador,
    director: isDirector,
    socio: isSocio,
  }

  const hasAccess = allow.some(role => roleMap[role])

  if (!hasAccess) {
    return <Navigate to="/" replace />
  }

  return children
}
