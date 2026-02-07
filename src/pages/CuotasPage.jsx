import React, { useEffect, useState } from 'react'
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

// 📥 Carga + Preview + Confirmación
import CargaCuotasExcel from '../components/cuotas/CargaCuotasExcel'
import PreviewCuotas from '../components/cuotas/PreviewCuotas'
import ConfirmarCuotas from '../components/cuotas/ConfirmarCuotas'

export function CuotasPage() {
  const { isAdministrador } = useAuth()

  const [cuotas, setCuotas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarCuotas()
  }, [])

  const cargarCuotas = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('cuotas')
      .select('*, socios(nombre, rut), aportantes(nombre, rut)')
      .order('created_at', { ascending: false })

    if (!error) setCuotas(data || [])
    setLoading(false)
  }

  const badgeEstado = (estado) => {
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

  const TablaCuotas = ({ estado }) => {
    const lista = cuotas.filter(c => c.estado === estado)

    if (lista.length === 0) {
      return (
        <Card>
          <CardContent className="py-6 text-center text-muted-foreground">
            No hay cuotas {estado}
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
              {lista.map(c => (
                <TableRow key={c.id}>
                  <TableCell>
                    {c.socios?.nombre || c.aportantes?.nombre || '—'}
                  </TableCell>
                  <TableCell>
                    {c.socios?.rut || c.aportantes?.rut || '—'}
                  </TableCell>
                  <TableCell>{c.periodo}</TableCell>
                  <TableCell>{formatCLP(c.monto)}</TableCell>
                  <TableCell>
                    <Badge variant={badgeEstado(c.estado)}>
                      {c.estado}
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
            Carga, validación y confirmación de cuotas
          </p>
        </div>

        {isAdministrador && (
          <>
            <CargaCuotasExcel />
            <PreviewCuotas />
            <ConfirmarCuotas onConfirm={cargarCuotas} />
          </>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner className="w-8 h-8" />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Cuotas registradas</CardTitle>
              <CardDescription>
                Cuotas confirmadas en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="pagado">
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="pagado">Pagadas</TabsTrigger>
                  <TabsTrigger value="pendiente">Pendientes</TabsTrigger>
                  <TabsTrigger value="atrasado">Atrasadas</TabsTrigger>
                </TabsList>

                <TabsContent value="pagado">
                  <TablaCuotas estado="pagado" />
                </TabsContent>
                <TabsContent value="pendiente">
                  <TablaCuotas estado="pendiente" />
                </TabsContent>
                <TabsContent value="atrasado">
                  <TablaCuotas estado="atrasado" />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
