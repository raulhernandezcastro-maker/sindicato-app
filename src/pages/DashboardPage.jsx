import React, { useEffect, useState, useCallback } from 'react'
import { Users, UserCheck, UserX, FileText, FolderOpen, LayoutDashboard, TrendingUp, PieChart } from 'lucide-react'
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
  const [stats, setStats] = useState({
    totalSocios: 0, totalDirectores: 0, totalAportantes: 0, totalUsuarios: 0,
    sociosActivos: 0, sociosInactivos: 0,
    totalAvisos: 0, totalDocumentos: 0,
  })
  const [loading, setLoading] = useState(true)

  const loadStats = useCallback(async () => {
    try {
      setLoading(true)

      const [
        { data: rolesData },
        { count: totalAvisos },
        { count: totalDocumentos },
        { count: sociosActivos },
        { count: sociosInactivos },
      ] = await Promise.all([
        supabase.from('roles').select('user_id, role_name'),
        supabase.from('avisos').select('id', { count: 'exact' }),
        supabase.from('documentos').select('id', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact' }).eq('estado', 'activo'),
        supabase.from('profiles').select('id', { count: 'exact' }).eq('estado', 'inactivo'),
      ])

      // Agrupar roles por usuario
      const rolesMap = {}
      ;(rolesData || []).forEach(r => {
        if (!rolesMap[r.user_id]) rolesMap[r.user_id] = []
        rolesMap[r.user_id].push(r.role_name)
      })

      // Contar sin solapamiento
      // Socios: tienen 'socio' pero NO 'director' ni 'aportante'
      // Directores: tienen 'director'
      // Aportantes: tienen 'aportante'
      let totalSocios = 0, totalDirectores = 0, totalAportantes = 0
      Object.values(rolesMap).forEach(roles => {
        if (roles.includes('director'))   totalDirectores++
        else if (roles.includes('aportante')) totalAportantes++
        else if (roles.includes('socio')) totalSocios++
      })
      const totalUsuarios = totalSocios + totalDirectores + totalAportantes

      setStats({
        totalSocios, totalDirectores, totalAportantes, totalUsuarios,
        sociosActivos: sociosActivos || 0,
        sociosInactivos: sociosInactivos || 0,
        totalAvisos: totalAvisos || 0,
        totalDocumentos: totalDocumentos || 0,
      })
    } catch (err) {
      console.error('Error cargando estadísticas:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadStats() }, [loadStats])

  const porcentajeSocios = stats.totalUsuarios > 0
    ? Math.round((stats.totalSocios / stats.totalUsuarios) * 100)
    : 0

  const cards = [
    { title: 'Total Socios',           value: stats.totalSocios,     icon: UserCheck, color: '#2d7a4f', bg: '#d4edda' },
    { title: 'Total Socios Directores',value: stats.totalDirectores, icon: Users,     color: '#1a5276', bg: '#d6eaf8' },
    { title: 'Total Aportantes',       value: stats.totalAportantes, icon: UserX,     color: '#6c3483', bg: '#e8daef' },
    { title: 'Total Usuarios',         value: stats.totalUsuarios,   icon: Users,     color: '#d35400', bg: '#fdebd0' },
  ]

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* Título */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg" style={{ backgroundColor: '#2d7a4f' }}>
        <LayoutDashboard className="w-5 h-5 text-white" />
        <div>
          <h1 className="text-xl font-bold text-white">Panel de Gestión</h1>
          <p className="text-xs text-green-100">Estadísticas generales del sindicato</p>
        </div>
      </div>

      {/* Tarjetas principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => <StatCard key={c.title} {...c} loading={loading} />)}
      </div>

      {/* Resumen */}
      {!loading && (
        <div className="rounded-lg border overflow-hidden shadow-sm">
          <div className="px-4 py-2 flex items-center gap-2" style={{ backgroundColor: '#2d7a4f' }}>
            <TrendingUp className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-semibold">Resumen General</span>
          </div>
          <div className="p-5 space-y-1" style={{ backgroundColor: '#f0f9f2' }}>
            {[
              { label: 'Socios Activos',    value: stats.sociosActivos,   color: '#2d7a4f' },
              { label: 'Socios Inactivos',  value: stats.sociosInactivos, color: '#c0392b' },
              { label: 'Avisos Publicados', value: stats.totalAvisos,     color: '#6c3483' },
              { label: 'Documentos',        value: stats.totalDocumentos, color: '#d35400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="font-medium text-sm">{label}</span>
                <span className="text-2xl font-bold" style={{ color }}>{value}</span>
              </div>
            ))}

            {/* Porcentaje de Socios */}
            <div className="mt-4 pt-3 border-t">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4" style={{ color: '#2d7a4f' }} />
                  <span className="font-semibold text-sm">Porcentaje de Socios</span>
                  <span className="text-xs text-muted-foreground">(Socios ÷ Total Usuarios)</span>
                </div>
                <span className="text-2xl font-bold" style={{ color: '#2d7a4f' }}>{porcentajeSocios}%</span>
              </div>
              {/* Barra de progreso */}
              <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                     style={{ width: `${porcentajeSocios}%`, backgroundColor: '#2d7a4f' }} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{stats.totalSocios} socios</span>
                <span>{stats.totalUsuarios} usuarios totales</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
