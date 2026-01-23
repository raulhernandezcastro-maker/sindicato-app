import React, { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { AppLayout } from '../components/layout/AppLayout'
import { Spinner } from '../components/ui/spinner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { Alert } from '../components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'

export function DocumentosPage() {
  const { isAdministrador, isDirector, user } = useAuth()

  const [documentos, setDocumentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({ titulo: '', categoria: 'estatutos' })
  const [selectedFile, setSelectedFile] = useState(null)
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('estatutos')

  const canManage = isAdministrador || isDirector

  useEffect(() => {
    loadDocumentos()
  }, [])

  const loadDocumentos = async () => {
    try {
      const { data, error } = await supabase
        .from('documentos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setDocumentos(data || [])
    } catch (err) {
      console.error('Error loading documentos:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    setSelectedFile(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setFormLoading(true)

    if (!selectedFile) {
      setFormError('Selecciona un archivo')
      setFormLoading(false)
      return
    }

    if (!user?.id) {
      setFormError('Usuario no autenticado')
      setFormLoading(false)
      return
    }

    try {
      const ext = selectedFile.name.split('.').pop()
      const safeTitle = formData.titulo.replace(/\s+/g, '_').toLowerCase()
      const filePath = `${Date.now()}_${safeTitle}.${ext}`

      // 1️⃣ Subir archivo a Storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile)

      if (uploadError) throw uploadError

      // 2️⃣ Obtener URL pública
      const { data: publicUrlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath)

      const publicUrl = publicUrlData.publicUrl

      // 3️⃣ Guardar registro en la tabla documentos
      const { data, error } = await supabase
        .from('documentos')
        .insert({
          titulo: formData.titulo,
          categoria: formData.categoria,
          archivo_path: filePath,   // ✅ CLAVE
          archivo_url: publicUrl,   // ✅ CLAVE
          subido_por: user.id,
        })
        .select()
        .single()

      if (error) throw error

      setDocumentos([data, ...documentos])
      setDialogOpen(false)
      setFormData({ titulo: '', categoria: 'estatutos' })
      setSelectedFile(null)
    } catch (err) {
      console.error('Error completo:', err)
      setFormError(err.message || 'Error al subir el documento')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (documento) => {
    if (!window.confirm('¿Eliminar este documento?')) return

    try {
      const { error } = await supabase
        .from('documentos')
        .delete()
        .eq('id', documento.id)

      if (error) throw error

      setDocumentos(documentos.filter(d => d.id !== documento.id))
    } catch (err) {
      console.error(err)
      alert('Error eliminando documento')
    }
  }

  const documentosPorCategoria = (categoria) =>
    documentos.filter(d => d.categoria === categoria)

  const DocumentosList = ({ categoria }) => {
    const docs = documentosPorCategoria(categoria)

    if (docs.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No hay documentos</p>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-3">
        {docs.map((doc) => (
          <Card key={doc.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">{doc.titulo}</h3>

                <div className="flex space-x-2">
                  <Button size="sm" asChild>
                    <a
                      href={doc.archivo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ver
                    </a>
                  </Button>

                  {canManage && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(doc)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex justify-between">
          <div>
            <h1 className="text-3xl font-bold">Documentos</h1>
            <p className="text-muted-foreground">Documentación oficial</p>
          </div>

          {canManage && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Subir Documento
                </Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Subir Documento</DialogTitle>
                  <DialogDescription>
                    Completa los datos
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {formError && (
                    <Alert variant="destructive">{formError}</Alert>
                  )}

                  <div>
                    <Label>Título</Label>
                    <Input
                      value={formData.titulo}
                      onChange={(e) =>
                        setFormData({ ...formData, titulo: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label>Categoría</Label>
                    <Select
                      value={formData.categoria}
                      onValueChange={(v) =>
                        setFormData({ ...formData, categoria: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="estatutos">Estatutos</SelectItem>
                        <SelectItem value="actas">Actas</SelectItem>
                        <SelectItem value="beneficios">Beneficios</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Archivo (PDF)</Label>
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      required
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {formLoading ? 'Subiendo...' : 'Subir'}
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
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="estatutos">Estatutos</TabsTrigger>
              <TabsTrigger value="actas">Actas</TabsTrigger>
              <TabsTrigger value="beneficios">Beneficios</TabsTrigger>
            </TabsList>

            <TabsContent value="estatutos">
              <DocumentosList categoria="estatutos" />
            </TabsContent>
            <TabsContent value="actas">
              <DocumentosList categoria="actas" />
            </TabsContent>
            <TabsContent value="beneficios">
              <DocumentosList categoria="beneficios" />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  )
}
