import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Button } from '../ui/button'
import { Alert } from '../ui/alert'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'

export default function ConfirmarCuotas({ onFinish }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const confirmarCuotas = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      /* 1️⃣ Obtener filas válidas */
      const { data: filas, error: fetchError } = await supabase
        .from('cuotas_importacion')
        .select('*')
        .eq('estado', 'validado')

      if (fetchError) throw fetchError

      if (!filas || filas.length === 0) {
        setError('No hay cuotas válidas para confirmar')
        setLoading(false)
        return
      }

      /* 2️⃣ Insertar en tabla definitiva */
      const cuotasFinales = filas.map(f => ({
        rut: f.rut,
        tipo: f.tipo,
        periodo: f.periodo,
        monto: f.monto,
        estado: 'pagado'
      }))

      const { error: insertError } = await supabase
        .from('cuotas')
        .insert(cuotasFinales)

      if (insertError) throw insertError

      /* 3️⃣ Marcar como confirmadas */
      const ids = filas.map(f => f.id)

      const { error: updateError } = await supabase
        .from('cuotas_importacion')
        .update({ estado: 'confirmado' })
        .in('id', ids)

      if (updateError) throw updateError

      setSuccess(`✔ ${filas.length} cuotas confirmadas correctamente`)
      if (onFinish) onFinish()

    } catch (err) {
      console.error(err)
      setError('Error al confirmar las cuotas')
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

        <Button
          onClick={confirmarCuotas}
          disabled={loading}
        >
          {loading ? 'Confirmando cuotas...' : 'Confirmar cuotas válidas'}
        </Button>
      </CardContent>
    </Card>
  )
}
