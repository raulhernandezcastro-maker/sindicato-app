import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'
import { Spinner } from '../components/ui/spinner'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { FileText, FolderOpen, Users, Phone, Plus, Pencil, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function HomePage() {
  const { isAdministrador } = useAuth()
  const [ultimoAviso, setUltimoAviso]   = useState(null)
  const [documentos, setDocumentos]     = useState([])
  const [directores, setDirectores]     = useState([])
  const [loading, setLoading]           = useState(true)

  // Dialog directores
  const [dirOpen, setDirOpen]           = useState(false)
  const [editando, setEditando]         = useState(null) // null = nuevo
  const [dirForm, setDirForm]           = useState({ nombre: '', telefono: '' })
  const [savingDir, setSavingDir]       = useState(false)

  useEffect(() => { loadHomeData() }, [])

  const loadHomeData = async () => {
    try {
      setLoading(true)
      const [{ data: avisos }, { data: docs }, { data: dirs }] = await Promise.all([
        supabase.from('avisos').select('*').order('created_at', { ascending: false }).limit(1),
        supabase.from('documentos').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('directivos').select('*').order('created_at', { ascending: true }),
      ])
      setUltimoAviso(avisos?.[0] || null)
      setDocumentos(docs || [])
      setDirectores(dirs || [])
    } catch (err) {
      console.error('Error cargando inicio:', err)
    } finally {
      setLoading(false)
    }
  }

  const abrirNuevo = () => {
    setEditando(null)
    setDirForm({ nombre: '', telefono: '' })
    setDirOpen(true)
  }

  const abrirEditar = (dir) => {
    setEditando(dir)
    setDirForm({ nombre: dir.nombre, celular: dir.telefono })
    setDirOpen(true)
  }

  const guardarDirector = async () => {
    if (!dirForm.nombre.trim() || !dirForm.telefono.trim()) return
    setSavingDir(true)
    try {
      if (editando) {
        await supabase.from('directivos').update(dirForm).eq('id', editando.id)
        setDirectores(prev => prev.map(d => d.id === editando.id ? { ...d, ...dirForm } : d))
      } else {
        const { data } = await supabase.from('directivos').insert(dirForm).select().single()
        setDirectores(prev => [...prev, data])
      }
      setDirOpen(false)
    } catch (err) {
      console.error('Error guardando director:', err)
    } finally {
      setSavingDir(false)
    }
  }

  const eliminarDirector = async (id) => {
    await supabase.from('directivos').delete().eq('id', id)
    setDirectores(prev => prev.filter(d => d.id !== id))
  }

  // Formatea celular para WhatsApp (quita espacios, +, guiones)
  const whatsappUrl = (celular) => {
    const num = String(celular).replace(/[\s+\-()]/g, '')
    // Si empieza con 9 (Chile sin código país), agrega +56
    const full = num.startsWith('56') ? num : `56${num}`
    return `https://wa.me/${full}`
  }

  // Título de sección con los colores del sindicato
  const SectionTitle = ({ icon: Icon, title }) => (
    <div className="flex items-center gap-2 px-4 py-2 rounded-t-lg"
         style={{ backgroundColor: '#2d7a4f' }}>
      <Icon className="w-4 h-4 text-white" />
      <span className="font-semibold text-white text-sm">{title}</span>
    </div>
  )

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

   // {/* ── Encabezado ── */}
   //   <div className="flex items-center gap-4">
   //     <img src="/logo.png" alt="Logo" className="w-16 h-16 object-contain rounded-full hidden md:block" />
   //     <div>
   //       <h1 className="text-2xl font-bold" style={{ color: '#2d7a4f' }}>
   //         Sindicato Interempresas Liberty Seguros
   //       </h1>
   //       <p className="text-muted-foreground text-sm">Bienvenido al portal del Sindicato</p>
   //     </div>
   //   </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner className="w-8 h-8" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* ── Último Aviso ── */}
          <div className="rounded-lg border overflow-hidden">
            <SectionTitle icon={FileText} title="Último Aviso" />
            <div className="p-4" style={{ backgroundColor: '#f0f9f2' }}>
              {ultimoAviso ? (
                <>
                  <h3 className="font-semibold mb-1">{ultimoAviso.titulo}</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {ultimoAviso.contenido}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(ultimoAviso.created_at).toLocaleDateString('es-CL')}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No hay avisos publicados</p>
              )}
            </div>
          </div>

          {/* ── Últimos Documentos ── */}
          <div className="rounded-lg border overflow-hidden">
            <SectionTitle icon={FolderOpen} title="Últimos Documentos" />
            <div className="p-4" style={{ backgroundColor: '#f0f9f2' }}>
              {documentos.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay documentos disponibles</p>
              ) : (
                <ul className="space-y-2">
                  {documentos.map(doc => (
                    <li key={doc.id}>
                      <a
                        href={doc.archivo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm hover:underline"
                        style={{ color: '#2d7a4f' }}
                      >
                        {doc.titulo}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* ── Directores ── */}
          <div className="rounded-lg border overflow-hidden md:col-span-2">
            <div className="flex items-center justify-between px-4 py-2 rounded-t-lg"
                 style={{ backgroundColor: '#2d7a4f' }}>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-white" />
                <span className="font-semibold text-white text-sm">Directorio</span>
              </div>
              {isAdministrador && (
                <button
                  onClick={abrirNuevo}
                  className="text-white hover:text-green-200 transition-colors"
                  title="Agregar director"
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}
            </div>
            <div className="p-4" style={{ backgroundColor: '#f0f9f2' }}>
              {directores.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay directores registrados.
                  {isAdministrador && ' Haz clic en + para agregar.'}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {directores.map(dir => (
                    <div key={dir.id}
                         className="flex items-center justify-between p-3 rounded-lg border bg-white shadow-sm">
                      <div>
                        <p className="text-sm font-semibold">{dir.nombre}</p>
                        <a
                          href={whatsappUrl(dir.telefono)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs mt-1 font-medium"
                          style={{ color: '#2d7a4f' }}
                        >
                          <Phone className="w-3 h-3" />
                          {dir.telefono}
                        </a>
                      </div>
                      {isAdministrador && (
                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={() => abrirEditar(dir)}
                            className="text-gray-400 hover:text-green-700 p-1"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => eliminarDirector(dir.id)}
                            className="text-gray-400 hover:text-red-500 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* ── Dialog agregar/editar director ── */}
      <Dialog open={dirOpen} onOpenChange={setDirOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar Director' : 'Agregar Director'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre completo *</Label>
              <Input
                value={dirForm.nombre}
                onChange={e => setDirForm({ ...dirForm, nombre: e.target.value })}
                placeholder="Ej: Juan Pérez González"
              />
            </div>
            <div>
              <Label>Número de celular * (con código país, ej: +56912345678)</Label>
              <Input
                value={dirForm.telefono}
                onChange={e => setDirForm({ ...dirForm, telefono: e.target.value })}
                placeholder="+56912345678"
              />
            </div>
            <Button
              onClick={guardarDirector}
              disabled={savingDir || !dirForm.nombre.trim() || !dirForm.telefono.trim()}
              className="w-full"
              style={{ backgroundColor: '#2d7a4f' }}
            >
              {savingDir ? 'Guardando...' : editando ? 'Guardar cambios' : 'Agregar Director'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
