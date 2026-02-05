import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'

export default function PreviewCuotas({ resumen = [] }) {
  if (!resumen || resumen.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          No hay datos cargados para previsualizar
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen de carga</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {resumen.map((r, idx) => (
          <div
            key={idx}
            className="flex justify-between items-center border-b pb-2"
          >
            <div>
              <p className="font-medium">{r.nombre}</p>
              <p className="text-sm text-muted-foreground">
                RUT: {r.rut}
              </p>
            </div>

            <Badge variant={r.estado === 'ok' ? 'default' : 'destructive'}>
              {r.estado}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
