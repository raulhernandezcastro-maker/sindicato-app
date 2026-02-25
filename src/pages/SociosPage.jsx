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
import { Alert } from '../components/ui/alert'

export default function SociosPage() {
  const [socios, setSocios] = useState([])
  const [loading, setLoading] = useState(true)

  // modal
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // form
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    rut: '',
    password: '',
    roles: ['socio']
  })

  useEffect(() => {
    loadSocios()
  }, [])

  /* ===============================
     CARGA DE SOCIOS (GRILLA)
     =============================== */
  const loadSocios = async () => {
    setLoading(true)
    try {
      const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('id, nombre, email, rut')
        .order('created_at', { ascending: false })

      if (pError) throw pError

      const { data: roles, error: rError } = await supabase
        .from('roles')
        .select('user_id, role_name')

      if (rError) throw rError

      const merged = profiles.map(p => ({
        ...p,
        roles: roles
          .filter(r => r.user_id === p.id)
          .map(r => r.role_name)
      }))

      setSocios(merged)
    } catch (err) {
      console.error('Error cargando socios:', err)
      setSocios([])
    } finally {
      setLoading(false)
    }
  }

  /* ===============================
     CREAR SOCIO (EDGE FUNCTION)
     =============================== */
  const handleCreateSocio = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const {
        data: { session }
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('Sesión inválida')
      }

      const res = await fetch(
        'https://ncbvillobdmthjtvxtsm.supabase.co/functions/v1/bright-service',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            nombre: form.nombre,
            email: form.email,
            password: form.password,
            rut: form.rut,
            roles: form.roles
          })
        }
      )

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Error creando socio')
      }

      // reset
      setForm({
        nombre: '',
        email: '',
        rut: '',
        password: '',
        roles: ['socio']
      })
      setOpen(false)

      await loadSocios()
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const toggleRole = (role) => {
    setForm(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }))
  }

  /* ===============================
     UI
     =============================== */

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Socios</h1>
        <Button onClick={() => setOpen(true)}>+ Nuevo Socio</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Socios</CardTitle>
        </CardHeader>
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
              {socios.map(s => (
                <TableRow key={s.id}>
                  <TableCell>{s.nombre || 'Sin nombre'}</TableCell>
                  <TableCell>{s.email}</TableCell>
                  <TableCell>{s.rut || '-'}</TableCell>
                  <TableCell>
                    {s.roles.length > 0 ? (
                      s.roles.map(r => (
                        <Badge key={r} className="mr-1">
                          {r}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">
                        Sin rol
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {socios.length === 0 && (
            <p className="text-sm text-muted-foreground mt-4">
              No hay socios para mostrar
            </p>
          )}
        </CardContent>
      </Card>

      {/* MODAL NUEVO SOCIO */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Socio</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateSocio} className="space-y-4">
            {error && <Alert variant="destructive">{error}</Alert>}

            <div>
              <Label>Nombre</Label>
              <Input
                value={form.nombre}
                onChange={e =>
                  setForm({ ...form, nombre: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={e =>
                  setForm({ ...form, email: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label>RUT</Label>
              <Input
                value={form.rut}
                onChange={e =>
                  setForm({ ...form, rut: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={form.password}
                onChange={e =>
                  setForm({ ...form, password: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label>Roles</Label>
              <div className="space-y-2">
                {['socio', 'director', 'administrador'].map(r => (
                  <div key={r} className="flex items-center space-x-2">
                    <Checkbox
                      checked={form.roles.includes(r)}
                      onCheckedChange={() => toggleRole(r)}
                    />
                    <span className="capitalize">{r}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Creando...' : 'Crear Socio'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
