import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'

export function PreviewCuotas({ data, periodo }) {
  const [rows, setRows] = useState([])

  useEffect(() => {
    if (data.length === 0) return
    validar()
  }, [data])

  const validar = async () => {
    const result = []

    for (const row of data) {
      const { data: socio } = await supabase
        .from('socios')
        .select('id, activo')
        .eq('rut', row.rut)
        .maybeSingle()

      if (!socio) {
        result.push({ ...row, estado: 'NO_EXISTE' })
      } else if (!socio.activo) {
        result.push({ ...row, estado: 'INACTIVO' })
      } else {
        result.push({ ...row, estado: 'OK' })
      }
    }

    setRows(result)
  }

  const badge = (estado) => {
    switch (estado) {
      case 'OK':
        return <Badge className="bg-green-600">OK</Badge>
      case 'INACTIVO':
        return <Badge className="bg-yellow-500">Inactivo</Badge>
      default:
        return <Badge variant="destructive">No existe</Badge>
    }
  }

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <h3 className="font-semibold">Previsualización — Periodo {periodo}</h3>

        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="flex justify-between text-sm border-b pb-1">
              <span>{r.rut} — {r.nombre}</span>
              {badge(r.estado)}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
