import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { AppLayout } from '../components/layout/AppLayout';
import { Alert } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';

export function PerfilPage() {
  const { profile, refreshProfile, roles } = useAuth();
  const [formData, setFormData] = useState({
    nombre: profile?.nombre || '',
    telefono: profile?.telefono || ''
  });
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  console.log('PerfilPage: Component rendered, profile:', profile);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    console.log('PerfilPage: Updating profile:', formData);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          nombre: formData.nombre,
          telefono: formData.telefono
        })
        .eq('id', profile.id);

      if (error) {
        console.error('PerfilPage: Error updating profile:', error);
        setError('Error al actualizar el perfil. Por favor, intenta nuevamente.');
        setLoading(false);
        return;
      }

      console.log('PerfilPage: Profile updated successfully');
      await refreshProfile();
      setSuccess('Perfil actualizado correctamente');
    } catch (error) {
      console.error('PerfilPage: Exception updating profile:', error);
      setError('Error al actualizar el perfil. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    console.log('PerfilPage: Updating password');

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) {
        console.error('PerfilPage: Error updating password:', error);
        setError('Error al cambiar la contraseña. Por favor, intenta nuevamente.');
        setLoading(false);
        return;
      }

      console.log('PerfilPage: Password updated successfully');
      setSuccess('Contraseña actualizada correctamente');
      setPasswordData({ newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('PerfilPage: Exception updating password:', error);
      setError('Error al cambiar la contraseña. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('PerfilPage: Uploading photo:', file.name);

    // Check if running in E2B sandbox
    const isE2bSandbox = window.location.hostname.includes('e2b.app') ||
                         window.location.hostname.includes('e2b.dev') ||
                         window.self !== window.top;

    if (isE2bSandbox) {
      setError('La carga de fotos requiere que publiques la aplicación en producción.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error('PerfilPage: Error uploading photo:', uploadError);
        setError('Error al subir la foto. Por favor, intenta nuevamente.');
        setLoading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ foto_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) {
        console.error('PerfilPage: Error updating photo URL:', updateError);
        setError('Error al actualizar la foto. Por favor, intenta nuevamente.');
        setLoading(false);
        return;
      }

      console.log('PerfilPage: Photo uploaded successfully');
      await refreshProfile();
      setSuccess('Foto de perfil actualizada correctamente');
    } catch (error) {
      console.error('PerfilPage: Exception uploading photo:', error);
      setError('Error al subir la foto. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (nombre) => {
    if (!nombre) return 'U';
    return nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'socio':
        return 'Socio';
      case 'director':
        return 'Director';
      case 'administrador':
        return 'Administrador';
      default:
        return role;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold">Mi Perfil</h1>
          <p className="text-muted-foreground">
            Administra tu información personal
          </p>
        </div>

        {error && <Alert variant="destructive">{error}</Alert>}
        {success && <Alert>{success}</Alert>}

        {/* Profile Photo */}
        <Card>
          <CardHeader>
            <CardTitle>Foto de Perfil</CardTitle>
            <CardDescription>
              Actualiza tu foto de perfil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profile?.foto_url} />
                <AvatarFallback className="text-2xl">
                  {getInitials(profile?.nombre)}
                </AvatarFallback>
              </Avatar>
              <div>
                <Label htmlFor="photo-upload" className="cursor-pointer">
                  <Button type="button" disabled={loading} asChild>
                    <span>
                      <Camera className="w-4 h-4 mr-2" />
                      Cambiar Foto
                    </span>
                  </Button>
                </Label>
                <Input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={loading}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  JPG, PNG o GIF (máx. 2MB)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
            <CardDescription>
              Actualiza tus datos personales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rut">RUT</Label>
                <Input
                  id="rut"
                  value={profile?.rut || ''}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  value={profile?.email || ''}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre Completo</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label>Roles</Label>
                <div className="flex flex-wrap gap-2">
                  {roles.map((role) => (
                    <Badge key={role} variant="secondary">
                      {getRoleLabel(role)}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle>Cambiar Contraseña</CardTitle>
            <CardDescription>
              Actualiza tu contraseña de acceso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <Button type="submit" disabled={loading}>
                {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
