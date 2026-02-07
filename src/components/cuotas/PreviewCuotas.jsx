import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../ui/table'
import { Spinner } from '../ui/spinner'
import { Button } from '../ui/button'

export default function PreviewCuotas() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarPreview()
  }, [])

  const cargarPreview = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('cuotas_importacion')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error cargando preview:', error)
    } else {
      setRows(data || [])
    }

    setLoading(false)
  }

  const badgeVariant = (estado) => {
    if (estado === 'valido') return 'default'
    if (estado === 'error') return 'destructive'
    return 'secondary'
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          No hay cuotas cargadas para revisar
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vista previa de cuotas importadas</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>RUT</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Periodo</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.rut}</TableCell>
                <TableCell>{r.nombre}</TableCell>
                <TableCell>{r.tipo}</TableCell>
                <TableCell>{r.periodo}</TableCell>
                <TableCell>${Number(r.monto).toLocaleString('es-CL')}</TableCell>
                <TableCell>
                  <Badge variant={badgeVariant(r.estado_validacion)}>
                    {r.estado_validacion}
                  </Badge>
                </TableCell>
                <TableCell>
                  {r.estado_validacion === 'valido' && (
                    <Button size="sm">Confirmar</Button>
                  )}
                  {r.estado_validacion === 'error' && (
                    <Button size="sm" variant="outline">
                      Gestionar
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
