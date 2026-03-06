import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from '../components/ui/card'
import { Spinner } from '../components/ui/spinner'
import { Badge } from '../components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../components/ui/table'
import { Button } from '../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Checkbox } from '../components/ui/checkbox'

// Normaliza RUT: sin puntos, sin guión, sin espacios, en minúsculas
// Ej: "12.345.678-9" → "123456789"
const normalizarRut = (rut) =>
  String(rut || '').replace(/\./g, '').replace(/-/g, '').trim().toLowerCase()

const EMPTY_FORM = {
  nombre: '',
  email: '',
  rut: '',
  password: '',
  roles: ['socio']
}

export default function SociosPage() {
  const [socios, setSocios] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    loadSocios()
  }, [])

  const loadSocios = async () => {
    setLoading(true)

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, nombre, email, rut')

    if (profilesError) {
      console.error('Error cargando socios:', profilesError)
      setLoading(false)
      return
    }

    const { data: roles } = await supabase
      .from('roles')
      .select('user_id, role_name')

    const joined = (profiles || []).map(p => ({
      ...p,
      roles: (roles || [])
        .filter(r => r.user_id === p.id)
        .map(r => r.role_name)
    }))

    setSocios(joined)
    setLoading(false)
  }

  const toggleRole = (role) => {
    // El rol socio es obligatorio y no se puede desmarcar
    if (role === 'socio') return
    setForm(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }))
  }

  const validateForm = () => {
    if (!form.nombre.trim()) return 'El nombre es obligatorio'
    if (!form.email.trim()) return 'El email es obligatorio'
    if (!form.rut.trim()) return 'El RUT es obligatorio'
    if (!form.password || form.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres'
    return null
  }

  const handleCreateSocio = async () => {
    setError('')
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)

    try {
      // Llamar a la Edge Function usando el cliente de Supabase
      // (maneja el JWT automáticamente)
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      const res = await fetch(`${supabaseUrl}/functions/v1/bright-service`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          nombre: form.nombre,
          email: form.email,
          rut: normalizarRut(form.rut),
          password: form.password,
          roles: form.roles,
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`)

      setOpen(false)
      setForm(EMPTY_FORM)
      await loadSocios()
    } catch (err) {
      setError(err.message || 'Error creando socio. Verifica que el RUT y email no estén duplicados.')
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setError('')
    setForm(EMPTY_FORM)
  }

  if (loading) {
    return <Spinner />
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Socios</h1>
        <Button onClick={() => { setError(''); setOpen(true) }}>+ Nuevo Socio</Button>
      </div>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>RUT</TableHead>
                <TableHead>Roles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {socios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                    No hay socios registrados
                  </TableCell>
                </TableRow>
              ) : (
                socios.map(s => (
                  <TableRow key={s.id}>
                    <TableCell>{s.nombre}</TableCell>
                    <TableCell>{s.email}</TableCell>
                    <TableCell>{s.rut}</TableCell>
                    <TableCell className="flex gap-1 flex-wrap">
                      {s.roles.map(r => (
                        <Badge key={r}>{r}</Badge>
                      ))}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Socio</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div>
              <Label>Nombre *</Label>
              <Input
                value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
                placeholder="Nombre completo"
              />
            </div>

            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div>
              <Label>RUT * (sin puntos, con guión. Ej: 12345678-9)</Label>
              <Input
                value={form.rut}
                onChange={e => setForm({ ...form, rut: e.target.value })}
                placeholder="12345678-9"
              />
            </div>

            <div>
              <Label>Contraseña * (mín. 6 caracteres)</Label>
              <Input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <div>
              <Label>Roles</Label>
              <div className="space-y-2 mt-2">
                {['socio', 'director', 'administrador'].map(r => (
                  <div key={r} className="flex items-center gap-2">
                    <Checkbox
                      checked={form.roles.includes(r)}
                      onCheckedChange={() => toggleRole(r)}
                      disabled={r === 'socio'} // socio siempre está marcado
                    />
                    <span className="capitalize">{r}</span>
                    {r === 'socio' && <span className="text-xs text-muted-foreground">(obligatorio)</span>}
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={handleCreateSocio} disabled={saving} className="w-full">
              {saving ? 'Creando…' : 'Crear Socio'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
