import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import {
  CreditCard, Settings, ListChecks, Calculator, Lock, Unlock, Download,
  Plus, Trash2, Save, AlertTriangle, Pencil, X, Search,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Spinner } from '../components/ui/spinner'

// ─────────────────────────────────────────────────────────────
// Utilidades (fechas sin new Date(string) para evitar el desfase UTC)
// ─────────────────────────────────────────────────────────────
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio',
               'agosto','septiembre','octubre','noviembre','diciembre']

const fmt = (n) => `$${Number(n || 0).toLocaleString('es-CL')}`

const fmtMes = (d) => {
  if (!d) return '—'
  const [a, m] = d.split('-')
  const nombre = MESES[Number(m) - 1] || ''
  return `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} ${a}`
}

const fmtFecha = (d) => {
  if (!d) return '—'
  const [a, m, dia] = d.slice(0, 10).split('-')
  return `${dia}-${m}-${a}`
}

const fmtFechaHora = (ts) => {
  if (!ts) return '—'
  const d = new Date(ts) // timestamptz: se muestra en hora local
  return d.toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })
}

const mesAInput  = (d) => (d ? d.slice(0, 7) : '')          // '2026-09-01' → '2026-09'
const inputAMes  = (v) => (v ? `${v}-01` : null)              // '2026-09'    → '2026-09-01'
const fechaInput = (d) => (d ? d.slice(0, 10) : '')

const fmtRut = (rut) => {
  if (!rut) return '—'
  const limpio = String(rut).replace(/[^0-9kK]/g, '').toUpperCase()
  if (limpio.length < 2) return rut
  const cuerpo = limpio.slice(0, -1)
  const dv = limpio.slice(-1)
  return `${Number(cuerpo).toLocaleString('es-CL')}-${dv}`
}

const ALERTAS = {
  sin_cuotas_reales:     'Sin cuotas reales',
  meses_sin_pago:        'Meses sin pago',
  sin_pago_reciente:     'Sin pago reciente',
  pagos_como_aportante:  'Pagos como aportante',
  correo_no_corporativo: 'Correo no corporativo',
}

const ESTADOS = {
  borrador:         { label: 'Borrador',          bg: '#fff4cc', color: '#7a5c00' },
  nomina_cerrada:   { label: 'Nómina cerrada',    bg: '#d4edda', color: '#1e3a2f' },
  codigos_cargados: { label: 'Códigos cargados',  bg: '#d6eaf8', color: '#1a5276' },
  enviada:          { label: 'Enviada',           bg: '#d6eaf8', color: '#1a5276' },
  cerrada:          { label: 'Cerrada',           bg: '#e5e5e5', color: '#333333' },
}

// Carga paginada con orden estable (evita filas repetidas/omitidas)
async function cargarNomina(campanaId) {
  const pageSize = 1000
  let from = 0
  let todo = []
  while (true) {
    const { data, error } = await supabase
      .from('gc_nomina')
      .select('*')
      .eq('campana_id', campanaId)
      .order('nombre', { ascending: true })
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    todo = [...todo, ...data]
    if (data.length < pageSize) break
    from += pageSize
  }
  return todo
}

// ─────────────────────────────────────────────────────────────
// Componentes visuales pequeños
// ─────────────────────────────────────────────────────────────
const SectionHeader = ({ icon: Icon, title, children }) => (
  <div className="flex items-center justify-between gap-2 px-4 py-2 flex-wrap" style={{ backgroundColor: '#2d7a4f' }}>
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-white" />
      <span className="text-white text-sm font-semibold">{title}</span>
    </div>
    {children}
  </div>
)

const TH = ({ children, right }) => (
  <th className="px-3 py-2 text-xs font-semibold whitespace-nowrap"
      style={{ backgroundColor: '#7CBE80', color: '#003d18', textAlign: right ? 'right' : 'left' }}>
    {children}
  </th>
)

const TD = ({ children, right, bold, accent, className = '' }) => (
  <td className={`px-3 py-2 text-sm border-b ${bold ? 'font-bold' : ''} ${className}`}
      style={{ textAlign: right ? 'right' : 'left', color: accent ? '#2d7a4f' : undefined }}>
    {children}
  </td>
)

const Label = ({ children }) => (
  <label className="text-xs font-semibold block mb-1" style={{ color: '#2d7a4f' }}>{children}</label>
)

const inputCls = 'w-full border rounded px-2 py-1.5 text-sm focus:outline-none disabled:bg-gray-100 disabled:text-gray-500'

const BotonPrimario = ({ children, ...props }) => (
  <button {...props}
    className="inline-flex items-center gap-2 px-4 py-1.5 rounded text-sm font-medium text-white disabled:opacity-50"
    style={{ backgroundColor: '#2d7a4f' }}>
    {children}
  </button>
)

const BotonSecundario = ({ children, ...props }) => (
  <button {...props}
    className="inline-flex items-center gap-2 px-4 py-1.5 rounded text-sm font-medium border bg-white hover:bg-green-50 disabled:opacity-50"
    style={{ borderColor: '#2d7a4f', color: '#2d7a4f' }}>
    {children}
  </button>
)

