import React, { useEffect, useState } from 'react'
import { Plus, Edit } from 'lucide-react'
import { supabase } from '../lib/supabase'
import {
  Card,
  CardContent
} from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Spinner } from '../components/ui/spinner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../components/ui/table'

export default function SociosPage() {
  const [socios, setSocios] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
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
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.log('SOCIOS RAW:', data, error)
    } else {
      setSocios(data || [])
    }

    setLoading(false)
  }

  const handleCreate = async (e) => {
    e.preventDefault()

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password
    })

    if (error || !data.user) {
      alert('Error creando usuario')
      return
    }

    await supabase.from('profiles').insert({
      id: data.user.id,
      nombre: form.nombre,
      email: form.email
    })

    for (const role of form.roles) {
      await supabase.from('roles').insert({
        user_id: data.user.id,
        role_name: role
      })
    }

    setOpen(false)
    setForm({ nombre: '', email: '', password: '', roles: ['socio'] })
    loadSocios()
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Socios</h1>
          <p className="text-muted-foreground">
            Administración de socios y roles
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Socio
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo Socio</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreate} className="space-y-4">
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
                <Label>Contraseña</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>

              <Button type="submit">Crear</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner className="w-8 h-8" />
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {socios.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.nombre}</TableCell>
                    <TableCell>{s.email}</TableCell>
                    <TableCell>
                      {s.roles.map(r => (
                        <Badge key={r.role_name} className="mr-1">
                          {r.role_name}
                        </Badge>
                      ))}
                    </TableCell>
                    <TableCell>
                      <Badge>Activo</Badge>
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
