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

      // 🔑 TOTAL DE SOCIOS = TOTAL DE PERFILES
      const { count: totalSocios, error: sociosError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      if (sociosError) throw sociosError

      // 🔑 SOCIOS ACTIVOS (por ahora todos)
      const sociosActivos = totalSocios || 0

      // Avisos
      const { count: totalAvisos } = await supabase
        .from('avisos')
        .select('*', { count: 'exact', head: true })

      // Documentos
      const { count: totalDocumentos } = await supabase
        .from('documentos')
        .select('*', { count: 'exact', head: true })

      setStats({
        totalSocios: totalSocios || 0,
        sociosActivos,
        totalAvisos: totalAvisos || 0,
        totalDocumentos: totalDocumentos || 0,
      })
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  const tasaActividad =
    stats.totalSocios > 0
      ? Math.round((stats.sociosActivos / stats.totalSocios) * 100)
      : 0

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Panel de Gestión</h1>
        <p className="text-muted-foreground">
          Estadísticas generales del sindicato
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner className="w-8 h-8" />
        </div>
      ) : (
        <>
          {/* TARJETAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total de Socios"
              value={stats.totalSocios}
              icon={Users}
              color="text-blue-600"
              bg="bg-blue-100"
            />
            <StatCard
              title="Socios Activos"
              value={stats.sociosActivos}
              icon={TrendingUp}
              color="text-green-600"
              bg="bg-green-100"
            />
            <StatCard
              title="Avisos Publicados"
              value={stats.totalAvisos}
              icon={FileText}
              color="text-purple-600"
              bg="bg-purple-100"
            />
            <StatCard
              title="Documentos"
              value={stats.totalDocumentos}
              icon={FolderOpen}
              color="text-orange-600"
              bg="bg-orange-100"
            />
          </div>

          {/* RESUMEN */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ResumenItem
                label="Tasa de Actividad"
                value={`${tasaActividad}%`}
              />
              <ResumenItem
                label="Socios Inactivos"
                value={stats.totalSocios - stats.sociosActivos}
              />
              <ResumenItem
                label="Total de Contenido"
                value={stats.totalAvisos + stats.totalDocumentos}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

/* ================= COMPONENTES AUX ================= */

function StatCard({ title, value, icon: Icon, color, bg }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
          </div>
          <div className={`p-3 rounded-full ${bg}`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ResumenItem({ label, value }) {
  return (
    <div className="flex justify-between border-b pb-2 last:border-b-0">
      <span className="font-medium">{label}</span>
      <span className="text-xl font-bold">{value}</span>
    </div>
  )
}
