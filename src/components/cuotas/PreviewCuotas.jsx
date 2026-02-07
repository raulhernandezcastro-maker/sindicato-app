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
  const [processingRut, setProcessingRut] = useState(null)

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

  const crearPersona = async (row, tipo) => {
    setProcessingRut(row.rut)

    try {
      const { error } = await supabase
        .from(tipo === 'socio' ? 'socios' : 'aportantes')
        .insert({
          rut: row.rut,
          nombre: row.nombre,
          estado: 'activo'
        })

      if (error) throw error

      await marcarResuelto(row.id)
    } catch (err) {
      console.error(err)
      alert('Error al crear registro')
    } finally {
      setProcessingRut(null)
    }
  }

  const activarSocio = async (row) => {
    setProcessingRut(row.rut)

    try {
      const { error } = await supabase
        .from('socios')
        .update({ estado: 'activo' })
        .eq('rut', row.rut)

      if (error) throw error

      await marcarResuelto(row.id)
    } catch (err) {
      console.error(err)
      alert('Error al activar socio')
    } finally {
      setProcessingRut(null)
    }
  }

  const marcarResuelto = async (importId) => {
    await supabase
      .from('cuotas_importacion')
      .update({ estado_validacion: 'resuelto' })
      .eq('id', importId)

    loadPreview()
  }

  const badgeEstado = (estado) => {
    if (estado === 'ok') return 'default'
    if (estado === 'inactivo') return 'secondary'
    if (estado === 'no_existe') return 'destructive'
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

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          No hay cargas pendientes de validar
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
              <TableHead>Monto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
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
                <TableCell>
                  <Badge variant={badgeEstado(row.estado_validacion)}>
                    {row.estado_validacion}
                  </Badge>
                </TableCell>
                <TableCell className="space-x-2">
                  {row.estado_validacion === 'no_existe' && (
                    <>
                      <Button
                        size="sm"
                        disabled={processingRut === row.rut}
                        onClick={() => crearPersona(row, 'socio')}
                      >
                        Crear Socio
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={processingRut === row.rut}
                        onClick={() => crearPersona(row, 'aportante')}
                      >
                        Crear Aportante
                      </Button>
                    </>
                  )}

                  {row.estado_validacion === 'inactivo' && (
                    <Button
                      size="sm"
                      disabled={processingRut === row.rut}
                      onClick={() => activarSocio(row)}
                    >
                      Activar
                    </Button>
                  )}

                  {row.estado_validacion === 'ok' && (
                    <span className="text-muted-foreground">—</span>
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
