import React, { useEffect, useState } from 'react'
import { Plus, Edit } from 'lucide-react'
import { supabase } from '../lib/supabase'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Spinner } from '../components/ui/spinner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Alert } from '../components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../components/ui/table'
import { Checkbox } from '../components/ui/checkbox'

export default function SociosPage() {
  const [socios, setSocios] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSocio, setEditingSocio] = useState(null)
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
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
      .select('id, nombre, email, telefono, roles(role_name)')
      .order('email')

    if (error) {
      console.error('Error cargando socios:', error)
    } else {
      setSocios(data || [])
    }

    setLoading(false)
  }

  const openNewDialog = () => {
    setEditingSocio(null)
    setFormError('')
    setFormData({
      nombre: '',
      email: '',
      telefono: '',
      password: '',
      roles: ['socio']
    })
    setDialogOpen(true)
  }

  const handleEdit = (socio) => {
    setEditingSocio(socio)
    setFormError('')
    setFormData({
      nombre: socio.nombre || '',
      email: socio.email,
      telefono: socio.telefono || '',
      password: '',
      roles: socio.roles.map(r => r.role_name)
    })
    setDialogOpen(true)
  }

  const toggleRole = (role) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setFormLoading(true)

    try {
      if (editingSocio) {
        // actualizar perfil
        await supabase
          .from('profiles')
          .update({
            nombre: formData.nombre,
            telefono: formData.telefono
          })
          .eq('id', editingSocio.id)

        // reset roles
        await supabase.from('roles').delete().eq('user_id', editingSocio.id)

        for (const role of formData.roles) {
          await supabase.from('roles').insert({
            user_id: editingSocio.id,
            role_name: role
          })
        }
      } else {
        // crear usuario auth
        const { data: authData, error: authError } =
          await supabase.auth.signUp({
            email: formData.email,
            password: formData.password
          })

        if (authError || !authData.user) throw authError

        await supabase.from('profiles').insert({
          id: authData.user.id,
          nombre: formData.nombre,
          email: formData.email,
          telefono: formData.telefono
        })

        for (const role of formData.roles) {
          await supabase.from('roles').insert({
            user_id: authData.user.id,
            role_name: role
          })
        }
      }

      await loadSocios()
      setDialogOpen(false)
      setEditingSocio(null)
    } catch (err) {
      console.error(err)
      setFormError('Error al guardar el socio')
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Socios</h1>
          <p className="text-muted-foreground">
            Administración de socios y roles
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Socio
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>
                {editingSocio ? 'Editar Socio' : 'Nuevo Socio'}
              </DialogTitle>
              <DialogDescription>
                Datos básicos del socio
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <Alert variant="destructive">{formError}</Alert>
              )}

              <div>
                <Label>Nombre</Label>
                <Input
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  disabled={!!editingSocio}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label>Teléfono</Label>
                <Input
                  value={formData.telefono}
                  onChange={(e) =>
                    setFormData({ ...formData, telefono: e.target.value })
                  }
                />
              </div>

              {!editingSocio && (
                <div>
                  <Label>Contraseña</Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                  />
                </div>
              )}

              <div>
                <Label>Roles</Label>
                <div className="space-y-2">
                  {['socio', 'director', 'administrador'].map((r) => (
                    <div key={r} className="flex items-center gap-2">
                      <Checkbox
                        checked={formData.roles.includes(r)}
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
                  onClick={() => setDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading
                    ? 'Guardando...'
                    : editingSocio
                    ? 'Actualizar'
                    : 'Crear'}
                </Button>
              </div>
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
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {socios.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.nombre}</TableCell>
                    <TableCell>{s.email}</TableCell>
                    <TableCell>{s.telefono || '-'}</TableCell>
                    <TableCell>
                      {s.roles.map((r) => (
                        <Badge key={r.role_name} className="mr-1">
                          {r.role_name}
                        </Badge>
                      ))}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleEdit(s)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
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
