import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Spinner } from '../ui/spinner';

export function ProtectedRoute({ children, requireRole }) {
  const { user, loading, hasRole } = useAuth();

  console.log('ProtectedRoute: Checking access, loading:', loading, 'user:', user?.id, 'requireRole:', requireRole);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (!user) {
    console.log('ProtectedRoute: No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (requireRole) {
    const hasAccess = hasRole(requireRole) || hasRole('administrador');
    if (!hasAccess) {
      console.log('ProtectedRoute: User does not have required role:', requireRole);
      return <Navigate to="/" replace />;
    }
  }

  console.log('ProtectedRoute: Access granted');
  return children;
}
