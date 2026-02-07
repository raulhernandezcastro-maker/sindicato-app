import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { AppLayout } from '../components/layout/AppLayout'

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '../components/ui/card'

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
    if (isAdministrador) {
      cargarResumen()
    } else {
      setLoading(false)
    }
  }, [isAdministrador])

  const cargarResumen = async () => {
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('cuotas')
        .select('*')

      if (error) throw error

      const pagados = data.filter(p => p.estado === 'pagado')
      const pendientes = data.filter(p => p.estado === 'pendiente')
      const atrasados = data.filter(p => p.estado === 'atrasado')

      const totalRecaudado = pagados.reduce(
        (sum, p) => sum + Number(p.monto || 0),
        0
      )

      setStats({
        totalPagos: data.length,
        pagosPendientes: pendientes.length,
        pagosAtrasados: atrasados.length,
        totalRecaudado
      })

      const { data: detalle } = await supabase
        .from('cuotas')
        .select('*, socios(nombre, rut)')
        .order('created_at', { ascending: false })

      setPagos(detalle || [])
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
            Carga, revisión y control de pagos
          </p>
        </div>

        {!isAdministrador && (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Solo el administrador puede acceder a la gestión de cuotas
            </CardContent>
          </Card>
        )}

        {isAdministrador && (
          <>
            {/* 📥 CARGA MASIVA */}
            <CargaCuotasExcel />

            {/* 👀 PREVIEW */}
            <PreviewCuotas />

            {/* 📊 RESUMEN */}
            {loading ? (
              <div className="flex justify-center py-12">
                <Spinner className="w-8 h-8" />
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Detalle de Pagos Confirmados</CardTitle>
                  <CardDescription>
                    Pagos ya ingresados en el sistema
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
