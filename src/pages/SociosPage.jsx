import React, { useEffect, useState } from 'react';
import { Plus, Edit, UserX, UserCheck } from 'lucide-react';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Checkbox } from '../components/ui/checkbox';

export function SociosPage() {
  const [socios, setSocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSocio, setEditingSocio] = useState(null);
  const [formData, setFormData] = useState({
    rut: '',
    nombre: '',
    email: '',
    telefono: '',
    password: '',
    estado: 'activo',
    roles: ['socio']
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  console.log('SociosPage: Component rendered');

  useEffect(() => {
    loadSocios();
  }, []);

  const loadSocios = async () => {
    try {
      console.log('SociosPage: Loading socios');

      const { data, error } = await supabase
        .from('profiles')
        .select('*, roles(role_name)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('SociosPage: Error loading socios:', error);
        setLoading(false);
        return;
      }

      console.log('SociosPage: Socios loaded:', data?.length);
      setSocios(data || []);
    } catch (error) {
      console.error('SociosPage: Exception loading socios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    console.log('SociosPage: Creating/updating socio:', formData);

    try {
      if (editingSocio) {
        // Update existing socio
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            nombre: formData.nombre,
            telefono: formData.telefono,
            estado: formData.estado
          })
          .eq('id', editingSocio.id);

        if (updateError) {
          console.error('SociosPage: Error updating profile:', updateError);
          setFormError('Error al actualizar el socio. Por favor, intenta nuevamente.');
          setFormLoading(false);
          return;
        }

        // Update roles
        await supabase.from('roles').delete().eq('user_id', editingSocio.id);

        for (const role of formData.roles) {
          await supabase.from('roles').insert({
            user_id: editingSocio.id,
            role_name: role
          });
        }

        console.log('SociosPage: Socio updated successfully');
      } else {
        // First check if user already exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('email')
          .eq('email', formData.email)
          .single();

        if (existingProfile) {
          console.log('SociosPage: Email already exists');
          setFormError('Ya existe un socio con este correo electrónico.');
          setFormLoading(false);
          return;
        }

        // Create new user account
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password
        });

        if (authError) {
          console.error('SociosPage: Error creating auth user:', authError);
          setFormError('Error al crear la cuenta. Por favor, intenta nuevamente.');
          setFormLoading(false);
          return;
        }

        if (!authData.user) {
          console.error('SociosPage: No user data returned from signup');
          setFormError('Error al crear la cuenta. Por favor, intenta nuevamente.');
          setFormLoading(false);
          return;
        }

        console.log('SociosPage: Auth user created:', authData.user.id);

        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            rut: formData.rut,
            nombre: formData.nombre,
            email: formData.email,
            telefono: formData.telefono,
            estado: formData.estado
          });

        if (profileError) {
          console.error('SociosPage: Error creating profile:', profileError);
          setFormError('Error al crear el perfil. Por favor, intenta nuevamente.');
          setFormLoading(false);
          return;
        }

        // Create roles
        for (const role of formData.roles) {
          await supabase.from('roles').insert({
            user_id: authData.user.id,
            role_name: role
          });
        }

        console.log('SociosPage: Socio created successfully');
      }

      await loadSocios();
      setDialogOpen(false);
      setEditingSocio(null);
      setFormData({
        rut: '',
        nombre: '',
        email: '',
        telefono: '',
        password: '',
        estado: 'activo',
        roles: ['socio']
      });
    } catch (error) {
      console.error('SociosPage: Exception in handleSubmit:', error);
      setFormError('Error al procesar la solicitud. Por favor, intenta nuevamente.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (socio) => {
    console.log('SociosPage: Editing socio:', socio.id);
    setEditingSocio(socio);
    setFormData({
      rut: socio.rut,
      nombre: socio.nombre,
      email: socio.email,
      telefono: socio.telefono || '',
      password: '',
      estado: socio.estado,
      roles: socio.roles.map(r => r.role_name)
    });
    setDialogOpen(true);
  };

  const handleToggleEstado = async (socio) => {
    const newEstado = socio.estado === 'activo' ? 'inactivo' : 'activo';

    console.log('SociosPage: Toggling estado for socio:', socio.id, 'to:', newEstado);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ estado: newEstado })
        .eq('id', socio.id);

      if (error) {
        console.error('SociosPage: Error toggling estado:', error);
        return;
      }

      console.log('SociosPage: Estado toggled successfully');
      await loadSocios();
    } catch (error) {
      console.error('SociosPage: Exception toggling estado:', error);
    }
  };

  const handleRoleChange = (role) => {
    console.log('SociosPage: Role change:', role);
    if (formData.roles.includes(role)) {
      setFormData({
        ...formData,
        roles: formData.roles.filter(r => r !== role)
      });
    } else {
      setFormData({
        ...formData,
        roles: [...formData.roles, role]
      });
    }
  };

  const getRoleLabels = (roles) => {
    return roles.map(r => {
      switch (r.role_name) {
        case 'socio':
          return 'Socio';
        case 'director':
          return 'Director';
        case 'administrador':
          return 'Administrador';
        default:
          return r.role_name;
      }
    }).join(', ');
  };

  const openNewDialog = () => {
    setEditingSocio(null);
    setFormData({
      rut: '',
      nombre: '',
      email: '',
      telefono: '',
      password: '',
      estado: 'activo',
      roles: ['socio']
    });
    setDialogOpen(true);
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Socios</h1>
            <p className="text-muted-foreground">
              Administra los socios y sus roles
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingSocio(null);
              setFormError('');
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={openNewDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Socio
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingSocio ? 'Editar Socio' : 'Crear Nuevo Socio'}
                </DialogTitle>
                <DialogDescription>
                  {editingSocio
                    ? 'Actualiza la información del socio'
                    : 'Completa la información para crear un nuevo socio'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {formError && (
                  <Alert variant="destructive">{formError}</Alert>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rut">RUT</Label>
                    <Input
                      id="rut"
                      value={formData.rut}
                      onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                      required
                      disabled={formLoading || editingSocio}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre Completo</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      required
                      disabled={formLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={formLoading || editingSocio}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    disabled={formLoading}
                  />
                </div>

                {!editingSocio && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      disabled={formLoading}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Select
                    value={formData.estado}
                    onValueChange={(value) => setFormData({ ...formData, estado: value })}
                    disabled={formLoading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="inactivo">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Roles</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="role-socio"
                        checked={formData.roles.includes('socio')}
                        onCheckedChange={() => handleRoleChange('socio')}
                        disabled={formLoading}
                      />
                      <Label htmlFor="role-socio" className="font-normal">
                        Socio
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="role-director"
                        checked={formData.roles.includes('director')}
                        onCheckedChange={() => handleRoleChange('director')}
                        disabled={formLoading}
                      />
                      <Label htmlFor="role-director" className="font-normal">
                        Director
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="role-administrador"
                        checked={formData.roles.includes('administrador')}
                        onCheckedChange={() => handleRoleChange('administrador')}
                        disabled={formLoading}
                      />
                      <Label htmlFor="role-administrador" className="font-normal">
                        Administrador
                      </Label>
                    </div>
                  </div>
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
                    {formLoading
                      ? editingSocio ? 'Actualizando...' : 'Creando...'
                      : editingSocio ? 'Actualizar Socio' : 'Crear Socio'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner className="w-8 h-8" />
          </div>
        ) : socios.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No hay socios registrados</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>RUT</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {socios.map((socio) => (
                    <TableRow key={socio.id}>
                      <TableCell className="font-medium">{socio.rut}</TableCell>
                      <TableCell>{socio.nombre}</TableCell>
                      <TableCell>{socio.email}</TableCell>
                      <TableCell>{socio.telefono || '-'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {socio.roles.map(r => (
                            <Badge key={r.role_name} variant="secondary" className="text-xs">
                              {r.role_name === 'socio' ? 'Socio' :
                               r.role_name === 'director' ? 'Director' :
                               r.role_name === 'administrador' ? 'Admin' : r.role_name}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={socio.estado === 'activo' ? 'default' : 'secondary'}>
                          {socio.estado === 'activo' ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(socio)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={socio.estado === 'activo' ? 'destructive' : 'default'}
                            onClick={() => handleToggleEstado(socio)}
                          >
                            {socio.estado === 'activo' ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
