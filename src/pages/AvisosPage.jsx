import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
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
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Alert } from '../components/ui/alert';

export function AvisosPage() {
  const { isAdministrador, isDirector, profile } = useAuth();
  const [avisos, setAvisos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    contenido: '',
    tipo: 'informativo'
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const canManage = isAdministrador || isDirector;

  console.log('AvisosPage: Component rendered, canManage:', canManage);

  useEffect(() => {
    loadAvisos();
  }, []);

  const loadAvisos = async () => {
    try {
      console.log('AvisosPage: Loading avisos');

      const { data, error } = await supabase
        .from('avisos')
        .select('*, profiles:autor_id(nombre)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('AvisosPage: Error loading avisos:', error);
        setLoading(false);
        return;
      }

      console.log('AvisosPage: Avisos loaded:', data?.length);
      setAvisos(data || []);
    } catch (error) {
      console.error('AvisosPage: Exception loading avisos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    console.log('AvisosPage: Creating aviso:', formData);

    try {
      const { data, error } = await supabase
        .from('avisos')
        .insert({
          titulo: formData.titulo,
          contenido: formData.contenido,
          tipo: formData.tipo,
          autor_id: profile.id
        })
        .select('*, profiles:autor_id(nombre)')
        .single();

      if (error) {
        console.error('AvisosPage: Error creating aviso:', error);
        setFormError('Error al crear el aviso. Por favor, intenta nuevamente.');
        setFormLoading(false);
        return;
      }

      console.log('AvisosPage: Aviso created successfully');
      setAvisos([data, ...avisos]);
      setDialogOpen(false);
      setFormData({ titulo: '', contenido: '', tipo: 'informativo' });
    } catch (error) {
      console.error('AvisosPage: Exception creating aviso:', error);
      setFormError('Error al crear el aviso. Por favor, intenta nuevamente.');
    } finally {
      setFormLoading(false);
    }
  };

  const getTipoBadgeVariant = (tipo) => {
    switch (tipo) {
      case 'urgente':
        return 'destructive';
      case 'asamblea':
        return 'default';
      case 'informativo':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getTipoLabel = (tipo) => {
    switch (tipo) {
      case 'urgente':
        return 'Urgente';
      case 'asamblea':
        return 'Asamblea';
      case 'informativo':
        return 'Informativo';
      default:
        return tipo;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Avisos</h1>
            <p className="text-muted-foreground">
              Comunicaciones oficiales del sindicato
            </p>
          </div>
          {canManage && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Aviso
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Aviso</DialogTitle>
                  <DialogDescription>
                    Completa la información del aviso para publicarlo
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
                    <Label htmlFor="tipo">Tipo</Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                      disabled={formLoading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="informativo">Informativo</SelectItem>
                        <SelectItem value="asamblea">Asamblea</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contenido">Contenido</Label>
                    <Textarea
                      id="contenido"
                      value={formData.contenido}
                      onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
                      rows={8}
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
                      {formLoading ? 'Publicando...' : 'Publicar Aviso'}
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
        ) : avisos.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No hay avisos disponibles</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {avisos.map((aviso) => (
              <Card key={aviso.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <CardTitle>{aviso.titulo}</CardTitle>
                        <Badge variant={getTipoBadgeVariant(aviso.tipo)}>
                          {getTipoLabel(aviso.tipo)}
                        </Badge>
                      </div>
                      <CardDescription>
                        Publicado el {new Date(aviso.created_at).toLocaleDateString('es-CL', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })} por {aviso.profiles?.nombre || 'Usuario'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{aviso.contenido}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
