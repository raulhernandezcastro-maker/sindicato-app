import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, FolderOpen, User, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { AppLayout } from '../components/layout/AppLayout';
import { Spinner } from '../components/ui/spinner';

export function HomePage() {
  const { profile } = useAuth();
  const [latestAviso, setLatestAviso] = useState(null);
  const [loading, setLoading] = useState(true);

  console.log('HomePage: Component rendered, profile:', profile);

  useEffect(() => {
    loadLatestAviso();
  }, []);

  const loadLatestAviso = async () => {
    try {
      console.log('HomePage: Loading latest aviso');

      const { data, error } = await supabase
        .from('avisos')
        .select('*, profiles:autor_id(nombre)')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('HomePage: Error loading aviso:', error);
        setLoading(false);
        return;
      }

      console.log('HomePage: Latest aviso loaded:', data);
      setLatestAviso(data);
    } catch (error) {
      console.error('HomePage: Exception loading aviso:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (nombre) => {
    if (!nombre) return 'U';
    return nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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

  const quickLinks = [
    {
      to: '/avisos',
      icon: FileText,
      label: 'Avisos',
      description: 'Ver todos los avisos',
      color: 'text-blue-600'
    },
    {
      to: '/documentos',
      icon: FolderOpen,
      label: 'Documentos',
      description: 'Acceder a documentos',
      color: 'text-green-600'
    },
    {
      to: '/perfil',
      icon: User,
      label: 'Mi Perfil',
      description: 'Ver y editar perfil',
      color: 'text-purple-600'
    }
  ];

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Welcome Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={profile?.foto_url} />
                <AvatarFallback className="text-lg">
                  {getInitials(profile?.nombre)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">
                  Bienvenido, {profile?.nombre?.split(' ')[0] || 'Usuario'}
                </h1>
                <p className="text-muted-foreground">
                  Sindicato de Trabajadores
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Latest Aviso */}
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Spinner className="w-8 h-8" />
            </CardContent>
          </Card>
        ) : latestAviso ? (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="w-5 h-5 text-primary" />
                  <CardTitle>Último Aviso</CardTitle>
                </div>
                <Badge variant={getTipoBadgeVariant(latestAviso.tipo)}>
                  {latestAviso.tipo}
                </Badge>
              </div>
              <CardDescription>
                {new Date(latestAviso.created_at).toLocaleDateString('es-CL', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <h3 className="text-lg font-semibold mb-2">{latestAviso.titulo}</h3>
              <p className="text-muted-foreground mb-4 line-clamp-3">
                {latestAviso.contenido}
              </p>
              <Link to="/avisos">
                <Button>Ver todos los avisos</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No hay avisos disponibles</p>
            </CardContent>
          </Card>
        )}

        {/* Quick Links */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Accesos Rápidos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickLinks.map(({ to, icon: Icon, label, description, color }) => (
              <Link key={to} to={to}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className={`p-3 rounded-full bg-accent ${color}`}>
                        <Icon className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{label}</h3>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
