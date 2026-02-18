import React, { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { AppLayout } from '../components/layout/AppLayout'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
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

  const documentosPorCategoria = (categoria) =>
    documentos.filter(d => d.categoria === categoria)

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold">Documentos</h1>
          <p className="text-muted-foreground">Documentación oficial</p>
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

            {['estatutos', 'actas', 'beneficios'].map(cat => (
              <TabsContent key={cat} value={cat}>
                {documentosPorCategoria(cat).length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      No hay documentos
                    </CardContent>
                  </Card>
                ) : (
                  documentosPorCategoria(cat).map(doc => (
                    <Card key={doc.id}>
                      <CardContent className="pt-6 flex justify-between">
                        <span>{doc.titulo}</span>
                        <Button asChild size="sm">
                          <a href={doc.archivo_url} target="_blank" rel="noreferrer">
                            Ver
                          </a>
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </AppLayout>
  )
}
