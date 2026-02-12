import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Alert } from '../ui/alert'

export default function ConfirmarCuotas({ onFinish }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const confirmarCuotas = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const { data: filas, error } = await supabase
        .from('cuotas_importacion')
        .select('*')
        .eq('estado', 'pendiente')
        .eq('estado_validacion', 'ok')

      if (error) throw error

      if (!filas || filas.length === 0) {
        setSuccess('No hay cuotas para confirmar')
        setLoading(false)
        return
      }

      for (const fila of filas) {
        let socioId = null
        let aportanteId = null

        if (fila.tipo === 'SOCIO') {
          const { data } = await supabase
            .from('socios')
            .select('id')
            .eq('rut', fila.rut)
            .single()

          socioId = data?.id || null
        }

        if (fila.tipo === 'APORTANTE') {
          const { data } = await supabase
            .from('aportantes')
            .select('id')
            .eq('rut', fila.rut)
            .single()

          aportanteId = data?.id || null
        }

        await supabase.from('cuotas').insert({
          periodo: fila.periodo,
          monto: fila.valor_pagado,
          estado: 'pagado',
          socio_id: socioId,
          aportante_id: aportanteId
        })

        await supabase
          .from('cuotas_importacion')
          .update({ estado: 'confirmado' })
          .eq('id', fila.id)
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

        <Button onClick={confirmarCuotas} disabled={loading}>
          {loading ? 'Confirmando...' : 'Confirmar cuotas'}
        </Button>
      </CardContent>
    </Card>
  )
}
