import React, { useEffect, useState } from 'react'
import { DollarSign, TrendingUp, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { AppLayout } from '../components/layout/AppLayout'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Spinner } from '../components/ui/spinner'
import { Badge } from '../components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../components/ui/table'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '../components/ui/tabs'

// 🔽 IMPORT CORRECTO DEL COMPONENTE DE EXCEL
import { CargaCuotasExcel } from '../components/cuotas/CargaCuotasExcel'

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

  const canViewDetails = isAdministrador

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)

    try {
      // Cargar pagos
      const { data: allPagos, error } = await supabase
        .from('cuotas')
        .select('*')

      if (error) throw error

      const pagados = allPagos.filter(p => p.estado === 'pagado')
      const pendientes = allPagos.filter(p => p.estado === 'pendiente')
      const atrasados = allPagos.filter(p => p.estado === 'atrasado')

      const totalRecaudado = pagados.reduce(
        (sum, p) => sum + Number(p.monto || 0),
        0
      )

      setStats({
        totalPagos: allPagos.length,
        pagosPendientes: pendientes.length,
        pagosAtrasados: atrasados.length,
        totalRecaudado
      })

      if (canViewDetails) {
        const { data: detalle, error: errDetalle } = await supabase
          .from('cuotas')
          .select('*, socios(nombre, rut)')
          .order('created_at', { ascending: false })

        if (!errDetalle) {
          setPagos(detalle || [])
        }
      }
    } catch (err) {
      console.error('Error cargando cuotas:', err)
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

  const formatCLP = (valor) =>
    new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(valor)

  const PagosTable = ({ estado }) => {
    const lista = pagos.filter(p => p.estado === estado)

    if (lista.length === 0) {
      return (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No hay pagos {estado}
          </CardContent>
        </Card>
      )
    }

    return (
      <Card>
        <CardContent className="pt-6">
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
              {lista.map(p => (
                <TableRow key={p.id}>
                  <TableCell>{p.socios?.nombre || '—'}</TableCell>
                  <TableCell>{p.socios?.rut || '—'}</TableCell>
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
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Cuotas</h1>
          <p className="text-muted-foreground">
            Administración y control de pagos
          </p>
        </div>

        {/* 🔄 SPINNER SIN BLOQUEAR LA APP */}
        {loading && (
          <div className="flex justify-center py-12">
            <Spinner className="w-8 h-8" />
          </div>
        )}

        {!loading && (
          <>
            {/* 📊 ESTADÍSTICAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total recaudado</p>
                  <p className="text-2xl font-bold">
                    {formatCLP(stats.totalRecaudado)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                  <p className="text-2xl font-bold">{stats.pagosPendientes}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Atrasados</p>
                  <p className="text-2xl font-bold">{stats.pagosAtrasados}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total pagos</p>
                  <p className="text-2xl font-bold">{stats.totalPagos}</p>
                </CardContent>
              </Card>
            </div>

            {/* 📥 CARGA EXCEL (SOLO ADMIN) */}
            {isAdministrador && <CargaCuotasExcel />}

            {/* 📋 DETALLE */}
            {canViewDetails && (
              <Card>
                <CardHeader>
                  <CardTitle>Detalle de Pagos</CardTitle>
                  <CardDescription>
                    Pagos agrupados por estado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="pagado">
                    <TabsList className="grid grid-cols-3">
                      <TabsTrigger value="pagado">Pagados</TabsTrigger>
                      <TabsTrigger value="pendiente">Pendientes</TabsTrigger>
                      <TabsTrigger value="atrasado">Atrasados</TabsTrigger>
                    </TabsList>

                    <TabsContent value="pagado">
                      <PagosTable estado="pagado" />
                    </TabsContent>
                    <TabsContent value="pendiente">
                      <PagosTable estado="pendiente" />
                    </TabsContent>
                    <TabsContent value="atrasado">
                      <PagosTable estado="atrasado" />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
