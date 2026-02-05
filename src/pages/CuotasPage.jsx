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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'

// 🔴 IMPORT CLAVE (ANTES NO ESTABA)
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
    try {
      const { data: allPagos, error } = await supabase
        .from('pagos')
        .select('*')

      if (error) throw error

      const pagosPagados = allPagos.filter(p => p.estado === 'pagado')
      const pagosPendientes = allPagos.filter(p => p.estado === 'pendiente')
      const pagosAtrasados = allPagos.filter(p => p.estado === 'atrasado')

      const totalRecaudado = pagosPagados.reduce(
        (sum, p) => sum + Number(p.monto || 0),
        0
      )

      setStats({
        totalPagos: allPagos.length,
        pagosPendientes: pagosPendientes.length,
        pagosAtrasados: pagosAtrasados.length,
        totalRecaudado
      })

      if (canViewDetails) {
        const { data, error } = await supabase
          .from('pagos')
          .select('*, profiles:user_id(nombre, rut)')
          .order('created_at', { ascending: false })

        if (!error) setPagos(data || [])
      }
    } catch (err) {
      console.error('Error cargando cuotas:', err)
    } finally {
      setLoading(false)
    }
  }

  const getEstadoBadgeVariant = (estado) => {
    if (estado === 'pagado') return 'default'
    if (estado === 'pendiente') return 'secondary'
    if (estado === 'atrasado') return 'destructive'
    return 'secondary'
  }

  const getEstadoLabel = (estado) => {
    if (estado === 'pagado') return 'Pagado'
    if (estado === 'pendiente') return 'Pendiente'
    if (estado === 'atrasado') return 'Atrasado'
    return estado
  }

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount)

  const statCards = [
    {
      title: 'Total Recaudado',
      value: formatCurrency(stats.totalRecaudado),
      icon: DollarSign
    },
    {
      title: 'Pagos Realizados',
      value: stats.totalPagos - stats.pagosPendientes - stats.pagosAtrasados,
      icon: TrendingUp
    },
    {
      title: 'Pagos Pendientes',
      value: stats.pagosPendientes,
      icon: AlertCircle
    },
    {
      title: 'Pagos Atrasados',
      value: stats.pagosAtrasados,
      icon: AlertCircle
    }
  ]

  const PagosTable = ({ estado }) => {
    const filtrados = pagos.filter(p => p.estado === estado)

    if (filtrados.length === 0) {
      return (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No hay pagos {getEstadoLabel(estado)}
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
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map(p => (
                <TableRow key={p.id}>
                  <TableCell>{p.profiles?.nombre || '-'}</TableCell>
                  <TableCell>{p.profiles?.rut || '-'}</TableCell>
                  <TableCell>{p.periodo}</TableCell>
                  <TableCell>{formatCurrency(p.monto)}</TableCell>
                  <TableCell>
                    {p.fecha_pago
                      ? new Date(p.fecha_pago).toLocaleDateString('es-CL')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getEstadoBadgeVariant(p.estado)}>
                      {getEstadoLabel(p.estado)}
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
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Cuotas</h1>
          <p className="text-muted-foreground">
            Administración de pagos y cargas masivas
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner className="w-8 h-8" />
          </div>
        ) : (
          <>
            {/* 🔴 BLOQUE NUEVO – SOLO ADMIN */}
            {canViewDetails && <CargaCuotasExcel />}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statCards.map(({ title, value, icon: Icon }) => (
                <Card key={title}>
                  <CardContent className="pt-6 flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">{title}</p>
                      <p className="text-2xl font-bold">{value}</p>
                    </div>
                    <Icon className="w-6 h-6 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </div>

            {canViewDetails && (
              <Card>
                <CardHeader>
                  <CardTitle>Detalle de Pagos</CardTitle>
                  <CardDescription>
                    Pagos clasificados por estado
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
