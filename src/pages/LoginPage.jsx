import React, { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { LoginForm } from '../components/auth/LoginForm'
import { ForgotPasswordForm } from '../components/auth/ForgotPasswordForm'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#f0f9f2' }}>
        <p>Cargando…</p>
      </div>
    )
  }

  if (user) return <Navigate to="/" replace />

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4"
         style={{ backgroundColor: '#f0f9f2' }}>

      {/* Logo + nombre */}
      <div className="flex flex-col items-center mb-6">
        <img
          src="/logo.png"
          alt="Logo Sindicato"
          className="w-28 h-28 object-contain rounded-full shadow-lg mb-3"
          style={{ border: '3px solid #2d7a4f' }}
        />
        <h1 className="text-lg font-bold text-center leading-tight" style={{ color: '#2d7a4f' }}>
          Sindicato Interempresas
        </h1>
        <h2 className="text-lg font-bold text-center leading-tight" style={{ color: '#2d7a4f' }}>
          Liberty Seguros
        </h2>
      </div>

      {showForgotPassword ? (
        <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />
      ) : (
        <LoginForm onForgotPassword={() => setShowForgotPassword(true)} />
      )}
    </div>
  )
}
