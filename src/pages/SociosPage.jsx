import React, { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Card, CardContent } from '../components/ui/card'
import { Spinner } from '../components/ui/spinner'
import { Badge } from '../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Button } from '../components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Checkbox } from '../components/ui/checkbox'
import { Search, Users, Pencil, Plus, Phone, RefreshCw, TrendingUp, UserCheck, UserX, Clock } from 'lucide-react'

const normalizarRut = (rut) =>
  String(rut || '').replace(/\./g, '').replace(/-/g, '').trim().toLowerCase()

const EMPTY_FORM = { nombre: '', email: '', rut: '', password: '', telefono: '', roles: ['socio'] }

const formatFecha = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-CL', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })
}

const formatFechaHora = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-CL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

// ── Panel de métricas (solo administrador) ──────────────────────────────────
function PanelMetricas({ socios, onRefresh, refreshing }) {
  const ahora = new Date()
  const hace5dias  = new Date(ahora - 5  * 24 * 60 * 60 * 1000)
  const hace30dias = new Date(ahora - 30 * 24 * 60 * 60 * 1000)
  const hace7dias  = new Date(ahora - 7  * 24 * 60 * 60 * 1000)

  // Métricas: solo socios puros (excluye aportantes, directores, admin)
  const soloSocios      = socios.filter(s => s.roles.includes('socio') && !s.roles.includes('aportante') && !s.roles.includes('director') && !s.roles.includes('administrador') && s.email !== 'invitado@sindicato.cl')
  const sociosActivos   = soloSocios.filter(s => s.estado === 'activo')
  const sociosInactivos = soloSocios.filter(s => s.estado === 'inactivo')

  // Desglose para Total registrados
  const totalAportantes = socios.filter(s => s.roles.includes('aportante')).length
  const totalDirectores = socios.filter(s => s.roles.includes('director')).length
  const totalAdmin      = socios.filter(s => s.roles.includes('administrador')).length

  // Actividad basada en last_sign_in_at — solo sobre socios activos
  const ingresaron5dias  = sociosActivos.filter(s => s.last_sign_in_at && new Date(s.last_sign_in_at) >= hace5dias)
  const ingresaron7dias  = sociosActivos.filter(s => s.last_sign_in_at && new Date(s.last_sign_in_at) >= hace7dias)
  const ingresaron30dias = sociosActivos.filter(s => s.last_sign_in_at && new Date(s.last_sign_in_at) >= hace30dias)
  const nunca            = sociosActivos.filter(s => !s.last_sign_in_at && !s.roles.includes('aportante') && !s.roles.includes('director') && !s.roles.includes('administrador'))

  const pct = (n) => sociosActivos.length > 0 ? Math.round((n / sociosActivos.length) * 100) : 0

  // Último acceso registrado en toda la app
  const ultimoAcceso = socios
    .filter(s => s.last_sign_in_at)
    .sort((a, b) => new Date(b.last_sign_in_at) - new Date(a.last_sign_in_at))[0]

  const tarjetas = [
    {
      icon: <Users className="w-5 h-5" />,
      label: 'Socios activos',
      valor: sociosActivos.length,
      sub: `${sociosInactivos.length} dados de baja`,
      color: '#2d7a4f',
      bg: '#f0fdf4',
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      label: 'Últimos 5 días',
      valor: ingresaron5dias.length,
      sub: `${pct(ingresaron5dias.length)}% de socios activos`,
      color: '#1d4ed8',
      bg: '#eff6ff',
    },
    {
      icon: <UserCheck className="w-5 h-5" />,
      label: 'Últimos 30 días',
      valor: ingresaron30dias.length,
      sub: `${pct(ingresaron30dias.length)}% de socios activos`,
      color: '#7c3aed',
      bg: '#f5f3ff',
    },
    {
      icon: <UserX className="w-5 h-5" />,
      label: 'Nunca ingresaron',
      valor: nunca.length,
      sub: `${pct(nunca.length)}% aún no ha entrado`,
      color: '#dc2626',
      bg: '#fef2f2',
    },
  ]

  return (
    <div className="rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: '#e5e7eb' }}>
      {/* Header del panel */}
      <div className="flex items-center justify-between px-4 py-2.5" style={{ backgroundColor: '#1e3a5f' }}>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-200" />
          <span className="text-sm font-semibold text-white">Actividad de la App</span>
          <span className="text-xs text-blue-300 ml-1">— solo visible para administrador</span>
        </div>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs text-blue-200 hover:text-white transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {/* Tarjetas de métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-white">
        {tarjetas.map((t, i) => (
          <div key={i} className="rounded-lg p-3 flex flex-col gap-1" style={{ backgroundColor: t.bg }}>
            <div className="flex items-center gap-1.5" style={{ color: t.color }}>
              {t.icon}
              <span className="text-xs font-medium">{t.label}</span>
            </div>
            <span className="text-2xl font-bold" style={{ color: t.color }}>{t.valor}</span>
            <span className="text-xs" style={{ color: '#6b7280' }}>{t.sub}</span>
          </div>
        ))}
      </div>

      {/* Fila inferior con datos adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-t divide-y md:divide-y-0 md:divide-x" style={{ borderColor: '#e5e7eb' }}>
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50">
          <Clock className="w-4 h-4 shrink-0" style={{ color: '#6b7280' }} />
          <div>
            <p className="text-xs text-gray-500">Último acceso registrado</p>
            <p className="text-xs font-semibold text-gray-700">
              {ultimoAcceso
                ? `${ultimoAcceso.nombre} — ${formatFechaHora(ultimoAcceso.last_sign_in_at)}`
                : 'Sin datos'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50">
          <UserCheck className="w-4 h-4 shrink-0" style={{ color: '#16a34a' }} />
          <div>
            <p className="text-xs text-gray-500">Ingresaron esta semana</p>
            <p className="text-xs font-semibold text-gray-700">
              {ingresaron7dias.length} socios ({pct(ingresaron7dias.length)}%)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50">
          <Users className="w-4 h-4 shrink-0" style={{ color: '#2d7a4f' }} />
          <div>
            <p className="text-xs text-gray-500">Total registrados</p>
            <p className="text-xs font-semibold text-gray-700">
              {soloSocios.length} socios ({sociosActivos.length} activos · {sociosInactivos.length} de baja) · {totalAportantes} aportantes · {totalDirectores} directores · {totalAdmin} admin
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Página principal ─────────────────────────────────────────────────────────
export default function SociosPage() {
  const { isAdministrador } = useAuth()
  const [socios, setSocios]           = useState([])
  const [loading, setLoading]         = useState(true)
  const [refreshing, setRefreshing]   = useState(false)
  const [busqueda, setBusqueda]       = useState('')

  // Crear
  const [openCrear, setOpenCrear]     = useState(false)
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')
  const [form, setForm]               = useState(EMPTY_FORM)

  // Editar
  const [openEditar, setOpenEditar]   = useState(false)
  const [editForm, setEditForm]       = useState({})
  const [savingEdit, setSavingEdit]   = useState(false)
  const [errorEdit, setErrorEdit]     = useState('')

  // Baja / reactivar
  const [socioSeleccionado, setSocioSeleccionado] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [togglingId, setTogglingId]   = useState(null)

  const loadSocios = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    const { data: profiles } = await supabase
      .from('profiles_with_activity')
      .select('id, nombre, email, rut, estado, telefono, created_at, fecha_baja, last_sign_in_at, ultimo_acceso')
    const { data: roles } = await supabase.from('roles').select('user_id, role_name')

    const joined = (profiles || []).map(p => ({
      ...p,
      roles: (roles || []).filter(r => r.user_id === p.id).map(r => r.role_name),
      telefono: p.telefono || ''
    }))
    joined.sort((a, b) => {
      if (a.estado === b.estado) return (a.nombre || '').localeCompare(b.nombre || '')
      return a.estado === 'activo' ? -1 : 1
    })
    setSocios(joined)

    if (isRefresh) setRefreshing(false)
    else setLoading(false)
  }, [])

  useEffect(() => { loadSocios() }, [loadSocios])

  /* ── CREAR ── */
  const toggleRole = (role) => {
    setForm(prev => {
      let newRoles = [...prev.roles]
      if (newRoles.includes(role)) {
        if (newRoles.length === 1) return prev
        newRoles = newRoles.filter(r => r !== role)
      } else {
        if (role === 'aportante') newRoles = newRoles.filter(r => r !== 'socio')
        if (role === 'socio')     newRoles = newRoles.filter(r => r !== 'aportante')
        newRoles.push(role)
      }
      return { ...prev, roles: newRoles }
    })
  }

  const validateForm = () => {
    if (!form.nombre.trim())  return 'El nombre es obligatorio'
    if (!form.email.trim())   return 'El email es obligatorio'
    if (!form.rut.trim())     return 'El RUT es obligatorio'
    if (!form.password || form.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres'
    return null
  }

  const handleCreateSocio = async () => {
    setError('')
    const err = validateForm()
    if (err) { setError(err); return }
    setSaving(true)

    const MAX_INTENTOS = 3
    const ESPERA_MS    = 2000 // 2 segundos entre reintentos

    const llamarEdgeFunction = async (intento = 1) => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000) // timeout 10s por intento

      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/bright-service`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ nombre: form.nombre, email: form.email, rut: normalizarRut(form.rut), password: form.password, telefono: form.telefono, roles: form.roles }),
          signal: controller.signal
        })
        clearTimeout(timeout)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
        return data
      } catch (e) {
        clearTimeout(timeout)
        const esTimeout = e.name === 'AbortError'
        const esRed     = e.name === 'TypeError'
        // Solo reintenta en errores de red o timeout (cold start), no en errores de negocio
        if ((esTimeout || esRed) && intento < MAX_INTENTOS) {
          console.warn(`[bright-service] Intento ${intento} fallido (${e.message}). Reintentando en ${ESPERA_MS}ms...`)
          await new Promise(r => setTimeout(r, ESPERA_MS))
          return llamarEdgeFunction(intento + 1)
        }
        throw e
      }
    }

    try {
      await llamarEdgeFunction()
      setOpenCrear(false)
      setForm(EMPTY_FORM)
      await loadSocios()
    } catch (err) {
      setError(err.message || 'Error creando socio. Verifica que el RUT y email no estén duplicados.')
    } finally {
      setSaving(false)
    }
  }

  /* ── EDITAR ── */
  const abrirEditar = (socio) => {
    setErrorEdit('')
    setEditForm({
      id:       socio.id,
      nombre:   socio.nombre   || '',
      email:    socio.email    || '',
      rut:      socio.rut      || '',
      telefono: socio.telefono || '',
      roles:    [...socio.roles],
      newPassword: '',
    })
    setOpenEditar(true)
  }

  const toggleRoleEdit = (role) => {
    setEditForm(prev => {
      let newRoles = [...(prev.roles || [])]
      if (newRoles.includes(role)) {
        if (newRoles.length === 1) return prev
        newRoles = newRoles.filter(r => r !== role)
      } else {
        if (role === 'aportante') newRoles = newRoles.filter(r => r !== 'socio')
        if (role === 'socio')     newRoles = newRoles.filter(r => r !== 'aportante')
        newRoles.push(role)
      }
      return { ...prev, roles: newRoles }
    })
  }

  const handleGuardarEdicion = async () => {
    setErrorEdit('')
    if (!editForm.nombre.trim()) { setErrorEdit('El nombre es obligatorio'); return }
    if (!editForm.email.trim())  { setErrorEdit('El email es obligatorio'); return }
    if (editForm.newPassword && editForm.newPassword.length < 6) { setErrorEdit('La contraseña debe tener al menos 6 caracteres'); return }
    setSavingEdit(true)
    try {
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ nombre: editForm.nombre, rut: normalizarRut(editForm.rut), telefono: editForm.telefono })
        .eq('id', editForm.id)
      if (profileErr) throw profileErr

      await supabase.from('roles').delete().eq('user_id', editForm.id)
      const rolesInsert = editForm.roles.map(r => ({ user_id: editForm.id, role_name: r }))
      await supabase.from('roles').insert(rolesInsert)

      setSocios(prev => prev.map(s =>
        s.id === editForm.id ? { ...s, nombre: editForm.nombre, rut: normalizarRut(editForm.rut), roles: editForm.roles } : s
      ))
      setOpenEditar(false)
    } catch (err) {
      setErrorEdit(err.message || 'Error al guardar cambios')
    } finally {
      setSavingEdit(false)
    }
  }

  /* ── BAJA / REACTIVAR ── */
  const pedirConfirmacion = (socio) => { setSocioSeleccionado(socio); setConfirmOpen(true) }

  const handleToggleEstado = async () => {
    if (!socioSeleccionado) return
    const nuevoEstado = socioSeleccionado.estado === 'activo' ? 'inactivo' : 'activo'
    const idSocio = socioSeleccionado.id

    setTogglingId(idSocio)
    setConfirmOpen(false)
    setSocioSeleccionado(null)

    try {
      const updateData = { estado: nuevoEstado }
      if (nuevoEstado === 'inactivo') updateData.fecha_baja = new Date().toISOString()
      else updateData.fecha_baja = null

      const { error } = await supabase.from('profiles').update(updateData).eq('id', idSocio)
      if (error) {
        alert(`Error al cambiar el estado: ${error.message}`)
      } else {
        await loadSocios()
      }
    } catch (err) {
      alert(`Error inesperado: ${err.message}`)
    } finally {
      setTogglingId(null)
    }
  }

  if (loading) return <Spinner />

  const sociosFiltrados = busqueda.trim()
    ? socios.filter(s => {
        const q = busqueda.toLowerCase().trim()
        return (s.nombre?.toLowerCase().includes(q)) || (s.rut?.toLowerCase().includes(q))
      })
    : socios

  return (
    <div className="max-w-6xl mx-auto space-y-4">

      {/* Título */}
      <div className="flex items-center justify-between px-4 py-3 rounded-lg" style={{ backgroundColor: '#2d7a4f' }}>
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-white" />
          <div>
            <h1 className="text-xl font-bold text-white">Gestión de Socios</h1>
            <p className="text-xs text-green-100">
              {socios.filter(s => s.estado === 'activo' && s.roles.includes('socio') && !s.roles.includes('director') && !s.roles.includes('administrador')).length} socios
              {' · '}
              {socios.filter(s => s.estado === 'activo' && s.roles.includes('aportante')).length} aportantes
              {' · '}
              {socios.filter(s => s.estado === 'activo' && s.roles.includes('director')).length} directores
              {' · '}
              {socios.filter(s => s.estado === 'activo' && s.roles.includes('administrador')).length} administrador{socios.filter(s => s.estado === 'activo' && s.roles.includes('administrador')).length !== 1 ? 'es' : ''}
              {socios.filter(s => s.estado === 'inactivo').length > 0 && (
                <span style={{ color: '#fca5a5' }}>
                  {' · '}
                  {socios.filter(s => s.estado === 'inactivo').length} dados de baja
                </span>
              )}
            </p>
          </div>
        </div>
        {isAdministrador && (
          <Button size="sm" onClick={() => { setError(''); setOpenCrear(true) }}
                  style={{ backgroundColor: '#7CBE80', color: '#003d18' }}>
            <Plus className="w-4 h-4 mr-1" /> Nuevo Socio
          </Button>
        )}
      </div>

      {/* Panel de métricas — solo administrador */}
      {isAdministrador && (
        <PanelMetricas
          socios={socios}
          onRefresh={() => loadSocios(true)}
          refreshing={refreshing}
        />
      )}

      {/* Buscador */}
      <div className="flex items-center gap-3 px-3 py-2 rounded-lg border bg-white shadow-sm">
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o RUT..."
          className="flex-1 text-sm outline-none bg-transparent"
        />
        {busqueda && (
          <button onClick={() => setBusqueda('')} className="text-xs text-muted-foreground hover:text-foreground">
            ✕ Limpiar
          </button>
        )}
      </div>

      {/* Lista de socios */}
      <div className="space-y-2 overflow-y-auto pr-1" style={{ maxHeight: '65vh' }}>
        {sociosFiltrados.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            {busqueda ? `No se encontraron socios para "${busqueda}"` : 'No hay socios registrados'}
          </div>
        ) : (
          sociosFiltrados.map(s => (
            <div key={s.id}
              className="rounded-lg border bg-white shadow-sm overflow-hidden"
              style={{ opacity: s.estado === 'inactivo' ? 0.55 : 1 }}>
              <div className="flex items-center justify-between px-4 py-2"
                   style={{ backgroundColor: '#f0f9f2' }}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold text-sm truncate" style={{ color: '#1a1a1a' }}>
                    {s.nombre}
                  </span>
                  {s.roles.map(r => (
                    <Badge key={r} style={{ backgroundColor: '#2d7a4f', color: 'white', fontSize: '10px' }}>{r}</Badge>
                  ))}
                </div>
                <Badge style={{
                  backgroundColor: s.estado === 'activo' ? '#d4edda' : '#fde8e8',
                  color: s.estado === 'activo' ? '#2d7a4f' : '#c0392b',
                  fontSize: '10px', flexShrink: 0
                }}>
                  {s.estado === 'activo' ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
              <div className="flex items-center justify-between px-4 py-2 gap-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-0.5 flex-1 min-w-0">
                  <span className="text-xs text-muted-foreground truncate">📧 {s.email}</span>
                  <span className="text-xs text-muted-foreground">🪪 {s.rut}</span>
                  <span className="text-xs text-muted-foreground">
                    <Phone className="w-3 h-3 inline mr-1" style={{ color: '#2d7a4f' }} />
                    {s.telefono || <span className="italic text-gray-300">Sin teléfono</span>}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    📅 Alta: <span style={{ color: '#2d7a4f' }}>{formatFecha(s.created_at)}</span>
                  </span>
                  {s.estado === 'inactivo' && s.fecha_baja && (
                    <span className="text-xs text-muted-foreground">
                      🔴 Baja: <span style={{ color: '#c0392b' }}>{formatFecha(s.fecha_baja)}</span>
                    </span>
                  )}
                  {isAdministrador && s.estado === 'activo' && (
                    <span className="text-xs text-muted-foreground">
                      🔑 Último login: <span style={{ color: '#2d7a4f' }}>
                        {s.last_sign_in_at ? formatFecha(s.last_sign_in_at) : 'Sin acceso aún'}
                      </span>
                    </span>
                  )}
                  {isAdministrador && s.estado === 'activo' && (
                    <span className="text-xs text-muted-foreground">
                      🟢 Última visita: <span style={{ color: '#2d7a4f' }}>
                        {s.last_sign_in_at ? formatFechaHora(s.last_sign_in_at) : 'Sin visitas aún'}
                      </span>
                    </span>
                  )}
                </div>
                {isAdministrador && (
                  <div className="flex gap-1 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => abrirEditar(s)}
                            className="h-7 px-2" title="Editar socio">
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button variant="outline" size="sm"
                            disabled={togglingId === s.id}
                            onClick={() => pedirConfirmacion(s)}
                            className="h-7 px-2 text-xs"
                            style={{ color: s.estado === 'activo' ? '#c0392b' : '#2d7a4f' }}>
                      {s.estado === 'activo' ? 'Dar de baja' : 'Reactivar'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Diálogo CREAR */}
      <Dialog open={openCrear} onOpenChange={v => { if (!v) { setOpenCrear(false); setError(''); setForm(EMPTY_FORM) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Socio</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</p>}
            <div><Label>Nombre *</Label><Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre completo" /></div>
            <div><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="correo@ejemplo.com" /></div>
            <div><Label>RUT * (sin puntos, con guión)</Label><Input value={form.rut} onChange={e => setForm({ ...form, rut: e.target.value })} placeholder="12345678-9" /></div>
            <div><Label>Teléfono (ej: +56912345678)</Label><Input type="tel" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="+56912345678" /></div>
            <div><Label>Contraseña * (mín. 6 caracteres)</Label><Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
            <div>
              <Label>Roles</Label>
              <div className="space-y-2 mt-2">
                {['socio', 'aportante', 'director', 'administrador'].map(r => (
                  <div key={r} className="flex items-center gap-2">
                    <Checkbox checked={form.roles.includes(r)} onCheckedChange={() => toggleRole(r)} />
                    <span className="capitalize text-sm">{r}</span>
                  </div>
                ))}
              </div>
            </div>
            <Button onClick={handleCreateSocio} disabled={saving} className="w-full" style={{ backgroundColor: '#2d7a4f', color: 'white' }}>
              {saving ? 'Creando…' : 'Crear Socio'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo EDITAR */}
      <Dialog open={openEditar} onOpenChange={v => { if (!v) setOpenEditar(false) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Socio</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {errorEdit && <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{errorEdit}</p>}
            <div><Label>Nombre *</Label><Input value={editForm.nombre || ''} onChange={e => setEditForm({ ...editForm, nombre: e.target.value })} /></div>
            <div>
              <Label>Email</Label>
              <Input value={editForm.email || ''} disabled className="bg-gray-50 text-muted-foreground" />
              <p className="text-xs text-muted-foreground mt-1">El email no puede modificarse desde aquí</p>
            </div>
            <div><Label>RUT</Label><Input value={editForm.rut || ''} onChange={e => setEditForm({ ...editForm, rut: e.target.value })} placeholder="12345678-9" /></div>
            <div><Label>Teléfono</Label><Input type="tel" value={editForm.telefono || ''} onChange={e => setEditForm({ ...editForm, telefono: e.target.value })} placeholder="+56912345678" /></div>
            <div>
              <Label>Roles</Label>
              <div className="space-y-2 mt-2">
                {['socio', 'aportante', 'director', 'administrador'].map(r => (
                  <div key={r} className="flex items-center gap-2">
                    <Checkbox checked={(editForm.roles || []).includes(r)} onCheckedChange={() => toggleRoleEdit(r)} />
                    <span className="capitalize text-sm">{r}</span>
                  </div>
                ))}
              </div>
            </div>
            <Button onClick={handleGuardarEdicion} disabled={savingEdit} className="w-full" style={{ backgroundColor: '#2d7a4f', color: 'white' }}>
              {savingEdit ? 'Guardando…' : 'Guardar Cambios'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo confirmar baja/reactivación */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {socioSeleccionado?.estado === 'activo' ? '¿Dar de baja a este socio?' : '¿Reactivar a este socio?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {socioSeleccionado?.estado === 'activo'
                ? `${socioSeleccionado?.nombre} quedará como Inactivo. Sus datos se conservarán.`
                : `${socioSeleccionado?.nombre} volverá a estar Activo.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSocioSeleccionado(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleEstado} style={{ backgroundColor: '#2d7a4f' }}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}
