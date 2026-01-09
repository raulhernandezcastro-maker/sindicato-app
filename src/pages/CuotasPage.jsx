import React, { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { AppLayout } from '../components/layout/AppLayout';
import { Spinner } from '../components/ui/spinner';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

export function CuotasPage() {
  const { isAdministrador } = useAuth();
  const [stats, setStats] = useState({
    totalPagos: 0,
    pagosPendientes: 0,
    pagosAtrasados: 0,
    totalRecaudado: 0
  });
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);

  const canViewDetails = isAdministrador;

  console.log('CuotasPage: Component rendered, canViewDetails:', canViewDetails);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('CuotasPage: Loading payments data');

      // Get payment statistics
      const { data: allPagos, error: pagosError } = await supabase
        .from('pagos')
        .select('*');

      if (pagosError) {
        console.error('CuotasPage: Error loading pagos:', pagosError);
        setLoading(false);
        return;
      }

      const pagosPagados = allPagos.filter(p => p.estado === 'pagado');
      const pagosPendientes = allPagos.filter(p => p.estado === 'pendiente');
      const pagosAtrasados = allPagos.filter(p => p.estado === 'atrasado');
      const totalRecaudado = pagosPagados.reduce((sum, p) => sum + parseFloat(p.monto), 0);

      console.log('CuotasPage: Payment statistics calculated');
      setStats({
        totalPagos: allPagos.length,
        pagosPendientes: pagosPendientes.length,
        pagosAtrasados: pagosAtrasados.length,
        totalRecaudado: totalRecaudado
      });

      // If admin, load detailed payments with user info
      if (canViewDetails) {
        const { data: detailedPagos, error: detailsError } = await supabase
          .from('pagos')
          .select('*, profiles:user_id(nombre, rut)')
          .order('created_at', { ascending: false });

        if (detailsError) {
          console.error('CuotasPage: Error loading detailed pagos:', detailsError);
        } else {
          console.log('CuotasPage: Detailed payments loaded:', detailedPagos?.length);
          setPagos(detailedPagos || []);
        }
      }
    } catch (error) {
      console.error('CuotasPage: Exception loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadgeVariant = (estado) => {
    switch (estado) {
      case 'pagado':
        return 'default';
      case 'pendiente':
        return 'secondary';
      case 'atrasado':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getEstadoLabel = (estado) => {
    switch (estado) {
      case 'pagado':
        return 'Pagado';
      case 'pendiente':
        return 'Pendiente';
      case 'atrasado':
        return 'Atrasado';
      default:
        return estado;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  const statCards = [
    {
      title: 'Total Recaudado',
      value: formatCurrency(stats.totalRecaudado),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Pagos Realizados',
      value: stats.totalPagos - stats.pagosPendientes - stats.pagosAtrasados,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Pagos Pendientes',
      value: stats.pagosPendientes,
      icon: AlertCircle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      title: 'Pagos Atrasados',
      value: stats.pagosAtrasados,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    }
  ];

  const pagosPorEstado = (estado) => {
    return pagos.filter(p => p.estado === estado);
  };

  const PagosTable = ({ estado }) => {
    const pagosFiltrados = pagosPorEstado(estado);

    if (pagosFiltrados.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No hay pagos con estado: {getEstadoLabel(estado)}
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Socio</TableHead>
                <TableHead>RUT</TableHead>
                <TableHead>Mes/Año</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Fecha de Pago</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagosFiltrados.map((pago) => (
                <TableRow key={pago.id}>
                  <TableCell className="font-medium">
                    {pago.profiles?.nombre || 'N/A'}
                  </TableCell>
                  <TableCell>{pago.profiles?.rut || 'N/A'}</TableCell>
                  <TableCell>{pago.mes} {pago.anio}</TableCell>
                  <TableCell>{formatCurrency(pago.monto)}</TableCell>
                  <TableCell>
                    {pago.fecha_pago
                      ? new Date(pago.fecha_pago).toLocaleDateString('es-CL')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getEstadoBadgeVariant(pago.estado)}>
                      {getEstadoLabel(pago.estado)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Cuotas</h1>
          <p className="text-muted-foreground">
            {canViewDetails
              ? 'Administra y visualiza los pagos de cuotas de los socios'
              : 'Estadísticas generales de cuotas'}
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
                        <p className="text-2xl font-bold mt-2">{value}</p>
                      </div>
                      <div className={`p-3 rounded-full ${bgColor}`}>
                        <Icon className={`w-6 h-6 ${color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {canViewDetails && (
              <Card>
                <CardHeader>
                  <CardTitle>Detalle de Pagos por Estado</CardTitle>
                  <CardDescription>
                    Visualiza los pagos individuales de cada socio
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="pagado">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="pagado">Pagados</TabsTrigger>
                      <TabsTrigger value="pendiente">Pendientes</TabsTrigger>
                      <TabsTrigger value="atrasado">Atrasados</TabsTrigger>
                    </TabsList>
                    <TabsContent value="pagado" className="space-y-4">
                      <PagosTable estado="pagado" />
                    </TabsContent>
                    <TabsContent value="pendiente" className="space-y-4">
                      <PagosTable estado="pendiente" />
                    </TabsContent>
                    <TabsContent value="atrasado" className="space-y-4">
                      <PagosTable estado="atrasado" />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}

            {!canViewDetails && (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    Solo el administrador puede ver el detalle de pagos individuales
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
