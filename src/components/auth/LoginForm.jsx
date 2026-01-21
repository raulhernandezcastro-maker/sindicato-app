import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card'
import { Alert } from '../ui/alert'
import { useAuth } from '../../contexts/AuthContext'

export function LoginForm({ onForgotPassword }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signIn(email, password)
    } catch (err) {
      setError('Credenciales incorrectas')
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Iniciar sesión</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert variant="destructive">{error}</Alert>}

          <div>
            <Label>Email</Label>
            <Input value={email} onChange={e => setEmail(e.target.value)} required />
          </div>

          <div>
            <Label>Password</Label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          <Button className="w-full" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex justify-center">
        <Button variant="link" onClick={onForgotPassword}>
          ¿Olvidaste tu contraseña?
        </Button>
      </CardFooter>
    </Card>
  )
}
