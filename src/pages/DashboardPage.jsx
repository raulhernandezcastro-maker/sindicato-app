import React, { useEffect, useState } from 'react';
import { Users, FileText, FolderOpen, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { AppLayout } from '../components/layout/AppLayout';
import { Spinner } from '../components/ui/spinner';

export function DashboardPage() {
  const [stats, setStats] = useState({
    totalSocios: 0,
    sociosActivos: 0,
    totalAvisos: 0,
    totalDocumentos: 0
  });
  const [loading, setLoading] = useState(true);

  console.log('DashboardPage: Component rendered');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      console.log('DashboardPage: Loading statistics');

      // Get total socios
      const { count: totalSocios, error: sociosError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (sociosError) {
        console.error('DashboardPage: Error loading socios count:', sociosError);
      }

      // Get active socios
      const { count: sociosActivos, error: activosError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'activo');

      if (activosError) {
        console.error('DashboardPage: Error loading active socios count:', activosError);
      }

      // Get total avisos
      const { count: totalAvisos, error: avisosError } = await supabase
        .from('avisos')
        .select('*', { count: 'exact', head: true });

      if (avisosError) {
        console.error('DashboardPage: Error loading avisos count:', avisosError);
      }

      // Get total documentos
      const { count: totalDocumentos, error: documentosError } = await supabase
        .from('documentos')
        .select('*', { count: 'exact', head: true });

      if (documentosError) {
        console.error('DashboardPage: Error loading documentos count:', documentosError);
      }

      console.log('DashboardPage: Statistics loaded');
      setStats({
        totalSocios: totalSocios || 0,
        sociosActivos: sociosActivos || 0,
        totalAvisos: totalAvisos || 0,
        totalDocumentos: totalDocumentos || 0
      });
    } catch (error) {
      console.error('DashboardPage: Exception loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total de Socios',
      value: stats.totalSocios,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Socios Activos',
      value: stats.sociosActivos,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Avisos Publicados',
      value: stats.totalAvisos,
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Documentos',
      value: stats.totalDocumentos,
      icon: FolderOpen,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  return (
    <AppLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold">Panel de Gestión</h1>
          <p className="text-muted-foreground">
            Estadísticas generales del sindicato
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner className="w-8 h-8" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map(({ title, value, icon: Icon, color, bgColor }) => (
              <Card key={title}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {title}
                      </p>
                      <p className="text-3xl font-bold mt-2">{value}</p>
                    </div>
                    <div className={`p-3 rounded-full ${bgColor}`}>
                      <Icon className={`w-6 h-6 ${color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Resumen General</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b">
                <span className="font-medium">Tasa de Actividad</span>
                <span className="text-2xl font-bold">
                  {stats.totalSocios > 0
                    ? Math.round((stats.sociosActivos / stats.totalSocios) * 100)
                    : 0}%
                </span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b">
                <span className="font-medium">Socios Inactivos</span>
                <span className="text-2xl font-bold">
                  {stats.totalSocios - stats.sociosActivos}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Total de Contenido</span>
                <span className="text-2xl font-bold">
                  {stats.totalAvisos + stats.totalDocumentos}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
