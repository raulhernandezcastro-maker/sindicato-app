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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../components/ui/table'
import { Plus } from 'lucide-react'

export default function SociosPage() {
  const [socios, setSocios] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    rut: '',
    nombre: '',
    email: '',
    password: '',
    role: 'socio'
  })

  useEffect(() => {
    loadSocios()
  }, [])

  /* =========================
     CARGA DE SOCIOS (GRILLA)
     ========================= */
  const loadSocios = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        nombre,
        email,
        roles (
          role_name
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error cargando socios:', error)
      setSocios([])
    } else {
      setSocios(data || [])
    }

    setLoading(false)
  }

  /* =========================
     CREAR SOCIO
     ========================= */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      // 1️⃣ Crear usuario Auth
      const { data: authData, error: authError } =
        await supabase.auth.signUp({
          email: formData.email,
          password: formData.password
        })

      if (authError || !authData.user) {
        throw authError
      }

      const userId = authData.user.id

      // 2️⃣ Crear perfil (incluye RUT)
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          rut: formData.rut,
          nombre: formData.nombre,
          email: formData.email
        })

      if (profileError) throw profileError

      // 3️⃣ Asignar rol
      const { error: roleError } = await supabase
        .from('roles')
        .insert({
          user_id: userId,
          role_name: formData.role
        })

      if (roleError) throw roleError

      // Reset UI
      setOpen(false)
      setFormData({
        rut: '',
        nombre: '',
        email: '',
        password: '',
        role: 'socio'
      })

      await loadSocios()
    } catch (err) {
      console.error('Error creando socio:', err)
      alert('Error al crear el socio')
    } finally {
      setSaving(false)
    }
  }

  /* =========================
     UI
     ========================= */
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

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Usuario
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo Socio</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                <Label>Rol</Label>
                <Select
                  value={formData.role}
                  onValueChange={(v) =>
                    setFormData({ ...formData, role: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="socio">Socio</SelectItem>
                    <SelectItem value="director">Director</SelectItem>
                    <SelectItem value="administrador">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Creando...' : 'Crear Usuario'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Socios registrados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {socios.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.nombre || 'Sin nombre'}</TableCell>
                  <TableCell>{s.email}</TableCell>
                  <TableCell>
                    {s.roles?.map((r) => (
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
