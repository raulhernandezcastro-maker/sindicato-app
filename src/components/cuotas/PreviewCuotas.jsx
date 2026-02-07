import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Badge } from '../ui/badge'
import { Spinner } from '../ui/spinner'

export function PreviewCuotas({ rows, periodo }) {
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!rows || rows.length === 0) {
      setLoading(false)
      return
    }

    validarRuts()
    // eslint-disable-next-line
  }, [rows])

  const validarRuts = async () => {
    setLoading(true)
    setError('')

    try {
      const resultado = []

      for (const row of rows) {
        const rut = row.rut?.trim()

        if (!rut) {
          resultado.push({
            ...row,
            estado: 'ERROR',
            accion: 'RUT VACÍO'
          })
          continue
        }

        // 🔍 Buscar en socios
        const { data: socio } = await supabase
          .from('socios')
          .select('id, activo')
          .eq('rut', rut)
          .maybeSingle()

        if (socio) {
          resultado.push({
            ...row,
            estado: socio.activo ? 'OK' : 'INACTIVO',
            accion: socio.activo ? 'REGISTRAR PAGO' : 'SOCIO INACTIVO'
          })
          continue
        }

        // 🔍 Buscar en aportantes
        const { data: aportante } = await supabase
          .from('aportantes')
          .select('id, activo')
          .eq('rut', rut)
          .maybeSingle()

        if (aportante) {
          resultado.push({
            ...row,
            estado: aportante.activo ? 'OK' : 'INACTIVO',
            accion: aportante.activo ? 'REGISTRAR APORTE' : 'APORTANTE INACTIVO'
          })
          continue
        }

        // ❌ No existe
        resultado.push({
          ...row,
          estado: 'NO EXISTE',
          accion: 'REVISAR / CREAR'
        })
      }

      setPreview(resultado)
    } catch (err) {
      console.error(err)
      setError('Error al validar los RUT')
    } finally {
      setLoading(false)
    }
  }

  const badgeVariant = (estado) => {
    switch (estado) {
      case 'OK':
        return 'default'
      case 'NO EXISTE':
        return 'destructive'
      case 'INACTIVO':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 flex justify-center">
          <Spinner />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6 text-red-600">
          {error}
        </CardContent>
      </Card>
    )
  }

  if (preview.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-muted-foreground">
          No hay datos para mostrar
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vista previa de cuotas – {periodo}</CardTitle>
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
              <TableHead>Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {preview.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell>{row.rut}</TableCell>
                <TableCell>{row.nombre}</TableCell>
                <TableCell>{row.tipo}</TableCell>
                <TableCell>${Number(row.valor_pagado).toLocaleString('es-CL')}</TableCell>
                <TableCell>
                  <Badge variant={badgeVariant(row.estado)}>
                    {row.estado}
                  </Badge>
                </TableCell>
                <TableCell>{row.accion}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
