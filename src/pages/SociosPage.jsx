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
import { Alert } from '../components/ui/alert'

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
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nombre, email, rut')
        .order('created_at', { ascending: false })

      const { data: roles } = await supabase
        .from('roles')
        .select('user_id, role_name')

      const merged = profiles.map(p => ({
        ...p,
        roles: roles
          .filter(r => r.user_id === p.id)
          .map(r => r.role_name)
      }))

      setSocios(merged)
    } catch (err) {
      console.error(err)
      setSocios([])
    } finally {
      setLoading(false)
    }
  }

  const toggleRole = role => {
    setForm(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }))
  }

  // 🔥 AQUÍ ESTABA TODO EL PROBLEMA
  const handleCreateSocio = async () => {
    setError('')

    try {
      const {
        data,
        error: fnError
      } = await supabase.functions.invoke('bright-service', {
        body: {
          nombre: form.nombre,
          email: form.email,
          rut: form.rut,
          password: form.password,
          roles: form.roles
        }
      })

      if (fnError) {
        console.error(fnError)
        throw new Error(fnError.message)
      }

      if (!data?.success) {
        throw new Error('La función no devolvió success')
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
      setError('Error creando socio')
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

      {/* MODAL NUEVO SOCIO */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Socio</DialogTitle>
          </DialogHeader>

          {error && <Alert variant="destructive">{error}</Alert>}

          <div className="space-y-3">
            <div>
              <Label>Nombre</Label>
              <Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
            </div>

            <div>
              <Label>Email</Label>
              <Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>

            <div>
              <Label>RUT</Label>
              <Input value={form.rut} onChange={e => setForm({ ...form, rut: e.target.value })} />
            </div>

            <div>
              <Label>Password</Label>
              <Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>

            <div className="space-y-2">
              {['socio', 'director', 'administrador'].map(r => (
                <div key={r} className="flex items-center gap-2">
                  <Checkbox checked={form.roles.includes(r)} onCheckedChange={() => toggleRole(r)} />
                  <span>{r}</span>
                </div>
              ))}
            </div>

            <Button className="w-full" onClick={handleCreateSocio}>
              Crear Socio
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
