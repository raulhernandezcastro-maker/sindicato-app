import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Alert } from '../ui/alert'
import { Spinner } from '../ui/spinner'

export default function ConfirmarCuotas({ onConfirm }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const confirmarCuotas = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // 1️⃣ Traer cuotas pendientes de confirmar
      const { data: preview, error: previewError } = await supabase
        .from('cuotas_importacion')
        .select('*')
        .eq('confirmado', false)

      if (previewError) throw previewError
      if (!preview || preview.length === 0) {
        setError('No hay cuotas para confirmar')
        setLoading(false)
        return
      }

      // 2️⃣ Insertar cuotas definitivas
      const cuotasFinales = preview.map(p => ({
        periodo: p.periodo,
        monto: p.monto,
        estado: 'pagado',
        socio_id: p.socio_id || null,
        aportante_id: p.aportante_id || null
      }))

      const { error: insertError } = await supabase
        .from('cuotas')
        .insert(cuotasFinales)

      if (insertError) throw insertError

      // 3️⃣ Marcar importación como confirmada
      const { error: updateError } = await supabase
        .from('cuotas_importacion')
        .update({ confirmado: true })
        .eq('confirmado', false)

      if (updateError) throw updateError

      setSuccess('Cuotas confirmadas correctamente')

      // 4️⃣ Refrescar pantalla principal
      if (onConfirm) onConfirm()

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
        <CardDescription>
          Esta acción registrará definitivamente las cuotas en el sistema
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && <Alert variant="destructive">{error}</Alert>}
        {success && <Alert>{success}</Alert>}

        <Button
          onClick={confirmarCuotas}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Spinner className="w-4 h-4 mr-2" />
              Confirmando…
            </>
          ) : (
            'Confirmar cuotas'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
