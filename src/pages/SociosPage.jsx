import React, { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

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
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Alert } from '../components/ui/alert'
import { Checkbox } from '../components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../components/ui/table'

export default function SociosPage() {
  const { isAdministrador } = useAuth()

  const [socios, setSocios] = useState([])
  const [loading, setLoading] = useState(true)

  const [open, setOpen] = useState(false)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    rut: '',
    nombre: '',
    email: '',
    password: '',
    roles: ['socio']
  })

  useEffect(() => {
    loadSocios()
  }, [])

  /* =========================
     CARGA CORRECTA DE SOCIOS
     ========================= */
  const loadSocios = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          rut,
          nombre,
          email,
          roles (
            role_name
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setSocios(data || [])
    } catch (err) {
      console.error('Error cargando socios:', err)
      setSocios([])
    } finally {
      setLoading(false)
    }
  }

  const toggleRole = (role) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }))
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setFormError('')
    setSaving(true)

    if (!formData.rut) {
      setFormError('El RUT es obligatorio')
      setSaving(false)
      return
    }

    if (formData.roles.length === 0) {
      setFormError('Debe seleccionar al menos un rol')
      setSaving(false)
      return
    }

    try {
      const { data: authData, error: authError } =
        await supabase.auth.signUp({
          email: formData.email,
          password: formData.password
        })

      if (authError || !authData.user) {
        throw authError || new Error('No se pudo crear el usuario')
      }

      const userId = authData.user.id

      await supabase.from('profiles').insert({
        id: userId,
        rut: formData.rut.trim(),
        nombre: formData.nombre,
        email: formData.email
      })

      for (const role of formData.roles) {
        await supabase.from('roles').insert({
          user_id: userId,
          role_name: role
        })
      }

      setOpen(false)
      setFormData({
        rut: '',
        nombre: '',
        email: '',
        password: '',
        roles: ['socio']
      })

      await loadSocios()
    } catch (err) {
      console.error(err)
      setFormError('Error al crear el socio')
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

        {isAdministrador && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Usuario
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nuevo Usuario</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleCreate} className="space-y-4">
                {formError && (
                  <Alert variant="destructive">{formError}</Alert>
                )}

                <div>
                  <Label>RUT</Label>
                  <Input
                    value={formData.rut}
                    onChange={(e) =>
                      setFormData({ ...formData, rut: e.target.value })
                    }
                    required
                  />
                </div>

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
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>

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

                <div>
                  <Label>Roles</Label>
                  <div className="space-y-2 mt-2">
                    {['socio', 'director', 'administrador'].map(r => (
                      <div key={r} className="flex items-center space-x-2">
                        <Checkbox
                          checked={formData.roles.includes(r)}
                          onCheckedChange={() => toggleRole(r)}
                        />
                        <span className="capitalize">{r}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button disabled={saving}>
                  {saving ? 'Creando...' : 'Crear Usuario'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {socios.map(s => (
                <TableRow key={s.id}>
                  <TableCell>{s.nombre || 'Sin nombre'}</TableCell>
                  <TableCell>{s.email}</TableCell>
                  <TableCell>
                    {(s.roles || []).map(r => (
                      <Badge key={r.role_name} className="mr-1">
                        {r.role_name}
                      </Badge>
                    ))}
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
    </div>
  )
}
