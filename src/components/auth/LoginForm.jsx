import React, { useState } from 'react'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Alert } from '../ui/alert'
import { useAuth } from '../../contexts/AuthContext'

export function LoginForm({ onForgotPassword }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { signIn } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
    } catch (err) {
      const msg = err.message?.includes('dada de baja')
        ? err.message
        : 'Credenciales incorrectas. Verifica tu email y contraseña.'
      setError(msg)
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-md overflow-hidden">

      {/* Cabecera verde */}
      <div className="px-6 py-4" style={{ backgroundColor: '#2d7a4f' }}>
        <h3 className="text-white text-lg font-bold text-center">Iniciar Sesión</h3>
      </div>

      {/* Formulario */}
      <div className="px-6 py-6 space-y-4">
        {error && <Alert variant="destructive">{error}</Alert>}

        <div>
          <Label className="text-sm font-semibold" style={{ color: '#2d7a4f' }}>Email</Label>
          <Input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
            className="mt-1 focus:ring-2"
            style={{ borderColor: '#2d7a4f' }}
          />
        </div>

        <div>
          <Label className="text-sm font-semibold" style={{ color: '#2d7a4f' }}>Contraseña</Label>
          <Input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="mt-1"
            style={{ borderColor: '#2d7a4f' }}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-2.5 rounded-lg text-white font-semibold text-sm transition-opacity disabled:opacity-60"
          style={{ backgroundColor: '#2d7a4f' }}
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>

        <div className="text-center pt-1">
          <button
            onClick={onForgotPassword}
            className="text-sm underline"
            style={{ color: '#2d7a4f' }}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        {/* WhatsApp help link */}
        
          href="https://wa.me/56932076628?text=Hola%2C%20no%20puedo%20ingresar%20a%20la%20app%20del%20Sindicato.%20Mi%20nombre%20es%3A%20"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 w-full rounded-xl px-4 py-3 transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', textDecoration: 'none' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="28" height="28" fill="#25D366" style={{ flexShrink: 0 }}>
            <path d="M16 0C7.163 0 0 7.163 0 16c0 2.833.738 5.494 2.031 7.807L0 32l8.418-2.007A15.934 15.934 0 0016 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.333a13.27 13.27 0 01-6.784-1.856l-.486-.288-5.002 1.194 1.217-4.878-.317-.501A13.267 13.267 0 012.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.27-9.862c-.398-.199-2.354-1.162-2.719-1.294-.365-.133-.631-.199-.897.199-.265.398-1.03 1.294-1.263 1.56-.232.265-.465.298-.863.1-.398-.199-1.682-.62-3.204-1.977-1.184-1.057-1.983-2.362-2.215-2.76-.232-.398-.025-.613.174-.811.179-.178.398-.465.597-.697.199-.232.265-.398.398-.664.133-.265.066-.497-.033-.697-.1-.199-.897-2.162-1.229-2.96-.324-.778-.653-.672-.897-.684l-.764-.013c-.265 0-.697.1-1.063.497-.365.398-1.394 1.362-1.394 3.325s1.427 3.856 1.626 4.122c.199.265 2.808 4.288 6.803 6.016.951.41 1.693.655 2.272.839.954.304 1.823.261 2.51.158.765-.114 2.354-.962 2.686-1.892.332-.93.332-1.727.232-1.892-.099-.166-.365-.265-.763-.464z"/>
          </svg>
          <div>
            <p className="text-sm font-bold leading-tight" style={{ color: '#15803d' }}>
              ¿No puedes ingresar?
            </p>
            <p className="text-xs leading-tight" style={{ color: '#16a34a' }}>
              Toca aquí para contactarnos por WhatsApp
            </p>
          </div>
        </a>
      </div>
    </div>
  )
}
