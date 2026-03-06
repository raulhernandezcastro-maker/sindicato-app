import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  Card,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Checkbox } from '../components/ui/checkbox'
import { Search } from 'lucide-react'

// Normaliza RUT: sin puntos, sin guión, sin espacios, en minúsculas
const normalizarRut = (rut) =>
  String(rut || '').replace(/\./g, '').replace(/-/g, '').trim().toLowerCase()

const EMPTY_FORM = {
  nombre: '',
  email: '',
  rut: '',
  password: '',
  roles: ['socio']
}

export default function SociosPage() {
  const [socios, setSocios] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)

  // Búsqueda
  const [busqueda, setBusqueda] = useState('')

  // Estado para confirmar cambio de estado
  const [socioSeleccionado, setSocioSeleccionado] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [togglingId, setTogglingId] = useState(null)

  useEffect(() => {
    loadSocios()
  }, [])

  const loadSocios = async () => {
    setLoading(true)

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, nombre, email, rut, estado')

    if (profilesError) {
      console.error('Error cargando socios:', profilesError)
      setLoading(false)
      return
    }

    const { data: roles } = await supabase
      .from('roles')
      .select('user_id, role_name')

    const joined = (profiles || []).map(p => ({
      ...p,
      roles: (roles || [])
        .filter(r => r.user_id === p.id)
        .map(r => r.role_name)
    }))

    // Ordenar: activos primero, luego inactivos, ambos alfabéticamente
    joined.sort((a, b) => {
      if (a.estado === b.estado) return a.nombre.localeCompare(b.nombre)
      return a.estado === 'activo' ? -1 : 1
    })

    setSocios(joined)
    setLoading(false)
  }

  const toggleRole = (role) => {
    if (role === 'socio') return
    setForm(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }))
  }

  const validateForm = () => {
    if (!form.nombre.trim()) return 'El nombre es obligatorio'
    if (!form.email.trim()) return 'El email es obligatorio'
    if (!form.rut.trim()) return 'El RUT es obligatorio'
    if (!form.password || form.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres'
    return null
  }

  const handleCreateSocio = async () => {
    setError('')
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      const res = await fetch(`${supabaseUrl}/functions/v1/bright-service`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          nombre: form.nombre,
          email: form.email,
          rut: normalizarRut(form.rut),
          password: form.password,
          roles: form.roles,
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`)

      setOpen(false)
      setForm(EMPTY_FORM)
      await loadSocios()
    } catch (err) {
      setError(err.message || 'Error creando socio. Verifica que el RUT y email no estén duplicados.')
    } finally {
      setSaving(false)
    }
  }

  // Abre el diálogo de confirmación antes de cambiar el estado
  const pedirConfirmacionEstado = (socio) => {
    setSocioSeleccionado(socio)
    setConfirmOpen(true)
  }

  // Cambia el estado activo/inactivo del socio
  const handleToggleEstado = async () => {
    if (!socioSeleccionado) return
    const nuevoEstado = socioSeleccionado.estado === 'activo' ? 'inactivo' : 'activo'
    setTogglingId(socioSeleccionado.id)

    const { error } = await supabase
      .from('profiles')
      .update({ estado: nuevoEstado })
      .eq('id', socioSeleccionado.id)

    if (!error) {
      setSocios(prev => prev.map(s =>
        s.id === socioSeleccionado.id ? { ...s, estado: nuevoEstado } : s
      ))
    } else {
      console.error('Error cambiando estado:', error)
    }

    setTogglingId(null)
    setConfirmOpen(false)
    setSocioSeleccionado(null)
  }

  const handleClose = () => {
    setOpen(false)
    setError('')
    setForm(EMPTY_FORM)
  }

  if (loading) return <Spinner />

  // Filtrar socios en tiempo real por RUT o Nombre
  const sociosFiltrados = busqueda.trim()
    ? socios.filter(s => {
        const q = busqueda.toLowerCase().trim()
        return (
          (s.nombre && s.nombre.toLowerCase().includes(q)) ||
          (s.rut && s.rut.toLowerCase().includes(q))
        )
      })
    : socios

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Socios</h1>
        <Button onClick={() => { setError(''); setOpen(true) }}>+ Nuevo Socio</Button>
      </div>

      {/* ── Buscador ── */}
      <div className="flex items-center gap-3 p-3 rounded-lg border bg-white shadow-sm">
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o RUT..."
          className="flex-1 text-sm outline-none bg-transparent"
        />
        {busqueda && (
          <button
            onClick={() => setBusqueda('')}
            className="text-muted-foreground hover:text-foreground text-xs"
          >
            ✕ Limpiar
          </button>
        )}
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
                <TableHead>Estado</TableHead>
                <TableHead>Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sociosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                    {busqueda ? `No se encontraron socios para "${busqueda}"` : 'No hay socios registrados'}
                  </TableCell>
                </TableRow>
              ) : (
                sociosFiltrados.map(s => (
                  <TableRow
                    key={s.id}
                    className={s.estado === 'inactivo' ? 'opacity-50' : ''}
                  >
                    <TableCell>{s.nombre}</TableCell>
                    <TableCell>{s.email}</TableCell>
                    <TableCell>{s.rut}</TableCell>
                    <TableCell className="flex gap-1 flex-wrap">
                      {s.roles.map(r => (
                        <Badge key={r}>{r}</Badge>
                      ))}
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.estado === 'activo' ? 'default' : 'secondary'}>
                        {s.estado === 'activo' ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={togglingId === s.id}
                        onClick={() => pedirConfirmacionEstado(s)}
                      >
                        {s.estado === 'activo' ? 'Dar de baja' : 'Reactivar'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Diálogo confirmar cambio de estado ── */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {socioSeleccionado?.estado === 'activo'
                ? '¿Dar de baja a este socio?'
                : '¿Reactivar a este socio?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {socioSeleccionado?.estado === 'activo'
                ? `${socioSeleccionado?.nombre} quedará como Inactivo. Sus datos y cuotas se conservarán, pero no podrá acceder a la app.`
                : `${socioSeleccionado?.nombre} volverá a estar Activo y podrá acceder a la app.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSocioSeleccionado(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleEstado}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Diálogo crear nuevo socio ── */}
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Socio</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div>
              <Label>Nombre *</Label>
              <Input
                value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
                placeholder="Nombre completo"
              />
            </div>

            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div>
              <Label>RUT * (sin puntos, con guión. Ej: 12345678-9)</Label>
              <Input
                value={form.rut}
                onChange={e => setForm({ ...form, rut: e.target.value })}
                placeholder="12345678-9"
              />
            </div>

            <div>
              <Label>Contraseña * (mín. 6 caracteres)</Label>
              <Input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <div>
              <Label>Roles</Label>
              <div className="space-y-2 mt-2">
                {['socio', 'director', 'administrador'].map(r => (
                  <div key={r} className="flex items-center gap-2">
                    <Checkbox
                      checked={form.roles.includes(r)}
                      onCheckedChange={() => toggleRole(r)}
                      disabled={r === 'socio'}
                    />
                    <span className="capitalize">{r}</span>
                    {r === 'socio' && <span className="text-xs text-muted-foreground">(obligatorio)</span>}
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={handleCreateSocio} disabled={saving} className="w-full">
              {saving ? 'Creando…' : 'Crear Socio'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
