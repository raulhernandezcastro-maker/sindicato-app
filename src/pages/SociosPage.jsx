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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Checkbox } from '../components/ui/checkbox'
import { Label } from '../components/ui/label'
import { Alert } from '../components/ui/alert'

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

  /* =========================
     CARGAR SOCIOS
     ========================= */
  const loadSocios = async () => {
    setLoading(true)

    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nombre, email, rut')
        .order('created_at', { ascending: false })

      const { data: roles } = await supabase
        .from('roles')
        .select('user_id, role_name')

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

  /* =========================
     CREAR SOCIO (EDGE FUNCTION)
     ========================= */
  const handleCreateSocio = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData?.session?.access_token

      if (!accessToken) {
        throw new Error('Sesión no válida')
      }

      const res = await fetch(
        'https://ncbvillobdmthjtvxtsm.supabase.co/functions/v1/bright-service',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // 🔑 ESTO ES LO QUE FALTABA
            Authorization: `Bearer ${accessToken}`
          },
          body: JSON.stringify(form)
        }
      )

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Error creando socio')
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
                onChange={e => setForm({ ...form, nombre: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>RUT</Label>
              <Input
                value={form.rut}
                onChange={e => setForm({ ...form, rut: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            <div>
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

            <Button type="submit" disabled={saving} className="w-full">
              {saving ? 'Creando...' : 'Crear Socio'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
