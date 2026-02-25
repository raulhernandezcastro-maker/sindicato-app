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
import { Checkbox } from '../components/ui/checkbox'
import { Label } from '../components/ui/label'

export default function SociosPage() {
  const [socios, setSocios] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
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
      .select('id,nombre,email,rut')
      .order('created_at', { ascending: false })

    const { data: roles } = await supabase
      .from('roles')
      .select('user_id,role_name')

    const merged = (profiles || []).map(p => ({
      ...p,
      roles: roles
        .filter(r => r.user_id === p.id)
        .map(r => r.role_name)
    }))

    setSocios(merged)
    setLoading(false)
  }

  const handleCreateSocio = async () => {
    try {
      setError('')

      const session = await supabase.auth.getSession()
      const token = session.data.session.access_token

      const res = await fetch(
        'https://ncbvillobdmthjtvxtsm.supabase.co/functions/v1/bright-service',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
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
      setError(err.message)
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

          {error && <p className="text-red-600">{error}</p>}

          <div className="space-y-3">
            <div>
              <Label>Nombre</Label>
              <Input onChange={e => setForm({ ...form, nombre: e.target.value })} />
            </div>

            <div>
              <Label>Email</Label>
              <Input onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>

            <div>
              <Label>RUT</Label>
              <Input onChange={e => setForm({ ...form, rut: e.target.value })} />
            </div>

            <div>
              <Label>Password</Label>
              <Input type="password" onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>

            <div className="space-y-1">
              {['socio', 'director', 'administrador'].map(r => (
                <label key={r} className="flex items-center gap-2">
                  <Checkbox
                    checked={form.roles.includes(r)}
                    onCheckedChange={() =>
                      setForm(f => ({
                        ...f,
                        roles: f.roles.includes(r)
                          ? f.roles.filter(x => x !== r)
                          : [...f.roles, r]
                      }))
                    }
                  />
                  {r}
                </label>
              ))}
            </div>

            <Button onClick={handleCreateSocio}>
              Crear Socio
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
