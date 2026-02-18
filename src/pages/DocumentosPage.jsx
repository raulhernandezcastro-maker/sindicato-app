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

export default function DocumentosPage() {
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
    setSelectedFile(e.target.files?.[0] || null)
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

    try {
      const ext = selectedFile.name.split('.').pop()
      const safeTitle = formData.titulo.replace(/\s+/g, '_').toLowerCase()
      const filePath = `${Date.now()}_${safeTitle}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile)

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath)

      const { data, error } = await supabase
        .from('documentos')
        .insert({
          titulo: formData.titulo,
          categoria: formData.categoria,
          archivo_path: filePath,
          archivo_url: publicUrlData.publicUrl,
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
      setFormError(err.message || 'Error al subir documento')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (doc) => {
    if (!confirm('¿Eliminar este documento?')) return

    await supabase.from('documentos').delete().eq('id', doc.id)
    setDocumentos(documentos.filter(d => d.id !== doc.id))
  }

  const documentosPorCategoria = (cat) =>
    documentos.filter(d => d.categoria === cat)

  const DocumentosList = ({ categoria }) => {
    const docs = documentosPorCategoria(categoria)

    if (!docs.length) {
      return (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No hay documentos
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-3">
        {docs.map(doc => (
          <Card key={doc.id}>
            <CardContent className="pt-6 flex justify-between items-center">
              <h3 className="font-semibold">{doc.titulo}</h3>
              <div className="flex gap-2">
                <Button size="sm" asChild>
                  <a href={doc.archivo_url} target="_blank">Ver</a>
                </Button>
                {canManage && (
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(doc)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
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
        <h1 className="text-3xl font-bold">Documentos</h1>

        {loading ? (
          <Spinner className="mx-auto" />
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="estatutos">Estatutos</TabsTrigger>
              <TabsTrigger value="actas">Actas</TabsTrigger>
              <TabsTrigger value="beneficios">Beneficios</TabsTrigger>
            </TabsList>

            <TabsContent value="estatutos"><DocumentosList categoria="estatutos" /></TabsContent>
            <TabsContent value="actas"><DocumentosList categoria="actas" /></TabsContent>
            <TabsContent value="beneficios"><DocumentosList categoria="beneficios" /></TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  )
}
