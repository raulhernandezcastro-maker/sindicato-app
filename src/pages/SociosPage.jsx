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

export default function SociosPage() {
  const [socios, setSocios] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, nombre, email, rut')

    const { data: roles } = await supabase
      .from('roles')
      .select('user_id, role_name')

    const joined = profiles.map(p => ({
      ...p,
      roles: roles
        .filter(r => r.user_id === p.id)
        .map(r => r.role_name)
    }))

    setSocios(joined)
    setLoading(false)
  }

  const toggleRole = (role) => {
    setForm(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }))
  }

  const handleCreateSocio = async () => {
    setError('')
    setSaving(true)

    try {
      const res = await fetch(
        'https://ncbvillobdmthjtvxtsm.supabase.co/functions/v1/bright-service',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify(form)
        }
      )

      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

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
      setError(err.message || 'Error creando socio')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <Spinner />
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Socios</h1>
        <Button onClick={() => setOpen(true)}>+ Nuevo Socio</Button>
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
              {socios.map(s => (
                <TableRow key={s.id}>
                  <TableCell>{s.nombre}</TableCell>
                  <TableCell>{s.email}</TableCell>
                  <TableCell>{s.rut}</TableCell>
                  <TableCell>
                    {s.roles.map(r => (
                      <Badge key={r}>{r}</Badge>
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

          {error && <p className="text-red-500">{error}</p>}

          <Label>Nombre</Label>
          <Input onChange={e => setForm({ ...form, nombre: e.target.value })} />

          <Label>Email</Label>
          <Input onChange={e => setForm({ ...form, email: e.target.value })} />

          <Label>RUT</Label>
          <Input onChange={e => setForm({ ...form, rut: e.target.value })} />

          <Label>Password</Label>
          <Input type="password" onChange={e => setForm({ ...form, password: e.target.value })} />

          <Label>Roles</Label>
          {['socio', 'director', 'administrador'].map(r => (
            <div key={r} className="flex gap-2">
              <Checkbox
                checked={form.roles.includes(r)}
                onCheckedChange={() => toggleRole(r)}
              />
              {r}
            </div>
          ))}

          <Button onClick={handleCreateSocio} disabled={saving}>
            {saving ? 'Creando…' : 'Crear Socio'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
