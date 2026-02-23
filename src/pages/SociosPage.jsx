import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import { Spinner } from '../components/ui/spinner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '../components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../components/ui/table'
import { Checkbox } from '../components/ui/checkbox'
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
    password: '',
    rut: '',
    telefono: '',
    roles: ['socio']
  })

  useEffect(() => {
    loadSocios()
  }, [])

  const loadSocios = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        nombre,
        email,
        rut,
        roles ( role_name )
      `)
      .order('created_at', { ascending: false })

    if (!error) setSocios(data || [])
    setLoading(false)
  }

  const toggleRole = (role) => {
    setForm((prev) => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }))
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      if (!form.rut) throw new Error('El RUT es obligatorio')
      if (form.roles.length === 0) throw new Error('Debe seleccionar al menos un rol')

      // 1️⃣ Crear usuario Auth
      const { data: authData, error: authError } =
        await supabase.auth.signUp({
          email: form.email,
          password: form.password
        })

      if (authError || !authData.user) throw authError

      const userId = authData.user.id

      // 2️⃣ Crear perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          nombre: form.nombre,
          email: form.email,
          rut: form.rut,
          telefono: form.telefono
        })

      if (profileError) throw profileError

      // 3️⃣ Crear roles
      const rolesPayload = form.roles.map(r => ({
        user_id: userId,
        role_name: r
      }))

      const { error: rolesError } = await supabase
        .from('roles')
        .insert(rolesPayload)

      if (rolesError) throw rolesError

      await loadSocios()
      setOpen(false)
      setForm({
        nombre: '',
        email: '',
        password: '',
        rut: '',
        telefono: '',
        roles: ['socio']
      })
    } catch (err) {
      console.error(err)
      setError(err.message || 'Error al crear socio')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Socios</h1>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>+ Nuevo Socio</Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo Socio</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreate} className="space-y-4">
              {error && <Alert variant="destructive">{error}</Alert>}

              <div>
                <Label>Nombre</Label>
                <Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
              </div>

              <div>
                <Label>Email</Label>
                <Input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>

              <div>
                <Label>Contraseña</Label>
                <Input required type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              </div>

              <div>
                <Label>RUT</Label>
                <Input required value={form.rut} onChange={e => setForm({ ...form, rut: e.target.value })} />
              </div>

              <div>
                <Label>Teléfono</Label>
                <Input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
              </div>

              <div>
                <Label>Roles</Label>
                <div className="space-y-2">
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

              <Button disabled={saving}>
                {saving ? 'Creando...' : 'Crear Socio'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <Card>
          <CardContent className="pt-6">
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
                        <Badge key={r.role_name} className="mr-1">
                          {r.role_name}
                        </Badge>
                      ))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
