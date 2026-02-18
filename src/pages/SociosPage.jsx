import React, { useEffect, useState } from 'react'
import { Plus, Edit, UserX, UserCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { AppLayout } from '../components/layout/AppLayout'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../components/ui/select'
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
  const [formData, setFormData] = useState({
    rut: '',
    nombre: '',
    email: '',
    telefono: '',
    password: '',
    estado: 'activo',
    roles: ['socio']
  })
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    loadSocios()
  }, [])

  const loadSocios = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, roles(role_name)')
        .order('created_at', { ascending: false })

      if (error) throw error
      setSocios(data || [])
    } catch (err) {
      console.error('Error cargando socios:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setFormLoading(true)

    try {
      if (editingSocio) {
        await supabase
          .from('profiles')
          .update({
            nombre: formData.nombre,
            telefono: formData.telefono,
            estado: formData.estado
          })
          .eq('id', editingSocio.id)

        await supabase.from('roles').delete().eq('user_id', editingSocio.id)
        for (const role of formData.roles) {
          await supabase.from('roles').insert({
            user_id: editingSocio.id,
            role_name: role
          })
        }
      } else {
        const { data: authData, error: authError } =
          await supabase.auth.signUp({
            email: formData.email,
            password: formData.password
          })

        if (authError || !authData.user) throw authError

        await supabase.from('profiles').insert({
          id: authData.user.id,
          rut: formData.rut,
          nombre: formData.nombre,
          email: formData.email,
          telefono: formData.telefono,
          estado: formData.estado
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
      setFormError('Error al guardar socio')
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold">Gestión de Socios</h1>

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
                    <TableHead>RUT</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {socios.map((socio) => (
                    <TableRow key={socio.id}>
                      <TableCell>{socio.rut}</TableCell>
                      <TableCell>{socio.nombre}</TableCell>
                      <TableCell>{socio.email}</TableCell>
                      <TableCell>
                        {socio.roles.map((r) => (
                          <Badge key={r.role_name} className="mr-1">
                            {r.role_name}
                          </Badge>
                        ))}
                      </TableCell>
                      <TableCell>
                        <Badge>
                          {socio.estado === 'activo'
                            ? 'Activo'
                            : 'Inactivo'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
