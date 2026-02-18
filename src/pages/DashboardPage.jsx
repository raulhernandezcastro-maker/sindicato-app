import React, { useEffect, useState } from 'react'
import { Users, FileText, FolderOpen, TrendingUp } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'
import { AppLayout } from '../components/layout/AppLayout'
import { Spinner } from '../components/ui/spinner'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalSocios: 0,
    sociosActivos: 0,
    totalAvisos: 0,
    totalDocumentos: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const { count: totalSocios } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      const { count: sociosActivos } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'activo')

      const { count: totalAvisos } = await supabase
        .from('avisos')
        .select('*', { count: 'exact', head: true })

      const { count: totalDocumentos } = await supabase
        .from('documentos')
        .select('*', { count: 'exact', head: true })

      setStats({
        totalSocios: totalSocios || 0,
        sociosActivos: sociosActivos || 0,
        totalAvisos: totalAvisos || 0,
        totalDocumentos: totalDocumentos || 0
      })
    } catch (error) {
      console.error('DashboardPage: Error loading statistics:', error)
    } finally {
      setLoading(false)
    }
  }

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
  ]

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
            {statCards.map(({ title, value, icon: Icon, bgColor, color }) => (
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
              <div className="flex justify-between border-b pb-3">
                <span>Tasa de Actividad</span>
                <span className="font-bold">
                  {stats.totalSocios > 0
                    ? Math.round((stats.sociosActivos / stats.totalSocios) * 100)
                    : 0}%
                </span>
              </div>
              <div className="flex justify-between border-b pb-3">
                <span>Socios Inactivos</span>
                <span className="font-bold">
                  {stats.totalSocios - stats.sociosActivos}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total de Contenido</span>
                <span className="font-bold">
                  {stats.totalAvisos + stats.totalDocumentos}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
