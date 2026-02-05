import React, { useEffect, useState } from 'react'
import { DollarSign, TrendingUp, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { AppLayout } from '../components/layout/AppLayout'
import { Spinner } from '../components/ui/spinner'
import { Badge } from '../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'

// 🔽 NUEVO
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
      const { data: allPagos, error } = await supabase
        .from('pagos')
        .select('*')

      if (error) throw error

      const pagosPagados = allPagos.filter(p => p.estado === 'pagado')
      const pagosPendientes = allPagos.filter(p => p.estado === 'pendiente')
      const pagosAtrasados = allPagos.filter(p => p.estado === 'atrasado')
      const totalRecaudado = pagosPagados.reduce(
        (sum, p) => sum + Number(p.monto), 0
      )

      setStats({
        totalPagos: allPagos.length,
        pagosPendientes: pagosPendientes.length,
        pagosAtrasados: pagosAtrasados.length,
        totalRecaudado
      })

      if (canViewDetails) {
        const { data: detailedPagos } = await supabase
          .from('pagos')
          .select('*, profiles:user_id(nombre, rut)')
          .order('created_at', { ascending: false })

        setPagos(detailedPagos || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount)

  const getEstadoBadgeVariant = (estado) => {
    if (estado === 'pagado') return 'default'
    if (estado === 'pendiente') return 'secondary'
    if (estado === 'atrasado') return 'destructive'
    return 'secondary'
  }

  const PagosTable = ({ estado }) => {
    const filtrados = pagos.filter(p => p.estado === estado)

    if (filtrados.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
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
              {filtrados.map(p => (
                <TableRow key={p.id}>
                  <TableCell>{p.profiles?.nombre}</TableCell>
                  <TableCell>{p.profiles?.rut}</TableCell>
                  <TableCell>{p.periodo}</TableCell>
                  <TableCell>{formatCurrency(p.monto)}</TableCell>
                  <TableCell>
                    <Badge variant={getEstadoBadgeVariant(p.estado)}>
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
        <h1 className="text-3xl font-bold">Gestión de Cuotas</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner className="w-8 h-8" />
          </div>
        ) : (
          <>
            {/* 🔽 NUEVO BLOQUE EXCEL */}
            {isAdministrador && (
              <CargaCuotasExcel onSuccess={loadData} />
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card><CardContent className="pt-6">
                <DollarSign /> {formatCurrency(stats.totalRecaudado)}
              </CardContent></Card>
              <Card><CardContent className="pt-6">
                <TrendingUp /> Pagos: {stats.totalPagos}
              </CardContent></Card>
              <Card><CardContent className="pt-6">
                <AlertCircle /> Pendientes: {stats.pagosPendientes}
              </CardContent></Card>
              <Card><CardContent className="pt-6">
                <AlertCircle /> Atrasados: {stats.pagosAtrasados}
              </CardContent></Card>
            </div>

            {isAdministrador && (
              <Tabs defaultValue="pagado">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="pagado">Pagados</TabsTrigger>
                  <TabsTrigger value="pendiente">Pendientes</TabsTrigger>
                  <TabsTrigger value="atrasado">Atrasados</TabsTrigger>
                </TabsList>

                <TabsContent value="pagado"><PagosTable estado="pagado" /></TabsContent>
                <TabsContent value="pendiente"><PagosTable estado="pendiente" /></TabsContent>
                <TabsContent value="atrasado"><PagosTable estado="atrasado" /></TabsContent>
              </Tabs>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
