import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { confirmarCuotaImportada } from '../../services/confirmarCuota'

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from '../ui/card'
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
  const [filas, setFilas] = useState([])
  const [loading, setLoading] = useState(true)
  const [procesandoTodo, setProcesandoTodo] = useState(false)
  const [procesandoId, setProcesandoId] = useState(null)

  useEffect(() => {
    cargarPreview()
  }, [])

  const cargarPreview = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('cuotas_importacion')
      .select('*')
      .in('estado', ['pendiente', 'error'])
      .order('created_at', { ascending: false })

    if (!error) setFilas(data || [])
    setLoading(false)
  }

  const confirmarFila = async (fila) => {
    setProcesandoId(fila.id)
    const res = await confirmarCuotaImportada(fila)
    setProcesandoId(null)

    if (res.ok) {
      setFilas(filas.filter(f => f.id !== fila.id))
    }
  }

  const confirmarTodas = async () => {
    if (!window.confirm('¿Confirmar TODAS las cuotas pendientes?')) return

    setProcesandoTodo(true)

    for (const fila of filas) {
      await confirmarCuotaImportada(fila)
    }

    await cargarPreview()
    setProcesandoTodo(false)
  }

  const badgeEstado = (estado) => {
    if (estado === 'pendiente') return 'secondary'
    if (estado === 'confirmado') return 'default'
    if (estado === 'error') return 'destructive'
    return 'secondary'
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Vista previa de cuotas importadas</CardTitle>

        {filas.length > 0 && (
          <Button
            variant="default"
            onClick={confirmarTodas}
            disabled={procesandoTodo}
          >
            {procesandoTodo ? 'Confirmando…' : 'Confirmar todas'}
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {loading && (
          <div className="flex justify-center py-10">
            <Spinner className="w-6 h-6" />
          </div>
        )}

        {!loading && filas.length === 0 && (
          <p className="text-center text-muted-foreground">
            No hay cuotas pendientes por confirmar
          </p>
        )}

        {!loading && filas.length > 0 && (
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
              {filas.map(fila => (
                <TableRow key={fila.id}>
                  <TableCell>{fila.rut}</TableCell>
                  <TableCell>{fila.nombre}</TableCell>
                  <TableCell>{fila.tipo}</TableCell>
                  <TableCell>{fila.periodo}</TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('es-CL', {
                      style: 'currency',
                      currency: 'CLP'
                    }).format(fila.monto)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={badgeEstado(fila.estado)}>
                      {fila.estado}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      disabled={procesandoId === fila.id || procesandoTodo}
                      onClick={() => confirmarFila(fila)}
                    >
                      {procesandoId === fila.id
                        ? 'Confirmando…'
                        : 'Confirmar'}
                    </Button>
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
