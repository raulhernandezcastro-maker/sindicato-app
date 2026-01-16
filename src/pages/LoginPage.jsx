import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const { user, loading } = useAuth();

  console.log('LoginPage:', { user, loading });

  if (loading) {
    return <div style={{ padding: 50 }}>Cargando login...</div>;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <div>FORMULARIO LOGIN AQUÍ</div>;
}