const Mensaje = ({ msg, onClose }) => {
  if (!msg) return null
  const esError = msg.tipo === 'error'
  return (
    <div className="flex items-start justify-between gap-3 px-4 py-3 rounded-lg text-sm border"
         style={{ backgroundColor: esError ? '#fdecea' : '#e8f5ec',
                  borderColor: esError ? '#f5c2c0' : '#b7dfc3',
                  color: esError ? '#8a1c14' : '#1e3a2f' }}>
      <span>{msg.texto}</span>
      <button onClick={onClose} aria-label="Cerrar mensaje"><X className="w-4 h-4" /></button>
    </div>
  )
}

const Modal = ({ titulo, children, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: '#2d7a4f' }}>
        <span className="text-white font-semibold text-sm">{titulo}</span>
        <button onClick={onClose} className="text-white" aria-label="Cerrar"><X className="w-4 h-4" /></button>
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </div>
  </div>
)

// ─────────────────────────────────────────────────────────────
// Página
// ─────────────────────────────────────────────────────────────
export default function GiftCardsPage() {
  const { isAdministrador } = useAuth()

  const [campanas, setCampanas]     = useState([])
  const [campanaId, setCampanaId]   = useState('')
  const [tramos, setTramos]         = useState([])
  const [nomina, setNomina]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [trabajando, setTrabajando] = useState(false)
  const [msg, setMsg]               = useState(null)

  // Formularios
  const [form, setForm]             = useState(null)
  const [tramosForm, setTramosForm] = useState([])
  const [ajuste, setAjuste]         = useState(null)   // { fila, valor, motivo }
  const [confirmar, setConfirmar]   = useState(null)   // { titulo, texto, accion }
  const [nueva, setNueva]           = useState(null)   // formulario nueva campaña

  // Filtros de la tabla
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro]     = useState('todos')

  const campana   = campanas.find(c => c.id === campanaId) || null
  const editable  = isAdministrador && campana?.estado === 'borrador'
  const estado    = ESTADOS[campana?.estado] || ESTADOS.borrador

  // ── Carga inicial ──
  useEffect(() => { cargarCampanas() }, [])
  useEffect(() => { if (campanaId) cargarDetalle(campanaId) }, [campanaId])

  const cargarCampanas = async (seleccionar) => {
    const { data, error } = await supabase
      .from('gc_campanas')
      .select('*')
      .order('periodo_hasta', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) {
      setMsg({ tipo: 'error', texto: `No se pudieron cargar las campañas: ${error.message}` })
      setLoading(false)
      return
    }
    setCampanas(data || [])
    const id = seleccionar || campanaId || data?.[0]?.id || ''
    setCampanaId(id)
    if (!id) setLoading(false)
  }

  const cargarDetalle = async (id) => {
    setLoading(true)
    try {
      const { data: tr, error: e1 } = await supabase
        .from('gc_tramos').select('*').eq('campana_id', id).order('cuotas_min', { ascending: false })
      if (e1) throw e1
      const filas = await cargarNomina(id)
      setTramos(tr || [])
      setTramosForm((tr || []).map(t => ({ cuotas_min: t.cuotas_min, valor: t.valor })))
      setNomina(filas)
    } catch (err) {
      setMsg({ tipo: 'error', texto: `Error cargando la campaña: ${err.message}` })
    } finally {
      setLoading(false)
    }
  }

  // Cuando cambian las campañas, refrescar el formulario de la seleccionada
  useEffect(() => { if (campana) setForm(formDesdeCampana(campana)) }, [campanas, campanaId])

  const formDesdeCampana = (c) => ({
    nombre:            c.nombre || '',
    periodo_desde:     mesAInput(c.periodo_desde),
    periodo_hasta:     mesAInput(c.periodo_hasta),
    ultimo_mes_real:   mesAInput(c.ultimo_mes_real),
    dominio_correo:    c.dominio_correo || '',
    fecha_vencimiento: fechaInput(c.fecha_vencimiento),
    envio_desde:       fechaInput(c.envio_desde),
    envio_hasta:       fechaInput(c.envio_hasta),
  })

  // ── Guardar configuración ──
  const guardarConfiguracion = async () => {
    if (!form) return
    if (!form.nombre.trim()) return setMsg({ tipo: 'error', texto: 'La campaña debe tener un nombre.' })
    if (!form.periodo_desde || !form.periodo_hasta || !form.ultimo_mes_real)
      return setMsg({ tipo: 'error', texto: 'Completa la ventana de cuotas y el último mes con datos reales.' })
    if (!(form.periodo_desde <= form.ultimo_mes_real && form.ultimo_mes_real <= form.periodo_hasta))
      return setMsg({ tipo: 'error', texto: 'El último mes real debe estar dentro de la ventana de cuotas.' })
    if (form.envio_desde && form.envio_hasta && form.envio_desde > form.envio_hasta)
      return setMsg({ tipo: 'error', texto: 'La fecha "envío desde" no puede ser posterior a "envío hasta".' })

    const cambios = {
      nombre:            form.nombre.trim(),
      fecha_vencimiento: form.fecha_vencimiento || null,
      envio_desde:       form.envio_desde || null,
      envio_hasta:       form.envio_hasta || null,
    }
    if (campana.estado === 'borrador') {
      Object.assign(cambios, {
        periodo_desde:   inputAMes(form.periodo_desde),
        periodo_hasta:   inputAMes(form.periodo_hasta),
        ultimo_mes_real: inputAMes(form.ultimo_mes_real),
        dominio_correo:  form.dominio_correo.trim().toLowerCase(),
      })
    }

    setTrabajando(true)
    const { error } = await supabase.from('gc_campanas').update(cambios).eq('id', campanaId).select()
    setTrabajando(false)
    if (error) return setMsg({ tipo: 'error', texto: `No se pudo guardar: ${error.message}` })
    setMsg({ tipo: 'ok', texto: campana.estado === 'borrador'
      ? 'Configuración guardada. Si cambiaste la ventana o el último mes real, vuelve a calcular la nómina.'
      : 'Configuración guardada.' })
    await cargarCampanas(campanaId)
  }

  // ── Guardar tramos ──
  const guardarTramos = async () => {
    const limpios = tramosForm.map(t => ({ cuotas_min: Number(t.cuotas_min), valor: Number(t.valor) }))
    if (limpios.length === 0) return setMsg({ tipo: 'error', texto: 'Debe existir al menos un tramo.' })
    if (limpios.some(t => !Number.isInteger(t.cuotas_min) || t.cuotas_min < 1 || !Number.isInteger(t.valor) || t.valor <= 0))
      return setMsg({ tipo: 'error', texto: 'Cada tramo necesita cuotas (1 o más) y un valor mayor a cero, sin decimales.' })
    const set = new Set(limpios.map(t => t.cuotas_min))
    if (set.size !== limpios.length) return setMsg({ tipo: 'error', texto: 'Hay tramos con la misma cantidad de cuotas.' })

    setTrabajando(true)
    try {
      const quitar = tramos.filter(t => !set.has(t.cuotas_min)).map(t => t.id)
      if (quitar.length) {
        const { error } = await supabase.from('gc_tramos').delete().in('id', quitar)
        if (error) throw error
      }
      const { error } = await supabase
        .from('gc_tramos')
        .upsert(limpios.map(t => ({ campana_id: campanaId, ...t })), { onConflict: 'campana_id,cuotas_min' })
      if (error) throw error
      setMsg({ tipo: 'ok', texto: 'Tabla de valores guardada. Vuelve a calcular la nómina para aplicarla.' })
      await cargarDetalle(campanaId)
    } catch (err) {
      setMsg({ tipo: 'error', texto: `No se pudieron guardar los tramos: ${err.message}` })
    } finally {
      setTrabajando(false)
    }
  }

  // ── Acciones de nómina (funciones en la base de datos) ──
  const ejecutar = async (fn, params, okTexto) => {
    setTrabajando(true)
    const { data, error } = await supabase.rpc(fn, params)
    setTrabajando(false)
    if (error) { setMsg({ tipo: 'error', texto: error.message }); return false }
    setMsg({ tipo: 'ok', texto: typeof okTexto === 'function' ? okTexto(data) : okTexto })
    await cargarCampanas(campanaId)
    await cargarDetalle(campanaId)
    return true
  }

  const calcular = () => {
    const hayAjustes = nomina.some(n => n.valor_ajustado !== null)
    setConfirmar({
      titulo: 'Calcular nómina',
      texto: hayAjustes
        ? 'La nómina tiene valores ajustados a mano. Al recalcular, esos ajustes se pierden. ¿Continuar?'
        : 'Se calculará el valor de la GiftCard de cada socio y director activo con la configuración actual.',
      accion: () => ejecutar('gc_calcular_nomina', { p_campana: campanaId },
        (n) => `Nómina calculada: ${n} personas.`),
    })
  }

  const cerrar = () => setConfirmar({
    titulo: 'Cerrar nómina',
    texto: 'Al cerrar, los valores quedan fijos y esta nómina es la base del pedido a CENCOSUD. No se podrá recalcular ni ajustar, salvo que se reabra antes de cargar los códigos.',
    accion: () => ejecutar('gc_cerrar_nomina', { p_campana: campanaId }, 'Nómina cerrada.'),
  })

  const reabrir = () => setConfirmar({
    titulo: 'Reabrir nómina',
    texto: 'La nómina volverá a borrador. Si ya se hizo el pedido a CENCOSUD con estos valores, cualquier cambio debe informarse al proveedor.',
    accion: () => ejecutar('gc_reabrir_nomina', { p_campana: campanaId }, 'Nómina reabierta.'),
  })

  const guardarAjuste = async (quitar = false) => {
    if (!ajuste) return
    const valor = quitar ? null : Number(ajuste.valor)
    if (!quitar && (!Number.isInteger(valor) || valor < 0))
      return setMsg({ tipo: 'error', texto: 'El valor ajustado debe ser un número entero, cero o mayor.' })
    if (!quitar && !ajuste.motivo.trim())
      return setMsg({ tipo: 'error', texto: 'Indica el motivo del ajuste.' })
    const ok = await ejecutar('gc_ajustar_valor',
      { p_nomina: ajuste.fila.id, p_valor: valor, p_motivo: quitar ? null : ajuste.motivo.trim() },
      quitar ? 'Ajuste eliminado.' : 'Valor ajustado.')
    if (ok) setAjuste(null)
  }

  // ── Nueva campaña (copia los tramos de la seleccionada) ──
  const crearCampana = async () => {
    if (!nueva.nombre.trim() || !nueva.periodo_desde || !nueva.periodo_hasta || !nueva.ultimo_mes_real)
      return setMsg({ tipo: 'error', texto: 'Completa nombre, ventana de cuotas y último mes real.' })
    if (!(nueva.periodo_desde <= nueva.ultimo_mes_real && nueva.ultimo_mes_real <= nueva.periodo_hasta))
      return setMsg({ tipo: 'error', texto: 'El último mes real debe estar dentro de la ventana de cuotas.' })
    setTrabajando(true)
    try {
      const { data, error } = await supabase.from('gc_campanas').insert({
        nombre:          nueva.nombre.trim(),
        periodo_desde:   inputAMes(nueva.periodo_desde),
        periodo_hasta:   inputAMes(nueva.periodo_hasta),
        ultimo_mes_real: inputAMes(nueva.ultimo_mes_real),
        dominio_correo:  campana?.dominio_correo || 'hdi.cl',
      }).select().single()
      if (error) throw error
      if (tramos.length) {
        const { error: e2 } = await supabase.from('gc_tramos')
          .insert(tramos.map(t => ({ campana_id: data.id, cuotas_min: t.cuotas_min, valor: t.valor })))
        if (e2) throw e2
      }
      setNueva(null)
      setMsg({ tipo: 'ok', texto: 'Campaña creada con la tabla de valores de la campaña anterior. Revísala antes de calcular.' })
      await cargarCampanas(data.id)
    } catch (err) {
      setMsg({ tipo: 'error', texto: `No se pudo crear la campaña: ${err.message}` })
    } finally {
      setTrabajando(false)
    }
  }

  // ── Resumen y filtros ──
  const resumen = useMemo(() => {
    const map = {}
    nomina.forEach(n => {
      const v = n.valor_final
      if (!map[v]) map[v] = { valor: v, cantidad: 0 }
      map[v].cantidad++
    })
    const filas = Object.values(map).sort((a, b) => b.valor - a.valor)
    return {
      filas,
      total:     filas.reduce((s, f) => s + f.valor * f.cantidad, 0),
      personas:  nomina.length,
      conAlerta: nomina.filter(n => n.alertas?.length).length,
      ajustados: nomina.filter(n => n.valor_ajustado !== null).length,
      enCero:    nomina.filter(n => n.valor_final === 0).length,
    }
  }, [nomina])

  const filasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    const qRut = q.replace(/[^0-9k]/g, '')
    return nomina.filter(n => {
      if (filtro === 'alertas'   && !n.alertas?.length) return false
      if (filtro === 'ajustados' && n.valor_ajustado === null) return false
      if (filtro.startsWith('alerta:') && !n.alertas?.includes(filtro.slice(7))) return false
      if (!q) return true
      return n.nombre?.toLowerCase().includes(q) ||
             (qRut && n.rut?.toLowerCase().replace(/[^0-9k]/g, '').includes(qRut))
    })
  }, [nomina, busqueda, filtro])

  // ── Exportar Excel ──
  const exportarExcel = () => {
    if (!campana || nomina.length === 0) return
    const wb = XLSX.utils.book_new()

    const pedido = [
      ['Pedido a CENCOSUD', campana.nombre],
      ['Estado de la nómina', estado.label],
      [],
      ['Valor GiftCard', 'Cantidad', 'Subtotal'],
      ...resumen.filas.filter(f => f.valor > 0).map(f => [f.valor, f.cantidad, f.valor * f.cantidad]),
      ['Total', resumen.filas.filter(f => f.valor > 0).reduce((s, f) => s + f.cantidad, 0), resumen.total],
    ]
    if (resumen.enCero) pedido.push([], [`Personas con valor $0 (no se compran): ${resumen.enCero}`])
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(pedido), 'Pedido CENCOSUD')

    const detalle = [
      ['N°', 'RUT', 'Nombre', 'Tipo', 'Correo', 'Cuotas reales', 'Cuotas proyectadas', 'Cuotas total',
       'Valor calculado', 'Valor ajustado', 'Motivo ajuste', 'Valor final', 'Alertas', 'Primer pago', 'Último pago'],
      ...nomina.map((n, i) => [
        i + 1, fmtRut(n.rut), n.nombre, n.tipo, n.email,
        n.cuotas_reales, n.cuotas_proyectadas, n.cuotas_total,
        n.valor_calculado, n.valor_ajustado ?? '', n.motivo_ajuste || '', n.valor_final,
        (n.alertas || []).map(a => ALERTAS[a] || a).join('; '),
        fmtMes(n.primer_pago), fmtMes(n.ultimo_pago),
      ]),
    ]
    const hoja = XLSX.utils.aoa_to_sheet(detalle)
    hoja['!cols'] = [{ wch: 5 }, { wch: 13 }, { wch: 38 }, { wch: 9 }, { wch: 32 }, { wch: 8 }, { wch: 8 },
                     { wch: 8 }, { wch: 10 }, { wch: 10 }, { wch: 30 }, { wch: 10 }, { wch: 40 }, { wch: 16 }, { wch: 16 }]
    XLSX.utils.book_append_sheet(wb, hoja, 'Nómina')

    const parametros = [
      ['Campaña', campana.nombre],
      ['Ventana de cuotas', `${fmtMes(campana.periodo_desde)} a ${fmtMes(campana.periodo_hasta)}`],
      ['Último mes con datos reales', fmtMes(campana.ultimo_mes_real)],
      ['Meses posteriores', 'Se suman como cuotas proyectadas'],
      ['Nómina calculada', fmtFechaHora(campana.nomina_calculada_at)],
      ['Nómina cerrada', fmtFechaHora(campana.nomina_cerrada_at)],
      [],
      ['Cuotas desde', 'Valor'],
      ...tramos.map(t => [t.cuotas_min, t.valor]),
      [],
      ['Este archivo contiene datos personales. Uso exclusivo de la directiva.'],
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(parametros), 'Parámetros')

    const hoy = new Date()
    const sello = `${hoy.getFullYear()}${String(hoy.getMonth() + 1).padStart(2, '0')}${String(hoy.getDate()).padStart(2, '0')}`
    const nombreArchivo = `Nomina_${campana.nombre.replace(/[^\w]+/g, '_')}_${sello}.xlsx`
    XLSX.writeFile(wb, nombreArchivo)
  }

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Título */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg" style={{ backgroundColor: '#2d7a4f' }}>
        <CreditCard className="w-5 h-5 text-white" />
        <div>
          <h1 className="text-xl font-bold text-white">GiftCards</h1>
          <p className="text-xs text-green-100">
            {isAdministrador ? 'Campañas, valores y nómina' : 'Consulta de campañas y nómina'}
          </p>
        </div>
      </div>

      <Mensaje msg={msg} onClose={() => setMsg(null)} />

      {/* Selector de campaña */}
      <div className="flex items-end gap-3 flex-wrap">
        <div className="flex-1 min-w-[220px]">
          <Label>Campaña</Label>
          <select value={campanaId} onChange={e => setCampanaId(e.target.value)}
                  className={inputCls} style={{ borderColor: '#2d7a4f' }}>
            {campanas.length === 0 && <option value="">Sin campañas</option>}
            {campanas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
        {campana && (
          <span className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{ backgroundColor: estado.bg, color: estado.color }}>
            {estado.label}
          </span>
        )}
        {isAdministrador && (
          <BotonSecundario onClick={() => setNueva({ nombre: '', periodo_desde: '', periodo_hasta: '', ultimo_mes_real: '' })}>
            <Plus className="w-4 h-4" /> Nueva campaña
          </BotonSecundario>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Spinner className="size-6" /></div>
      ) : !campana ? (
        <p className="text-sm text-muted-foreground text-center py-10">No hay campañas creadas.</p>
      ) : (
        <>
          {/* ── Configuración ── */}
          <div className="rounded-lg border overflow-hidden shadow-sm">
            <SectionHeader icon={Settings} title="Configuración de la campaña" />
            <div className="p-4 space-y-4" style={{ backgroundColor: '#f0f9f2' }}>
              {form && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 lg:col-span-3">
                    <Label>Nombre</Label>
                    <input className={inputCls} style={{ borderColor: '#2d7a4f' }} disabled={!isAdministrador}
                           value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
                  </div>
                  <div>
                    <Label>Cuotas desde</Label>
                    <input type="month" className={inputCls} style={{ borderColor: '#2d7a4f' }} disabled={!editable}
                           value={form.periodo_desde} onChange={e => setForm({ ...form, periodo_desde: e.target.value })} />
                  </div>
                  <div>
                    <Label>Cuotas hasta</Label>
                    <input type="month" className={inputCls} style={{ borderColor: '#2d7a4f' }} disabled={!editable}
                           value={form.periodo_hasta} onChange={e => setForm({ ...form, periodo_hasta: e.target.value })} />
                  </div>
                  <div>
                    <Label>Último mes con datos reales</Label>
                    <input type="month" className={inputCls} style={{ borderColor: '#2d7a4f' }} disabled={!editable}
                           value={form.ultimo_mes_real} onChange={e => setForm({ ...form, ultimo_mes_real: e.target.value })} />
                  </div>
                  <div>
                    <Label>Dominio del correo corporativo</Label>
                    <input className={inputCls} style={{ borderColor: '#2d7a4f' }} disabled={!editable}
                           value={form.dominio_correo} onChange={e => setForm({ ...form, dominio_correo: e.target.value })} />
                  </div>
                  <div>
                    <Label>Envío a socios: desde</Label>
                    <input type="date" className={inputCls} style={{ borderColor: '#2d7a4f' }} disabled={!isAdministrador}
                           value={form.envio_desde} onChange={e => setForm({ ...form, envio_desde: e.target.value })} />
                  </div>
                  <div>
                    <Label>Envío a socios: hasta</Label>
                    <input type="date" className={inputCls} style={{ borderColor: '#2d7a4f' }} disabled={!isAdministrador}
                           value={form.envio_hasta} onChange={e => setForm({ ...form, envio_hasta: e.target.value })} />
                  </div>
                  <div>
                    <Label>Vencimiento de las GiftCards</Label>
                    <input type="date" className={inputCls} style={{ borderColor: '#2d7a4f' }} disabled={!isAdministrador}
                           value={form.fecha_vencimiento} onChange={e => setForm({ ...form, fecha_vencimiento: e.target.value })} />
                  </div>
                </div>
              )}

              <p className="text-xs" style={{ color: '#2d7a4f' }}>
                Las fechas de "Envío a socios" son las que se informarán a los socios en el correo de aviso.
                Pueden quedar vacías hasta que CENCOSUD confirme su fecha de entrega.
              </p>

              {form?.ultimo_mes_real && form?.periodo_hasta && form.ultimo_mes_real < form.periodo_hasta && (
                <p className="text-xs" style={{ color: '#2d7a4f' }}>
                  Se cuentan cuotas reales hasta {fmtMes(inputAMes(form.ultimo_mes_real))}. Los meses siguientes,
                  hasta {fmtMes(inputAMes(form.periodo_hasta))}, se suman como proyectados.
                </p>
              )}

              {isAdministrador && (
                <div className="flex justify-end">
                  <BotonPrimario onClick={guardarConfiguracion} disabled={trabajando}>
                    <Save className="w-4 h-4" /> Guardar configuración
                  </BotonPrimario>
                </div>
              )}

              {/* Tramos */}
              <div className="pt-2">
                <p className="text-sm font-semibold mb-2" style={{ color: '#1e3a2f' }}>Tabla de valores</p>
                <div className="overflow-x-auto rounded border bg-white">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <TH>Desde (cuotas)</TH>
                        <TH right>Valor GiftCard</TH>
                        {editable && <TH right> </TH>}
                      </tr>
                    </thead>
                    <tbody>
                      {tramosForm.map((t, i) => (
                        <tr key={i}>
                          <TD>
                            {editable ? (
                              <input type="number" min="1" step="1" className="w-24 border rounded px-2 py-1 text-sm"
                                     value={t.cuotas_min}
                                     onChange={e => setTramosForm(tramosForm.map((x, j) => j === i ? { ...x, cuotas_min: e.target.value } : x))} />
                            ) : (
                              <span>{t.cuotas_min === Math.max(...tramosForm.map(x => Number(x.cuotas_min))) ? `${t.cuotas_min} o más` : t.cuotas_min}</span>
                            )}
                          </TD>
                          <TD right>
                            {editable ? (
                              <input type="number" min="1" step="1" className="w-32 border rounded px-2 py-1 text-sm text-right"
                                     value={t.valor}
                                     onChange={e => setTramosForm(tramosForm.map((x, j) => j === i ? { ...x, valor: e.target.value } : x))} />
                            ) : fmt(t.valor)}
                          </TD>
                          {editable && (
                            <TD right>
                              <button onClick={() => setTramosForm(tramosForm.filter((_, j) => j !== i))}
                                      className="text-red-700 hover:text-red-900" aria-label="Quitar tramo">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </TD>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {editable && (
                  <div className="flex justify-between gap-3 mt-3 flex-wrap">
                    <BotonSecundario onClick={() => setTramosForm([...tramosForm, { cuotas_min: '', valor: '' }])}>
                      <Plus className="w-4 h-4" /> Agregar tramo
                    </BotonSecundario>
                    <BotonPrimario onClick={guardarTramos} disabled={trabajando}>
                      <Save className="w-4 h-4" /> Guardar tabla de valores
                    </BotonPrimario>
                  </div>
                )}
                {!editable && isAdministrador && (
                  <p className="text-xs mt-2 text-muted-foreground">Con la nómina cerrada no se puede modificar la ventana ni la tabla de valores.</p>
                )}
              </div>
            </div>
          </div>

          {/* ── Nómina ── */}
          <div className="rounded-lg border overflow-hidden shadow-sm">
            <SectionHeader icon={ListChecks} title="Nómina">
              <span className="text-xs text-green-100">
                Calculada: {fmtFechaHora(campana.nomina_calculada_at)}
                {campana.nomina_cerrada_at && ` · Cerrada: ${fmtFechaHora(campana.nomina_cerrada_at)}`}
              </span>
            </SectionHeader>

            <div className="p-4 space-y-4" style={{ backgroundColor: '#f0f9f2' }}>
              {/* Acciones */}
              <div className="flex gap-3 flex-wrap">
                {editable && (
                  <BotonPrimario onClick={calcular} disabled={trabajando}>
                    <Calculator className="w-4 h-4" /> {nomina.length ? 'Recalcular nómina' : 'Calcular nómina'}
                  </BotonPrimario>
                )}
                {editable && nomina.length > 0 && (
                  <BotonSecundario onClick={cerrar} disabled={trabajando}>
                    <Lock className="w-4 h-4" /> Cerrar nómina
                  </BotonSecundario>
                )}
                {isAdministrador && campana.estado === 'nomina_cerrada' && (
                  <BotonSecundario onClick={reabrir} disabled={trabajando}>
                    <Unlock className="w-4 h-4" /> Reabrir nómina
                  </BotonSecundario>
                )}
                {nomina.length > 0 && (
                  <BotonSecundario onClick={exportarExcel}>
                    <Download className="w-4 h-4" /> Exportar Excel
                  </BotonSecundario>
                )}
                {trabajando && <Spinner className="size-5 self-center" />}
              </div>

              {nomina.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  La nómina aún no se ha calculado.
                </p>
              ) : (
                <>
                  {/* Resumen */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      ['Personas', resumen.personas],
                      ['Total a provisionar', fmt(resumen.total)],
                      ['Con alertas', resumen.conAlerta],
                      ['Ajustados a mano', resumen.ajustados],
                    ].map(([k, v]) => (
                      <div key={k} className="bg-white rounded border p-3">
                        <p className="text-xs text-muted-foreground">{k}</p>
                        <p className="text-lg font-bold" style={{ color: '#1e3a2f' }}>{v}</p>
                      </div>
                    ))}
                  </div>

                  <div className="overflow-x-auto rounded border bg-white">
                    <table className="w-full">
                      <thead>
                        <tr><TH>Valor GiftCard</TH><TH right>Cantidad</TH><TH right>Subtotal</TH></tr>
                      </thead>
                      <tbody>
                        {resumen.filas.map(f => (
                          <tr key={f.valor}>
                            <TD>{fmt(f.valor)}{f.valor === 0 && <span className="text-xs text-red-700 ml-2">(no se compra)</span>}</TD>
                            <TD right>{f.cantidad}</TD>
                            <TD right accent>{fmt(f.valor * f.cantidad)}</TD>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ backgroundColor: '#2d7a4f' }}>
                          <td className="px-3 py-2 text-sm font-bold text-white">Total</td>
                          <td className="px-3 py-2 text-sm font-bold text-white text-right">{resumen.personas}</td>
                          <td className="px-3 py-2 text-sm font-bold text-white text-right">{fmt(resumen.total)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Filtros */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <Label>Buscar RUT o nombre</Label>
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-2 top-2 text-gray-400" />
                        <input className={`${inputCls} pl-8`} style={{ borderColor: '#2d7a4f' }}
                               placeholder="Ej: 12345678 o Juan"
                               value={busqueda} onChange={e => setBusqueda(e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <Label>Mostrar</Label>
                      <select className={inputCls} style={{ borderColor: '#2d7a4f' }}
                              value={filtro} onChange={e => setFiltro(e.target.value)}>
                        <option value="todos">Todos</option>
                        <option value="alertas">Solo con alertas</option>
                        <option value="ajustados">Solo ajustados</option>
                        {Object.entries(ALERTAS).map(([k, v]) => (
                          <option key={k} value={`alerta:${k}`}>Alerta: {v}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Detalle */}
                  <div className="overflow-x-auto rounded border bg-white">
                    <table className="w-full">
                      <thead>
                        <tr>
                          <TH>RUT</TH><TH>Nombre</TH><TH>Tipo</TH>
                          <TH right>Reales</TH><TH right>Proy.</TH><TH right>Total</TH>
                          <TH right>Valor</TH><TH>Alertas</TH>
                          {editable && <TH right> </TH>}
                        </tr>
                      </thead>
                      <tbody>
                        {filasFiltradas.length === 0 ? (
                          <tr><td colSpan={9} className="text-center text-sm text-muted-foreground py-6">Sin resultados</td></tr>
                        ) : filasFiltradas.map(n => (
                          <tr key={n.id} className="hover:bg-green-50 transition-colors align-top">
                            <TD className="whitespace-nowrap">{fmtRut(n.rut)}</TD>
                            <TD>
                              {n.nombre}
                              <div className="text-xs text-muted-foreground">{n.email}</div>
                            </TD>
                            <TD>{n.tipo}</TD>
                            <TD right>{n.cuotas_reales}</TD>
                            <TD right>{n.cuotas_proyectadas}</TD>
                            <TD right bold>{n.cuotas_total}</TD>
                            <TD right accent>
                              <span className="font-semibold">{fmt(n.valor_final)}</span>
                              {n.valor_ajustado !== null && (
                                <div className="text-xs" style={{ color: '#7a5c00' }} title={n.motivo_ajuste || ''}>
                                  Ajustado (calc. {fmt(n.valor_calculado)})
                                </div>
                              )}
                            </TD>
                            <TD>
                              <div className="flex flex-wrap gap-1">
                                {(n.alertas || []).map(a => (
                                  <span key={a} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
                                        style={{ backgroundColor: '#fff4cc', color: '#7a5c00' }}>
                                    <AlertTriangle className="w-3 h-3" /> {ALERTAS[a] || a}
                                  </span>
                                ))}
                              </div>
                            </TD>
                            {editable && (
                              <TD right>
                                <button onClick={() => setAjuste({ fila: n, valor: n.valor_ajustado ?? n.valor_calculado, motivo: n.motivo_ajuste || '' })}
                                        className="inline-flex items-center gap-1 text-xs font-medium hover:underline"
                                        style={{ color: '#2d7a4f' }}>
                                  <Pencil className="w-3 h-3" /> Ajustar
                                </button>
                              </TD>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Mostrando {filasFiltradas.length} de {nomina.length}. El Excel exportado incluye además correo, primer y último pago y motivo de cada ajuste.
                  </p>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Modal: ajuste de valor ── */}
      {ajuste && (
        <Modal titulo="Ajustar valor de GiftCard" onClose={() => setAjuste(null)}>
          <div className="text-sm space-y-1">
            <p className="font-semibold">{ajuste.fila.nombre}</p>
            <p className="text-muted-foreground">
              {fmtRut(ajuste.fila.rut)} · {ajuste.fila.cuotas_total} cuotas · Valor calculado {fmt(ajuste.fila.valor_calculado)}
            </p>
          </div>
          <div>
            <Label>Valor ajustado</Label>
            <input type="number" min="0" step="1" className={inputCls} style={{ borderColor: '#2d7a4f' }}
                   value={ajuste.valor} onChange={e => setAjuste({ ...ajuste, valor: e.target.value })} />
          </div>
          <div>
            <Label>Motivo (obligatorio)</Label>
            <textarea rows={3} className={inputCls} style={{ borderColor: '#2d7a4f' }}
                      placeholder="Ej: error de clasificación en dic-2025 y feb-2026, confirmado por el Directorio"
                      value={ajuste.motivo} onChange={e => setAjuste({ ...ajuste, motivo: e.target.value })} />
          </div>
          <div className="flex justify-between gap-2 flex-wrap">
            {ajuste.fila.valor_ajustado !== null ? (
              <BotonSecundario onClick={() => guardarAjuste(true)} disabled={trabajando}>Quitar ajuste</BotonSecundario>
            ) : <span />}
            <div className="flex gap-2">
              <BotonSecundario onClick={() => setAjuste(null)}>Cancelar</BotonSecundario>
              <BotonPrimario onClick={() => guardarAjuste(false)} disabled={trabajando}>Guardar</BotonPrimario>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Modal: confirmación ── */}
      {confirmar && (
        <Modal titulo={confirmar.titulo} onClose={() => setConfirmar(null)}>
          <p className="text-sm">{confirmar.texto}</p>
          <div className="flex justify-end gap-2">
            <BotonSecundario onClick={() => setConfirmar(null)}>Cancelar</BotonSecundario>
            <BotonPrimario disabled={trabajando}
                           onClick={async () => { const a = confirmar.accion; setConfirmar(null); await a() }}>
              Confirmar
            </BotonPrimario>
          </div>
        </Modal>
      )}

      {/* ── Modal: nueva campaña ── */}
      {nueva && (
        <Modal titulo="Nueva campaña" onClose={() => setNueva(null)}>
          <div>
            <Label>Nombre</Label>
            <input className={inputCls} style={{ borderColor: '#2d7a4f' }} placeholder="Ej: GiftCard Junio 2027"
                   value={nueva.nombre} onChange={e => setNueva({ ...nueva, nombre: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Cuotas desde</Label>
              <input type="month" className={inputCls} style={{ borderColor: '#2d7a4f' }}
                     value={nueva.periodo_desde} onChange={e => setNueva({ ...nueva, periodo_desde: e.target.value })} />
            </div>
            <div>
              <Label>Cuotas hasta</Label>
              <input type="month" className={inputCls} style={{ borderColor: '#2d7a4f' }}
                     value={nueva.periodo_hasta} onChange={e => setNueva({ ...nueva, periodo_hasta: e.target.value })} />
            </div>
            <div className="col-span-2">
              <Label>Último mes con datos reales</Label>
              <input type="month" className={inputCls} style={{ borderColor: '#2d7a4f' }}
                     value={nueva.ultimo_mes_real} onChange={e => setNueva({ ...nueva, ultimo_mes_real: e.target.value })} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            La tabla de valores se copia de la campaña seleccionada ({campana?.nombre || 'ninguna'}) y se puede editar después.
          </p>
          <div className="flex justify-end gap-2">
            <BotonSecundario onClick={() => setNueva(null)}>Cancelar</BotonSecundario>
            <BotonPrimario onClick={crearCampana} disabled={trabajando}>Crear</BotonPrimario>
          </div>
        </Modal>
      )}
    </div>
  )
}
