import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function ProtectedRoute({ children, requireRole }) {
  const { user, loading, hasRole } = useAuth();

  console.log('ProtectedRoute:', { user, loading });

  if (loading) {
    return <div style={{ padding: 50 }}>Cargando sesión...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireRole) {
    const hasAccess = hasRole(requireRole) || hasRole('administrador');
    if (!hasAccess) return <Navigate to="/" replace />;
  }

  return children;
}
