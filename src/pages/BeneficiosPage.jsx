import React, { useEffect, useState } from 'react'
import { Plus, Trash2, Gift, X, ChevronLeft, ChevronRight, ChevronDown, HelpCircle, ImageIcon } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { Spinner } from '../components/ui/spinner'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Alert } from '../components/ui/alert'
import WhatsAppButton from '../components/ui/WhatsAppButton'

// Etiqueta según origen del beneficio
const TIPO_BADGE = {
  convenio:  { label: 'Convenio',            bg: '#e6f4ea', fg: '#1e3a2f' },
  universal: { label: 'Beneficio de la empresa', bg: '#fef3c7', fg: '#92400e' },
  mixto:     { label: 'Convenio + Empresa',  bg: '#e0edf7', fg: '#1e3a5f' },
}

function TipoBadge({ tipo }) {
  const t = TIPO_BADGE[tipo] || TIPO_BADGE.convenio
  return (
    <span
      className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ backgroundColor: t.bg, color: t.fg }}
    >
      {t.label}
    </span>
  )
}

export default function BeneficiosPage() {
  const { isAdministrador, user } = useAuth()

  const [beneficios, setBeneficios]   = useState([])
  const [preguntas, setPreguntas]     = useState({}) // { beneficio_id: [ {id, pregunta, respuesta, orden} ] }
  const [loading, setLoading]         = useState(true)
  const [dialogOpen, setDialogOpen]   = useState(false)
  const [formData, setFormData]       = useState({ titulo: '', descripcion: '' })
  const [selectedFile, setSelectedFile] = useState(null)
  const [formError, setFormError]     = useState('')
  const [formLoading, setFormLoading] = useState(false)

  // Ficha de detalle (índice del beneficio abierto)
  const [detailIdx, setDetailIdx]     = useState(null)
  const [openPregunta, setOpenPregunta] = useState(null)

  // Lightbox (zoom de imagen)
  const [lightboxIdx, setLightboxIdx] = useState(null)

  useEffect(() => { loadBeneficios(); loadPreguntas() }, [])

  const loadBeneficios = async () => {
    try {
      const { data, error } = await supabase
        .from('beneficios')
        .select('*')
        .order('titulo', { ascending: true })
      if (error) throw error
      setBeneficios(data || [])
    } catch (err) {
      console.error('Error loading beneficios:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadPreguntas = async () => {
    try {
      const { data, error } = await supabase
        .from('beneficio_preguntas')
        .select('*')
        .order('orden', { ascending: true })
      if (error) throw error
      const map = {}
      for (const p of (data || [])) {
        if (!map[p.beneficio_id]) map[p.beneficio_id] = []
        map[p.beneficio_id].push(p)
      }
      setPreguntas(map)
    } catch (err) {
      console.error('Error loading preguntas:', err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setFormLoading(true)

    if (!selectedFile) { setFormError('Selecciona una imagen'); setFormLoading(false); return }
    if (!user?.id)     { setFormError('Usuario no autenticado'); setFormLoading(false); return }

    const MIME_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp']
    if (!MIME_PERMITIDOS.includes(selectedFile.type)) {
      setFormError('Solo se permiten imágenes JPG, PNG o WEBP')
      setFormLoading(false)
      return
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setFormError('La imagen no puede superar los 5MB')
      setFormLoading(false)
      return
    }

    try {
      const ext = selectedFile.name.split('.').pop().toLowerCase()
      const safeTitle = formData.titulo
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/ñ/g, 'n').replace(/Ñ/g, 'N')
        .replace(/[^a-zA-Z0-9\s_-]/g, '')
        .replace(/\s+/g, '_')
        .toLowerCase()
      const imagenPath = `${Date.now()}_${safeTitle}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('beneficios').upload(imagenPath, selectedFile, { contentType: selectedFile.type })
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('beneficios').getPublicUrl(imagenPath)

      const { data, error } = await supabase
        .from('beneficios')
        .insert({
          titulo: formData.titulo,
          descripcion: formData.descripcion || null,
          imagen_path: imagenPath,
          imagen_url: urlData.publicUrl,
          subido_por: user.id,
        })
        .select().single()

      if (error) throw error

      setBeneficios(prev => [...prev, data].sort((a, b) => a.titulo.localeCompare(b.titulo)))
      setDialogOpen(false)
      setFormData({ titulo: '', descripcion: '' })
      setSelectedFile(null)
    } catch (err) {
      setFormError(err.message || 'Error al subir el beneficio')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (beneficio) => {
    if (!window.confirm(`¿Eliminar "${beneficio.titulo}"?`)) return
    try {
      if (beneficio.imagen_path) {
        await supabase.storage.from('beneficios').remove([beneficio.imagen_path])
      }
      const { error } = await supabase.from('beneficios').delete().eq('id', beneficio.id)
      if (error) throw error
      setBeneficios(prev => prev.filter(b => b.id !== beneficio.id))
      setDetailIdx(null)
      if (lightboxIdx !== null) setLightboxIdx(null)
    } catch (err) {
      alert('Error eliminando beneficio')
    }
  }

  // Ficha de detalle
  const openDetail = (idx) => { setDetailIdx(idx); setOpenPregunta(null) }
  const closeDetail = () => { setDetailIdx(null); setOpenPregunta(null) }

  // Lightbox navigation
  const openLightbox = (idx) => setLightboxIdx(idx)
  const closeLightbox = () => setLightboxIdx(null)
  const prevLightbox = () => setLightboxIdx(i => (i - 1 + beneficios.length) % beneficios.length)
  const nextLightbox = () => setLightboxIdx(i => (i + 1) % beneficios.length)

  useEffect(() => {
    if (lightboxIdx === null) return
    const handler = (e) => {
      if (e.key === 'ArrowLeft')  prevLightbox()
      if (e.key === 'ArrowRight') nextLightbox()
      if (e.key === 'Escape')     closeLightbox()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightboxIdx])

  const detalle = detailIdx !== null ? beneficios[detailIdx] : null
  const detallePreguntas = detalle ? (preguntas[detalle.id] || []) : []

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* ── Encabezado ── */}
      <div className="flex items-center justify-between px-4 py-3 rounded-lg"
           style={{ backgroundColor: '#2d7a4f' }}>
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-white" />
          <div>
            <h1 className="text-xl font-bold text-white">Beneficios</h1>
            <p className="text-xs text-green-100">
              {beneficios.length} beneficio{beneficios.length !== 1 ? 's' : ''} disponible{beneficios.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {isAdministrador && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" style={{ backgroundColor: '#7CBE80', color: '#003d18' }}>
                <Plus className="w-4 h-4 mr-1" />
                Agregar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar Beneficio</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {formError && <Alert variant="destructive">{formError}</Alert>}
                <div>
                  <Label>Nombre del beneficio *</Label>
                  <Input
                    value={formData.titulo}
                    onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                    placeholder="Ej: Bono por Antigüedad"
                    required
                  />
                </div>
                <div>
                  <Label>Descripción breve (opcional)</Label>
                  <Input
                    value={formData.descripcion}
                    onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Ej: Bono anual según años de servicio"
                  />
                </div>
                <div>
                  <Label>Imagen (JPG, PNG o WEBP — máx 5MB) *</Label>
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={e => setSelectedFile(e.target.files?.[0])}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={formLoading} style={{ backgroundColor: '#2d7a4f', color: 'white' }}>
                    {formLoading ? 'Subiendo...' : 'Agregar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* ── Galería ── */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner className="w-8 h-8" /></div>
      ) : beneficios.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Gift className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No hay beneficios publicados aún</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 px-1">
            {beneficios.map((b, idx) => {
              const nPreg = (preguntas[b.id] || []).length
              return (
                <div
                  key={b.id}
                  className="rounded-xl overflow-hidden border shadow-sm bg-white cursor-pointer group relative"
                  style={{ transition: 'transform 0.15s' }}
                  onClick={() => openDetail(idx)}
                >
                  {/* Imagen (o fallback si no tiene) */}
                  <div className="overflow-hidden flex items-center justify-center" style={{ height: '180px' }}>
                    {b.imagen_url ? (
                      <img
                        src={b.imagen_url}
                        alt={b.titulo}
                        className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-200 bg-white"
                        loading="lazy"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex flex-col items-center justify-center gap-2 px-3 text-center"
                        style={{ backgroundColor: '#1e3a2f' }}
                      >
                        <Gift className="w-8 h-8" style={{ color: '#7CBE80' }} />
                        <p className="text-xs font-semibold text-white leading-tight">{b.titulo}</p>
                      </div>
                    )}
                  </div>
                  {/* Título */}
                  <div className="px-2 py-2" style={{ backgroundColor: '#f0f9f2' }}>
                    <p className="text-xs font-semibold leading-tight text-center" style={{ color: '#2d7a4f' }}>
                      {b.titulo}
                    </p>
                    {b.descripcion && (
                      <p className="text-xs text-muted-foreground text-center mt-0.5 leading-tight">
                        {b.descripcion}
                      </p>
                    )}
                    {nPreg > 0 && (
                      <p className="flex items-center justify-center gap-1 text-[10px] mt-1" style={{ color: '#2d7a4f' }}>
                        <HelpCircle className="w-3 h-3" />
                        {nPreg} pregunta{nPreg !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  {/* Botón eliminar — solo admin */}
                  {isAdministrador && (
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(b) }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
          <WhatsAppButton />
        </>
      )}

      {/* ── Ficha de detalle (info + preguntas) ── */}
      <Dialog open={detalle !== null} onOpenChange={(open) => { if (!open) closeDetail() }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {detalle && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-3 pr-6">
                  <DialogTitle className="text-left" style={{ color: '#1e3a2f' }}>
                    {detalle.titulo}
                  </DialogTitle>
                  <TipoBadge tipo={detalle.tipo} />
                </div>
              </DialogHeader>

              {/* Imagen (clic para ampliar) o fallback */}
              {detalle.imagen_url ? (
                <button
                  className="w-full rounded-lg overflow-hidden border bg-white"
                  onClick={() => openLightbox(detailIdx)}
                  title="Ampliar imagen"
                >
                  <img
                    src={detalle.imagen_url}
                    alt={detalle.titulo}
                    className="w-full max-h-64 object-contain p-2"
                  />
                </button>
              ) : (
                <div className="w-full rounded-lg flex items-center justify-center py-8" style={{ backgroundColor: '#f0f9f2' }}>
                  <ImageIcon className="w-8 h-8" style={{ color: '#7CBE80' }} />
                </div>
              )}

              {detalle.descripcion && (
                <p className="text-sm text-muted-foreground">{detalle.descripcion}</p>
              )}

              {/* Preguntas frecuentes (acordeón) */}
              {detallePreguntas.length > 0 ? (
                <div className="space-y-2 mt-1">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#2d7a4f' }}>
                    Preguntas frecuentes
                  </p>
                  {detallePreguntas.map((p) => {
                    const abierta = openPregunta === p.id
                    return (
                      <div key={p.id} className="rounded-lg border overflow-hidden" style={{ borderColor: '#d7e8dc' }}>
                        <button
                          className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium"
                          style={{ backgroundColor: abierta ? '#f0f9f2' : 'white', color: '#1e3a2f' }}
                          onClick={() => setOpenPregunta(abierta ? null : p.id)}
                        >
                          <span>{p.pregunta}</span>
                          <ChevronDown
                            className="w-4 h-4 shrink-0 transition-transform"
                            style={{ transform: abierta ? 'rotate(180deg)' : 'none', color: '#2d7a4f' }}
                          />
                        </button>
                        {abierta && (
                          <div className="px-3 py-2.5 text-sm text-gray-700 border-t" style={{ borderColor: '#e6f0e9' }}>
                            {p.respuesta}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic mt-1">
                  Aún no hay preguntas para este beneficio.
                </p>
              )}

              {isAdministrador && (
                <div className="flex justify-end pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(detalle)}
                    style={{ borderColor: '#ef4444', color: '#ef4444' }}
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Eliminar
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Lightbox (zoom de imagen) ── */}
      {lightboxIdx !== null && beneficios[lightboxIdx] && beneficios[lightboxIdx].imagen_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85"
          onClick={closeLightbox}
        >
          <button
            className="absolute top-4 right-4 text-white bg-black/40 rounded-full p-2 hover:bg-black/60"
            onClick={closeLightbox}
          >
            <X className="w-6 h-6" />
          </button>

          {beneficios.length > 1 && (
            <button
              className="absolute left-2 text-white bg-black/40 rounded-full p-2 hover:bg-black/60"
              onClick={e => { e.stopPropagation(); prevLightbox() }}
            >
              <ChevronLeft className="w-7 h-7" />
            </button>
          )}

          <div
            className="max-w-2xl w-full mx-12 flex flex-col items-center gap-3"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={beneficios[lightboxIdx].imagen_url}
              alt={beneficios[lightboxIdx].titulo}
              className="w-full rounded-xl shadow-2xl object-contain max-h-[75vh]"
            />
            <div className="text-center">
              <p className="text-white font-bold text-lg">{beneficios[lightboxIdx].titulo}</p>
              {beneficios[lightboxIdx].descripcion && (
                <p className="text-gray-300 text-sm mt-1">{beneficios[lightboxIdx].descripcion}</p>
              )}
              <p className="text-gray-500 text-xs mt-2">{lightboxIdx + 1} de {beneficios.length}</p>
            </div>
          </div>

          {beneficios.length > 1 && (
            <button
              className="absolute right-2 text-white bg-black/40 rounded-full p-2 hover:bg-black/60"
              onClick={e => { e.stopPropagation(); nextLightbox() }}
            >
              <ChevronRight className="w-7 h-7" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
