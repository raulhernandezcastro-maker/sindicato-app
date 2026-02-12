import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Alert } from '../ui/alert'

export default function ConfirmarCuotas({ onFinish }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const confirmar = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // 1️⃣ Obtener cuotas pendientes
      const { data: pendientes, error: e1 } = await supabase
        .from('cuotas_importacion')
        .select('*')
        .eq('estado', 'pendiente')
        .eq('estado_validacion', 'ok')

      if (e1) throw e1
      if (!pendientes.length) {
        setSuccess('No hay cuotas para confirmar')
        setLoading(false)
        return
      }

      for (const row of pendientes) {
        let socioId = null
        let aportanteId = null

        if (row.tipo === 'SOCIO') {
          const { data } = await supabase
            .from('socios')
            .select('id')
            .eq('rut', row.rut)
            .single()

          socioId = data?.id || null
        }

        if (row.tipo === 'APORTANTE') {
          const { data } = await supabase
            .from('aportantes')
            .select('id')
            .eq('rut', row.rut)
            .single()

          aportanteId = data?.id || null
        }

        // 2️⃣ Insertar cuota definitiva
        const { error: e2 } = await supabase.from('cuotas').insert({
          periodo: row.periodo,
          monto: row.valor_pagado,
          estado: 'pagado',
          socio_id: socioId,
          aportante_id: aportanteId
        })

        if (e2) throw e2

        // 3️⃣ Marcar como confirmada
        await supabase
          .from('cuotas_importacion')
          .update({ estado: 'confirmado' })
          .eq('id', row.id)
      }

      setSuccess('Cuotas confirmadas correctamente')
      if (onFinish) onFinish()

    } catch (err) {
      console.error(err)
      setError('Error al confirmar cuotas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confirmar cuotas importadas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <Alert variant="destructive">{error}</Alert>}
        {success && <Alert>{success}</Alert>}

        <Button onClick={confirmar} disabled={loading}>
          {loading ? 'Confirmando...' : 'Confirmar cuotas'}
        </Button>
      </CardContent>
    </Card>
  )
}
