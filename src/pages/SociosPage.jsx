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
  DialogTitle,
  DialogFooter
} from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Checkbox } from '../components/ui/checkbox'

const EDGE_FUNCTION_URL =
  'https://ncbvillobdmthjvxtsm.supabase.co/functions/v1/bright-service'

export default function SociosPage() {
  const [socios, setSocios] = useState([])
  const [loading, setLoading] = useState(true)

  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
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

  const loadSocios = async () => {
    setLoading(true)
    try {
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('id, nombre, email, rut')
        .order('created_at', { ascending: false })

      if (pErr) throw pErr

      const { data: roles, error: rErr } = await supabase
        .from('roles')
        .select('user_id, role_name')

      if (rErr) throw rErr

      const result = profiles.map(p => ({
        ...p,
        roles: roles
          .filter(r => r.user_id === p.id)
          .map(r => r.role_name)
      }))

      setSocios(result)
    } catch (err) {
      console.error(err)
      setSocios([])
    } finally {
      setLoading(false)
    }
  }

  const toggleRole = role => {
    setForm(f => ({
      ...f,
      roles: f.roles.includes(role)
        ? f.roles.filter(r => r !== role)
        : [...f.roles, role]
    }))
  }

  const handleCreateSocio = async () => {
    setError('')
    setSaving(true)

    try {
      const session = await supabase.auth.getSession()
      const accessToken = session.data.session?.access_token

      if (!accessToken) {
        throw new Error('No hay sesión activa')
      }

      const res = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify(form)
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error creando socio')
      }

      setOpen(false)
      setForm({
        nombre: '',
        email: '',
        rut: '',
        password: '',
        roles: ['socio']
      })

      await loadSocios()
    } catch (err) {
      console.error(err)
      setError(err.message || 'Error creando socio')
    } finally {
      setSaving(false)
    }
  }

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
                    {s.roles.map(r => (
                      <Badge key={r} className="mr-1">
                        {r}
                      </Badge>
                    ))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Socio</DialogTitle>
          </DialogHeader>

          {error && (
            <p className="text-sm text-red-600 font-medium">{error}</p>
          )}

          <div className="space-y-3">
            <div>
              <Label>Nombre</Label>
              <Input
                value={form.nombre}
                onChange={e =>
                  setForm({ ...form, nombre: e.target.value })
                }
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
              />
            </div>

            <div>
              <Label>RUT</Label>
              <Input
                value={form.rut}
                onChange={e =>
                  setForm({ ...form, rut: e.target.value })
                }
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
              />
            </div>

            <div className="space-y-2">
              <Label>Roles</Label>
              {['socio', 'director', 'administrador'].map(r => (
                <div key={r} className="flex items-center gap-2">
                  <Checkbox
                    checked={form.roles.includes(r)}
                    onCheckedChange={() => toggleRole(r)}
                  />
                  <span className="capitalize">{r}</span>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleCreateSocio}
              disabled={saving}
            >
              {saving ? 'Creando…' : 'Crear Socio'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
