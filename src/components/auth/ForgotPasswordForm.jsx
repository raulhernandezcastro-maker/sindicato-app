import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Alert } from '../ui/alert';
import { useAuth } from '../../contexts/AuthContext';

export function ForgotPasswordForm({ onBack }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  console.log('ForgotPasswordForm: Component rendered');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    console.log('ForgotPasswordForm: Requesting password reset for:', email);

    try {
      const { error } = await resetPassword(email);

      if (error) {
        console.error('ForgotPasswordForm: Password reset failed:', error);
        setError('Error al enviar el correo. Por favor, verifica tu dirección de correo.');
        setLoading(false);
        return;
      }

      console.log('ForgotPasswordForm: Password reset email sent successfully');
      setSuccess(true);
      setLoading(false);
    } catch (error) {
      console.error('ForgotPasswordForm: Exception during password reset:', error);
      setError('Error al enviar el correo. Por favor, intenta nuevamente.');
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Recuperar Contraseña
        </CardTitle>
        <CardDescription className="text-center">
          Ingresa tu correo electrónico para recibir instrucciones
        </CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <Alert className="mb-4">
            <p className="font-semibold">Correo enviado</p>
            <p className="text-sm mt-1">
              Revisa tu bandeja de entrada para restablecer tu contraseña.
            </p>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="mb-4">
                {error}
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.cl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar instrucciones'}
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button variant="link" onClick={onBack} disabled={loading}>
          Volver al inicio de sesión
        </Button>
      </CardFooter>
    </Card>
  );
}
