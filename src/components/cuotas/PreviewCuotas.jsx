import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Badge } from '../ui/badge'
import { Spinner } from '../ui/spinner'

export default function PreviewCuotas({ rows, periodo }) {
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState([])

  useEffect(() => {
    if (rows?.length > 0) {
      validarRuts()
    }
  }, [rows])

  const validarRuts = async () => {
    setLoading(true)

    const ruts = rows.map(r => r.rut)

    // Buscar socios
    const { data: socios } = await supabase
      .from('socios')
      .select('rut, activo')
      .in('rut', ruts)

    // Buscar aportantes
    const { data: aportantes } = await supabase
      .from('aportantes')
      .select('rut')
      .in('rut', ruts)

    const sociosMap = new Map()
    socios?.forEach(s => sociosMap.set(s.rut, s))

    const aportantesMap = new Map()
    aportantes?.forEach(a => aportantesMap.set(a.rut, true))

    const resultado = rows.map(row => {
      let estado = 'no_existe'
      let detalle = 'RUT no registrado'

      if (row.tipo === 'SOCIO') {
        const socio = sociosMap.get(row.rut)
        if (socio) {
          estado = socio.activo ? 'ok' : 'inactivo'
          detalle = socio.activo ? 'Socio activo' : 'Socio inactivo'
        }
      }

      if (row.tipo === 'APORTANTE') {
        if (aportantesMap.has(row.rut)) {
          estado = 'ok'
          detalle = 'Aportante registrado'
        }
      }

      return {
        ...row,
        periodo,
        estado,
        detalle
      }
    })

    setPreview(resultado)
    setLoading(false)
  }

  const badgeVariant = (estado) => {
    if (estado === 'ok') return 'default'
    if (estado === 'inactivo') return 'secondary'
    return 'destructive'
  }

  const badgeLabel = (estado) => {
    if (estado === 'ok') return 'OK'
    if (estado === 'inactivo') return 'Inactivo'
    return 'No existe'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vista previa de cuotas – {periodo}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner className="w-6 h-6" />
          </div>
        ) : (
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
              {preview.map((row, i) => (
                <TableRow key={i}>
                  <TableCell>{row.rut}</TableCell>
                  <TableCell>{row.nombre}</TableCell>
                  <TableCell>{row.tipo}</TableCell>
                  <TableCell>${Number(row.monto).toLocaleString('es-CL')}</TableCell>
                  <TableCell>
                    <Badge variant={badgeVariant(row.estado)}>
                      {badgeLabel(row.estado)}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      {row.detalle}
                    </div>
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
