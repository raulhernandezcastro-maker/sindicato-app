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

const EDGE_FUNCTION_URL =
  'https://ncbvillobdmthjtvxtsm.supabase.co/functions/v1/bright-service'

export default function SociosPage() {
  const [socios, setSocios] = useState([])
  const [loading, setLoading] = useState(true)

  const [open, setOpen] = useState(false)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

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

  /* =========================
     CARGA DE SOCIOS
     ========================= */
  const loadSocios = async () => {
    setLoading(true)
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, nombre, email, rut')
        .order('created_at', { ascending: false })

      if (profilesError) throw profilesError

      const { data: roles, error: rolesError } = await supabase
        .from('roles')
        .select('user_id, role_name')

      if (rolesError) throw rolesError

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

  /* =========================
     FORM HANDLERS
     ========================= */
  const toggleRole = (role) => {
    setForm(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }))
  }

  const handleCreateSocio = async (e) => {
    e.preventDefault()
    setFormError('')
    setSaving(true)

    try {
      const {
        data: { session }
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('Sesión no válida')
      }

      const res = await fetch(EDGE_FUNCTION_URL, {
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
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error creando socio')
      }

      // refrescar grilla
      await loadSocios()

      // reset
      setForm({
        nombre: '',
        email: '',
        rut: '',
        password: '',
        roles: ['socio']
      })
      setOpen(false)
    } catch (err) {
      console.error(err)
      setFormError(err.message || 'Failed to fetch')
    } finally {
      setSaving(false)
    }
  }

  /* =========================
     UI
     ========================= */
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
                      <span className="text-muted-foreground">Sin rol</span>
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
            {formError && (
              <Alert variant="destructive">{formError}</Alert>
            )}

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
