import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { ForgotPasswordForm } from '../components/auth/ForgotPasswordForm';
import { useAuth } from '../contexts/AuthContext';
import { Spinner } from '../components/ui/spinner';

export function LoginPage() {
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { user, loading } = useAuth();

  console.log('LoginPage: Rendering, user:', user?.id, 'loading:', loading);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (user) {
    console.log('LoginPage: User is authenticated, redirecting to home');
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      {showForgotPassword ? (
        <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />
      ) : (
        <LoginForm onForgotPassword={() => setShowForgotPassword(true)} />
      )}
    </div>
  );
}
