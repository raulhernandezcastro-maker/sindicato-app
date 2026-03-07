import React, { useEffect, useState, useCallback } from 'react'
import { Users, UserCheck, UserX, FileText, FolderOpen, LayoutDashboard, TrendingUp } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Spinner } from '../components/ui/spinner'

const StatCard = ({ title, value, icon: Icon, color, bg, loading }) => (
  <div className="rounded-lg border overflow-hidden shadow-sm">
    <div className="px-4 py-2 flex items-center gap-2" style={{ backgroundColor: '#2d7a4f' }}>
      <Icon className="w-4 h-4 text-white" />
      <span className="text-white text-xs font-semibold">{title}</span>
    </div>
    <div className="px-4 py-5 flex items-center justify-between" style={{ backgroundColor: '#f0f9f2' }}>
      {loading
        ? <div className="h-9 w-12 bg-green-100 rounded animate-pulse" />
        : <span className="text-4xl font-bold" style={{ color }}>{value}</span>
      }
      <div className="p-3 rounded-full" style={{ backgroundColor: bg }}>
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
    </div>
  </div>
)

export default function DashboardPage() {
  const [stats, setStats] = useState({ sociosActivos: 0, sociosInactivos: 0, aportantes: 0, totalAvisos: 0, totalDocumentos: 0 })
  const [loading, setLoading] = useState(true)

  const loadStats = useCallback(async () => {
    try {
      setLoading(true)
      const [
        { count: activos },
        { count: inactivos },
        { count: totalAvisos },
        { count: totalDocumentos },
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }).eq('estado', 'activo'),
        supabase.from('profiles').select('id', { count: 'exact' }).eq('estado', 'inactivo'),
        supabase.from('avisos').select('id', { count: 'exact' }),
        supabase.from('documentos').select('id', { count: 'exact' }),
      ])

      // Aportantes: rol específico 'aportante' en tabla roles
      const { count: aportantes } = await supabase
        .from('roles')
        .select('user_id', { count: 'exact' })
        .eq('role_name', 'aportante')

      setStats({ sociosActivos: activos || 0, sociosInactivos: inactivos || 0, aportantes: aportantes || 0, totalAvisos: totalAvisos || 0, totalDocumentos: totalDocumentos || 0 })
    } catch (err) {
      console.error('Error cargando estadísticas:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadStats() }, [loadStats])

  const total = stats.sociosActivos + stats.sociosInactivos
  const tasaActividad = total > 0 ? Math.round((stats.sociosActivos / total) * 100) : 0

  const cards = [
    { title: 'Socios Activos',    value: stats.sociosActivos,   icon: UserCheck,  color: '#2d7a4f', bg: '#d4edda' },
    { title: 'Socios Inactivos',  value: stats.sociosInactivos, icon: UserX,      color: '#c0392b', bg: '#fde8e8' },
    { title: 'Aportantes',        value: stats.aportantes,      icon: Users,      color: '#1a5276', bg: '#d6eaf8' },
    { title: 'Avisos Publicados', value: stats.totalAvisos,     icon: FileText,   color: '#6c3483', bg: '#e8daef' },
    { title: 'Documentos',        value: stats.totalDocumentos, icon: FolderOpen, color: '#d35400', bg: '#fdebd0' },
  ]

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      <div className="flex items-center gap-2 px-4 py-3 rounded-lg" style={{ backgroundColor: '#2d7a4f' }}>
        <LayoutDashboard className="w-5 h-5 text-white" />
        <div>
          <h1 className="text-xl font-bold text-white">Panel de Gestión</h1>
          <p className="text-xs text-green-100">Estadísticas generales del sindicato</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map(c => <StatCard key={c.title} {...c} loading={loading} />)}
      </div>

      {!loading && (
        <div className="rounded-lg border overflow-hidden shadow-sm">
          <div className="px-4 py-2 flex items-center gap-2" style={{ backgroundColor: '#2d7a4f' }}>
            <TrendingUp className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-semibold">Resumen General</span>
          </div>
          <div className="p-5 space-y-1" style={{ backgroundColor: '#f0f9f2' }}>
            {[
              { label: 'Total de Socios',    value: total },
              { label: 'Tasa de Actividad',  value: `${tasaActividad}%` },
              { label: 'Total de Contenido', value: stats.totalAvisos + stats.totalDocumentos },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="font-medium text-sm">{label}</span>
                <span className="text-2xl font-bold" style={{ color: '#2d7a4f' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
