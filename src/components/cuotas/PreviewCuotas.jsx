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

export default function PreviewCuotas() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('cuotas_importacion')
      .select('*')
      .order('created_at', { ascending: false })

    setRows(data || [])
    setLoading(false)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 text-center">
          Cargando vista previa...
        </CardContent>
      </Card>
    )
  }

  if (!rows.length) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          No hay cuotas importadas
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(r => (
              <TableRow key={r.id}>
                <TableCell>{r.rut}</TableCell>
                <TableCell>{r.nombre}</TableCell>
                <TableCell>{r.tipo}</TableCell>
                <TableCell>{r.periodo}</TableCell>
                <TableCell>${r.valor_pagado}</TableCell>
                <TableCell>
                  <Badge>{r.estado}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
