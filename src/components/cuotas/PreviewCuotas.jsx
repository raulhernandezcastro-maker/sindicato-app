import React, { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Spinner } from '../ui/spinner'

export default function PreviewCuotas() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPreview()
  }, [])

  const loadPreview = async () => {
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('cuotas_importacion')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setRows(data || [])
    } catch (err) {
      console.error('Error cargando vista previa:', err)
    } finally {
      setLoading(false)
    }
  }

  const estadoBadge = (estado) => {
    if (estado === 'confirmado') return 'default'
    if (estado === 'error') return 'destructive'
    return 'secondary'
  }

  const estadoIcon = (estado) => {
    if (estado === 'confirmado') return <CheckCircle className="w-4 h-4 text-green-600" />
    if (estado === 'error') return <AlertTriangle className="w-4 h-4 text-red-600" />
    return null
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vista previa de cuotas importadas</CardTitle>
      </CardHeader>

      <CardContent>
        {rows.length === 0 ? (
          <p className="text-muted-foreground text-center py-6">
            No hay cuotas importadas
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>RUT</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Detalle</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.rut}</TableCell>
                  <TableCell>{row.nombre || '—'}</TableCell>
                  <TableCell>{row.tipo}</TableCell>
                  <TableCell>{row.periodo}</TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('es-CL', {
                      style: 'currency',
                      currency: 'CLP'
                    }).format(row.monto)}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      {estadoIcon(row.estado)}
                      <Badge variant={estadoBadge(row.estado)}>
                        {row.estado}
                      </Badge>
                    </div>
                  </TableCell>

                  <TableCell className="text-sm">
                    {row.estado === 'error' ? (
                      <span className="text-red-600">
                        {row.mensaje_error || 'Error no especificado'}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
