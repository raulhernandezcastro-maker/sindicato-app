import React, { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { AppLayout } from '../components/layout/AppLayout'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Spinner } from '../components/ui/spinner'
import { Alert } from '../components/ui/alert'

export function AvisosPage() {
  const { user, isAdministrador, isDirector } = useAuth()
  const [avisos, setAvisos] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [contenido, setContenido] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const canManage = isAdministrador || isDirector

  useEffect(() => {
    loadAvisos()
  }, [])

  const loadAvisos = async () => {
    try {
      const { data, error } = await supabase
        .from('avisos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setAvisos(data || [])
    } catch (err) {
      console.error('Error cargando avisos:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    if (!titulo || !contenido) {
      setError('Completa todos los campos')
      setSaving(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('avisos')
        .insert({
          titulo,
          contenido,
          creado_por: user.id, // 🔑 CLAVE
        })
        .select()
        .single()

      if (error) throw error

      setAvisos([data, ...avisos])
      setOpen(false)
      setTitulo('')
      setContenido('')
    } catch (err) {
      console.error(err)
      setError(err.message || 'Error al crear aviso')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este aviso?')) return

    try {
      const { error } = await supabase
        .from('avisos')
        .delete()
        .eq('id', id)

      if (error) throw error

      setAvisos(avisos.filter(a => a.id !== id))
    } catch (err) {
      console.error(err)
      alert('Error eliminando aviso')
    }
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Avisos</h1>
            <p className="text-muted-foreground">Comunicados oficiales</p>
          </div>

          {canManage && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Aviso
                </Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Aviso</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && <Alert variant="destructive">{error}</Alert>}

                  <div>
                    <Label>Título</Label>
                    <Input value={titulo} onChange={e => setTitulo(e.target.value)} />
                  </div>

                  <div>
                    <Label>Contenido</Label>
                    <Textarea
                      rows={4}
                      value={contenido}
                      onChange={e => setContenido(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving ? 'Guardando…' : 'Publicar'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner className="w-8 h-8" />
          </div>
        ) : (
          <div className="space-y-4">
            {avisos.length === 0 && (
              <p className="text-center text-muted-foreground">No hay avisos</p>
            )}

            {avisos.map(aviso => (
              <Card key={aviso.id}>
                <CardContent className="pt-6 space-y-2">
                  <div className="flex justify-between">
                    <h3 className="font-semibold">{aviso.titulo}</h3>

                    {canManage && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(aviso.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {aviso.contenido}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
