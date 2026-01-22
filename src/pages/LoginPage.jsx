import React, { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { LoginForm } from '../components/auth/LoginForm'
import { ForgotPasswordForm } from '../components/auth/ForgotPasswordForm'
import { useAuth } from '../contexts/AuthContext'

export function LoginPage() {
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Cargando…</p>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      {showForgotPassword ? (
        <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />
      ) : (
        <LoginForm onForgotPassword={() => setShowForgotPassword(true)} />
      )}
    </div>
  )
}
