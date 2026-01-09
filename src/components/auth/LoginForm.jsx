import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Alert } from '../ui/alert';
import { useAuth } from '../../contexts/AuthContext';

export function LoginForm({ onForgotPassword }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  console.log('LoginForm: Component rendered');

  const handleSubmit = async (e) => {
    e.preventDefault();
    // 🔐 ACCESO TEMPORAL ADMIN (BORRAR DESPUÉS)
if (email === 'admin@sindicato.cl' && password === 'admin123456') {
  localStorage.setItem(
    'tempAdmin',
    JSON.stringify({
      id: 'temp-admin',
      email: email,
      roles: ['socio', 'administrador'],
    })
  );

  window.location.href = '/';
  return;
}
    setError('');
    setLoading(true);

    console.log('LoginForm: Attempting login with email:', email);

    try {
      const { data, error } = await signIn(email, password);

      if (error) {
        console.error('LoginForm: Login failed:', error);
        setError('Credenciales incorrectas. Por favor, verifica tu correo y contraseña.');
        setLoading(false);
        return;
      }

      console.log('LoginForm: Login successful');
    } catch (error) {
      console.error('LoginForm: Exception during login:', error);
      setError('Error al iniciar sesión. Por favor, intenta nuevamente.');
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Sindicato de Trabajadores
        </CardTitle>
        <CardDescription className="text-center">
          Ingresa tus credenciales para acceder
        </CardDescription>
      </CardHeader>
      <CardContent>
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

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button
          variant="link"
          onClick={onForgotPassword}
          disabled={loading}
        >
          ¿Olvidaste tu contraseña?
        </Button>
      </CardFooter>
    </Card>
  );
}
