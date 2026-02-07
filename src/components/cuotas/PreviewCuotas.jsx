import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Spinner } from '../ui/spinner'
import { Alert } from '../ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../ui/table'

export function PreviewCuotas() {
  const [importacion, setImportacion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadImportacionPendiente()
  }, [])

  const loadImportacionPendiente = async () => {
    try {
      const { data, error } = await supabase
        .from('cuotas_importacion')
        .select('*')
        .eq('estado', 'pendiente')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        setError('No hay cargas pendientes')
        setLoading(false)
        return
      }

      setImportacion(data)
    } catch (err) {
      console.error(err)
      setError('Error al cargar la vista previa')
    } finally {
      setLoading(false)
    }
  }

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case 'SOCIO ACTIVO':
        return <Badge>Socio activo</Badge>
      case 'SOCIO INACTIVO':
        return <Badge variant="secondary">Socio inactivo</Badge>
      case 'APORTANTE':
        return <Badge variant="outline">Aportante</Badge>
      case 'NO EXISTE':
        return <Badge variant="destructive">No existe</Badge>
      default:
        return <Badge variant="secondary">{estado}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  if (error) {
    return <Alert variant="destructive">{error}</Alert>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Vista previa de cuotas – Período {importacion.periodo}
        </CardTitle>
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
            </TableRow>
          </TableHeader>

          <TableBody>
            {importacion.filas.map((fila, index) => (
              <TableRow key={index}>
                <TableCell>{fila.rut}</TableCell>
                <TableCell>{fila.nombre}</TableCell>
                <TableCell>{fila.tipo}</TableCell>
                <TableCell>
                  {fila.valor_pagado.toLocaleString('es-CL', {
                    style: 'currency',
                    currency: 'CLP'
                  })}
                </TableCell>
                <TableCell>{getEstadoBadge(fila.estado)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
