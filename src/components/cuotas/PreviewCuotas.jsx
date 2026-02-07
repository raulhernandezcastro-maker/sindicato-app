import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Spinner } from '../ui/spinner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../ui/table'

export default function PreviewCuotas() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

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
      console.error('Error cargando preview:', err)
    } finally {
      setLoading(false)
    }
  }

  /* ================= CONFIRMAR CUOTAS ================= */

  const confirmarCuotas = async () => {
    const pendientes = rows.filter(r => r.estado_validacion === 'resuelto')

    if (pendientes.length === 0) {
      alert('No hay cuotas listas para confirmar')
      return
    }

    if (!confirm(`Se confirmarán ${pendientes.length} cuotas. ¿Continuar?`)) {
      return
    }

    setProcessing(true)

    try {
      for (const row of pendientes) {
        await supabase.from('cuotas').insert({
          rut: row.rut,
          nombre: row.nombre,
          tipo: row.tipo,
          monto: row.monto,
          periodo: row.periodo,
          estado: 'pagado'
        })

        await supabase
          .from('cuotas_importacion')
          .update({ estado_validacion: 'confirmado' })
          .eq('id', row.id)
      }

      await loadPreview()
      alert('Cuotas confirmadas correctamente')
    } catch (err) {
      console.error(err)
      alert('Error al confirmar cuotas')
    } finally {
      setProcessing(false)
    }
  }

  const badgeEstado = (estado) => {
    if (estado === 'ok') return 'default'
    if (estado === 'inactivo') return 'secondary'
    if (estado === 'no_existe') return 'destructive'
    if (estado === 'resuelto') return 'outline'
    if (estado === 'confirmado') return 'default'
    return 'secondary'
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Spinner className="w-6 h-6" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Vista previa de cuotas importadas</CardTitle>

        <Button
          disabled={processing}
          onClick={confirmarCuotas}
        >
          {processing ? 'Confirmando...' : 'Confirmar cuotas'}
        </Button>
      </CardHeader>

      <CardContent>
        {rows.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">
            No hay cargas pendientes
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>RUT</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.map(row => (
                <TableRow key={row.id}>
                  <TableCell>{row.rut}</TableCell>
                  <TableCell>{row.nombre}</TableCell>
                  <TableCell>{row.tipo}</TableCell>
                  <TableCell>
                    ${Number(row.monto).toLocaleString('es-CL')}
                  </TableCell>
                  <TableCell>{row.periodo}</TableCell>
                  <TableCell>
                    <Badge variant={badgeEstado(row.estado_validacion)}>
                      {row.estado_validacion}
                    </Badge>
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
