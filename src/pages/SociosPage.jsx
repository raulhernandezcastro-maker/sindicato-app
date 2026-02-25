import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  Card, CardHeader, CardTitle, CardContent
} from '../components/ui/card'
import { Spinner } from '../components/ui/spinner'
import { Badge } from '../components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../components/ui/table'
import { Button } from '../components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Checkbox } from '../components/ui/checkbox'

export default function SociosPage() {
  const [socios, setSocios] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    rut: '',
    password: '',
    roles: ['socio'],
  })
  const [error, setError] = useState('')

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

    const merged = profiles.map(p => ({
      ...p,
      roles: roles.filter(r => r.user_id === p.id).map(r => r.role_name),
    }))

    setSocios(merged)
    setLoading(false)
  }

  const toggleRole = (role) => {
    setForm(f => ({
      ...f,
      roles: f.roles.includes(role)
        ? f.roles.filter(r => r !== role)
        : [...f.roles, role]
    }))
  }

  const handleCreate = async () => {
    setError('')

    try {
      const res = await fetch(
        'https://ncbvillobdmthjtvxtsm.supabase.co/functions/v1/bright-service',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
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
        roles: ['socio'],
      })
      loadSocios()
    } catch (e) {
      setError(e.message)
    }
  }

  if (loading) {
    return <Spinner className="mx-auto mt-12" />
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between">
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
                      <Badge key={r} className="mr-1">{r}</Badge>
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
          <Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />

          <Label>Email</Label>
          <Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />

          <Label>RUT</Label>
          <Input value={form.rut} onChange={e => setForm({ ...form, rut: e.target.value })} />

          <Label>Password</Label>
          <Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />

          <div className="space-y-1 mt-2">
            {['socio', 'director', 'administrador'].map(r => (
              <label key={r} className="flex items-center gap-2">
                <Checkbox checked={form.roles.includes(r)} onCheckedChange={() => toggleRole(r)} />
                {r}
              </label>
            ))}
          </div>

          <Button className="mt-4" onClick={handleCreate}>Crear Socio</Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
