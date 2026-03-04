import React, { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Spinner } from '../components/ui/spinner'
import { Alert } from '../components/ui/alert'

export default function AvisosPage() {
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
    const { data } = await supabase
      .from('avisos')
      .select('*')
      .order('created_at', { ascending: false })

    setAvisos(data || [])
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    const { data, error } = await supabase
      .from('avisos')
      .insert({
        titulo,
        contenido,
        creado_por: user.id,
      })
      .select()
      .single()

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    setAvisos([data, ...avisos])
    setOpen(false)
    setTitulo('')
    setContenido('')
    setSaving(false)
  }

  const handleDelete = async (id) => {
    await supabase.from('avisos').delete().eq('id', id)
    setAvisos(avisos.filter(a => a.id !== id))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between">
          <h1 className="text-3xl font-bold">Avisos</h1>

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
                    <Textarea value={contenido} onChange={e => setContenido(e.target.value)} />
                  </div>

                  <Button disabled={saving}>
                    {saving ? 'Guardando...' : 'Publicar'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {loading ? (
          <Spinner />
        ) : (
          avisos.map(a => (
            <Card key={a.id}>
              <CardContent>
                <div className="flex justify-between">
                  <h3 className="font-semibold">{a.titulo}</h3>
                  {canManage && (
                    <Button variant="ghost" onClick={() => handleDelete(a.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <p className="text-sm">{a.contenido}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
  )
}
