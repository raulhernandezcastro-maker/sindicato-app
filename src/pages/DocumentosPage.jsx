import React, { useEffect, useState } from 'react';
import { Plus, FileText, Trash2, Upload } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { AppLayout } from '../components/layout/AppLayout';
import { Spinner } from '../components/ui/spinner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Alert } from '../components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

export function DocumentosPage() {
  const { isAdministrador, isDirector, profile } = useAuth();
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    categoria: 'estatutos'
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('estatutos');

  const canManage = isAdministrador || isDirector;

  console.log('DocumentosPage: Component rendered, canManage:', canManage);

  useEffect(() => {
    loadDocumentos();
  }, []);

  const loadDocumentos = async () => {
    try {
      console.log('DocumentosPage: Loading documentos');

      const { data, error } = await supabase
        .from('documents')
        .select('*, profiles:subido_por(nombre)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('DocumentosPage: Error loading documentos:', error);
        setLoading(false);
        return;
      }

      console.log('DocumentosPage: Documentos loaded:', data?.length);
      setDocumentos(data || []);
    } catch (error) {
      console.error('DocumentosPage: Exception loading documentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    console.log('DocumentosPage: File selected:', file?.name);
    setSelectedFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    console.log('DocumentosPage: Uploading document:', formData);

    if (!selectedFile) {
      setFormError('Por favor, selecciona un archivo');
      setFormLoading(false);
      return;
    }

    try {
      // Check if running in E2B sandbox
      const isE2bSandbox = window.location.hostname.includes('e2b.app') ||
                           window.location.hostname.includes('e2b.dev') ||
                           window.self !== window.top;

      if (isE2bSandbox) {
        setFormError('La carga de archivos requiere que publiques la aplicación en producción.');
        setFormLoading(false);
        return;
      }

      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}_${formData.titulo.replace(/\s+/g, '_')}.${fileExt}`;

      console.log('DocumentosPage: Uploading file to storage:', fileName);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, selectedFile);

      if (uploadError) {
        console.error('DocumentosPage: Error uploading file:', uploadError);
        setFormError('Error al subir el archivo. Por favor, intenta nuevamente.');
        setFormLoading(false);
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      console.log('DocumentosPage: File uploaded, creating document record');

      // Create document record
      const { data, error } = await supabase
        .from('documentos')
        .insert({
          titulo: formData.titulo,
          categoria: formData.categoria,
          archivo_url: publicUrl,
          subido_por: profile.id
        })
        .select('*, profiles:subido_por(nombre)')
        .single();

      if (error) {
        console.error('DocumentosPage: Error creating document:', error);
        setFormError('Error al crear el documento. Por favor, intenta nuevamente.');
        setFormLoading(false);
        return;
      }

      console.log('DocumentosPage: Document created successfully');
      setDocumentos([data, ...documentos]);
      setDialogOpen(false);
      setFormData({ titulo: '', categoria: 'estatutos' });
      setSelectedFile(null);
    } catch (error) {
      console.error('DocumentosPage: Exception uploading document:', error);
      setFormError('Error al subir el documento. Por favor, intenta nuevamente.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (documento) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este documento?')) {
      return;
    }

    console.log('DocumentosPage: Deleting document:', documento.id);

    try {
      const { error } = await supabase
        .from('documentos')
        .delete()
        .eq('id', documento.id);

      if (error) {
        console.error('DocumentosPage: Error deleting document:', error);
        return;
      }

      console.log('DocumentosPage: Document deleted successfully');
      setDocumentos(documentos.filter(d => d.id !== documento.id));
    } catch (error) {
      console.error('DocumentosPage: Exception deleting document:', error);
    }
  };

  const getCategoriaLabel = (categoria) => {
    switch (categoria) {
      case 'estatutos':
        return 'Estatutos';
      case 'actas':
        return 'Actas';
      case 'beneficios':
        return 'Beneficios';
      default:
        return categoria;
    }
  };

  const documentosPorCategoria = (categoria) => {
    return documentos.filter(d => d.categoria === categoria);
  };

  const DocumentosList = ({ categoria }) => {
    const docs = documentosPorCategoria(categoria);

    if (docs.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No hay documentos en esta categoría
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-3">
        {docs.map((doc) => (
          <Card key={doc.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <FileText className="w-5 h-5 text-blue-600 mt-1" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{doc.titulo}</h3>
                    <p className="text-sm text-muted-foreground">
                      Subido el {new Date(doc.created_at).toLocaleDateString('es-CL')} por {doc.profiles?.nombre || 'Usuario'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button size="sm" asChild>
                    <a href={doc.archivo_url} target="_blank" rel="noopener noreferrer">
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
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Documentos</h1>
            <p className="text-muted-foreground">
              Documentación oficial del sindicato
            </p>
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
                  <DialogTitle>Subir Nuevo Documento</DialogTitle>
                  <DialogDescription>
                    Completa la información y selecciona el archivo
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {formError && (
                    <Alert variant="destructive">{formError}</Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="titulo">Título</Label>
                    <Input
                      id="titulo"
                      value={formData.titulo}
                      onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                      required
                      disabled={formLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoría</Label>
                    <Select
                      value={formData.categoria}
                      onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                      disabled={formLoading}
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

                  <div className="space-y-2">
                    <Label htmlFor="archivo">Archivo (PDF)</Label>
                    <Input
                      id="archivo"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      required
                      disabled={formLoading}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                      disabled={formLoading}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={formLoading}>
                      {formLoading ? 'Subiendo...' : 'Subir Documento'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner className="w-8 h-8" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="estatutos">Estatutos</TabsTrigger>
              <TabsTrigger value="actas">Actas</TabsTrigger>
              <TabsTrigger value="beneficios">Beneficios</TabsTrigger>
            </TabsList>
            <TabsContent value="estatutos" className="space-y-4">
              <DocumentosList categoria="estatutos" />
            </TabsContent>
            <TabsContent value="actas" className="space-y-4">
              <DocumentosList categoria="actas" />
            </TabsContent>
            <TabsContent value="beneficios" className="space-y-4">
              <DocumentosList categoria="beneficios" />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
}
