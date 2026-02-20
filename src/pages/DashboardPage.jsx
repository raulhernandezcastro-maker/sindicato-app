import React, { useEffect, useState } from 'react'
import { Users, FileText, FolderOpen, TrendingUp } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'
import { Spinner } from '../components/ui/spinner'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalSocios: 0,
    sociosActivos: 0,
    totalAvisos: 0,
    totalDocumentos: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)

      // 👥 TOTAL SOCIOS (profiles = personas reales)
      const { count: totalSocios, error: sociosError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      if (sociosError) throw sociosError

      // 🟢 SOCIOS ACTIVOS
      // Por ahora: todos los profiles son activos
      const sociosActivos = totalSocios || 0

      // 📢 TOTAL AVISOS
      const { count: totalAvisos, error: avisosError } = await supabase
        .from('avisos')
        .select('*', { count: 'exact', head: true })

      if (avisosError) throw avisosError

      // 📁 TOTAL DOCUMENTOS
      const { count: totalDocumentos, error: documentosError } = await supabase
        .from('documentos')
        .select('*', { count: 'exact', head: true })

      if (documentosError) throw documentosError

      setStats({
        totalSocios: totalSocios || 0,
        sociosActivos,
        totalAvisos: totalAvisos || 0,
        totalDocumentos: totalDocumentos || 0,
      })
    } catch (err) {
      console.error('Error cargando estadísticas del dashboard:', err)
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
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Socios Activos',
      value: stats.sociosActivos,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Avisos Publicados',
      value: stats.totalAvisos,
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Documentos',
      value: stats.totalDocumentos,
      icon: FolderOpen,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ]

  return (
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
        <>
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

          <Card>
            <CardHeader>
              <CardTitle>Resumen General</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b">
                  <span className="font-medium">Tasa de Actividad</span>
                  <span className="text-2xl font-bold">
                    {stats.totalSocios > 0 ? '100%' : '0%'}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b">
                  <span className="font-medium">Socios Inactivos</span>
                  <span className="text-2xl font-bold">0</span>
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
        </>
      )}
    </div>
  )
}
