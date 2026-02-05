import React, { useEffect, useState } from 'react'
import { DollarSign, TrendingUp, AlertCircle, Upload } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

import { AppLayout } from '../components/layout/AppLayout'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Spinner } from '../components/ui/spinner'
import { Badge } from '../components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../components/ui/table'
import {
  Tabs, TabsContent, TabsList, TabsTrigger
} from '../components/ui/tabs'

// ✅ IMPORTS CORRECTOS (default)
import CargaCuotasExcel from '../components/cuotas/CargaCuotasExcel'
import PreviewCuotas from '../components/cuotas/PreviewCuotas'

export function CuotasPage() {
  const { isAdministrador } = useAuth()

  const [stats, setStats] = useState({
    totalPagos: 0,
    pagosPendientes: 0,
    pagosAtrasados: 0,
    totalRecaudado: 0
  })

  const [pagos, setPagos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data, error } = await supabase
        .from('pagos')
        .select('*')

      if (error) throw error

      const pagados = data.filter(p => p.estado === 'pagado')
      const pendientes = data.filter(p => p.estado === 'pendiente')
      const atrasados = data.filter(p => p.estado === 'atrasado')

      setStats({
        totalPagos: data.length,
        pagosPendientes: pendientes.length,
        pagosAtrasados: atrasados.length,
        totalRecaudado: pagados.reduce((sum, p) => sum + Number(p.monto), 0)
      })

      if (isAdministrador) {
        const { data: detalle } = await supabase
          .from('pagos')
          .select('*, profiles(nombre, rut)')
          .order('created_at', { ascending: false })

        setPagos(detalle || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const estadoBadge = (estado) => {
    if (estado === 'pagado') return 'default'
    if (estado === 'pendiente') return 'secondary'
    if (estado === 'atrasado') return 'destructive'
    return 'secondary'
  }

  const formatCLP = (monto) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(monto)

  return (
    <AppLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Cuotas</h1>
          <p className="text-muted-foreground">
            Administración y control de pagos
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner className="w-8 h-8" />
          </div>
        ) : (
          <>
            {/* ===== BLOQUE CARGA MASIVA ===== */}
            {isAdministrador && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Carga masiva de cuotas (Excel)
                  </CardTitle>
                  <CardDescription>
                    Importa pagos mensuales de socios y aportantes desde Excel
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <CargaCuotasExcel />
                  <PreviewCuotas />
                </CardContent>
              </Card>
            )}

            {/* ===== ESTADÍSTICAS ===== */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total Recaudado</p>
                  <p className="text-2xl font-bold">
                    {formatCLP(stats.totalRecaudado)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Pagos Pendientes</p>
                  <p className="text-2xl font-bold">{stats.pagosPendientes}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Pagos Atrasados</p>
                  <p className="text-2xl font-bold">{stats.pagosAtrasados}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total Registros</p>
                  <p className="text-2xl font-bold">{stats.totalPagos}</p>
                </CardContent>
              </Card>
            </div>

            {/* ===== TABLA ===== */}
            {isAdministrador && (
              <Card>
                <CardHeader>
                  <CardTitle>Detalle de Pagos</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>RUT</TableHead>
                        <TableHead>Periodo</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagos.map(p => (
                        <TableRow key={p.id}>
                          <TableCell>{p.profiles?.nombre}</TableCell>
                          <TableCell>{p.profiles?.rut}</TableCell>
                          <TableCell>{p.periodo}</TableCell>
                          <TableCell>{formatCLP(p.monto)}</TableCell>
                          <TableCell>
                            <Badge variant={estadoBadge(p.estado)}>
                              {p.estado}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}

export default CuotasPage
