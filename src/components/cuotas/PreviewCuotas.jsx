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

export default function PreviewCuotas() {
  const [importacion, setImportacion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data, error } = await supabase
        .from('cuotas_importacion')
        .select('*')
        .eq('estado', 'pendiente')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        setError('No hay importaciones pendientes')
        return
      }

      setImportacion(data)
    } catch (err) {
      console.error(err)
      setError('Error al cargar vista previa')
    } finally {
      setLoading(false)
    }
  }

  const badge = estado => {
    if (estado === 'NO EXISTE') return <Badge variant="destructive">No existe</Badge>
    if (estado === 'SOCIO INACTIVO') return <Badge variant="secondary">Socio inactivo</Badge>
    if (estado === 'APORTANTE') return <Badge variant="outline">Aportante</Badge>
    return <Badge>Socio activo</Badge>
  }

  if (loading) return <Spinner />
  if (error) return <Alert variant="destructive">{error}</Alert>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vista previa – {importacion.periodo}</CardTitle>
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
            {importacion.filas.map((f, i) => (
              <TableRow key={i}>
                <TableCell>{f.rut}</TableCell>
                <TableCell>{f.nombre}</TableCell>
                <TableCell>{f.tipo}</TableCell>
                <TableCell>${f.valor_pagado}</TableCell>
                <TableCell>{badge(f.estado)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
