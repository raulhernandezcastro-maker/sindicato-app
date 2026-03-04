import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Alert } from '../ui/alert'

export default function ConfirmarCuotas({ onFinish }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [resultado, setResultado] = useState(null)
  const ejecutandoRef = React.useRef(false)

  const confirmarCuotas = async () => {
    // Guard para evitar doble ejecución (React StrictMode)
    if (ejecutandoRef.current) return
    ejecutandoRef.current = true

    setLoading(true)
    setError('')
    setSuccess('')
    setResultado(null)

    try {
      // Buscar cuotas pendientes con validación OK (también las que estaban sin_socio, por si ya se creó)
      const { data: filas, error } = await supabase
        .from('cuotas_importacion')
        .select('*')
        .in('estado', ['pendiente', 'sin_socio'])
        .eq('estado_validacion', 'ok')

      if (error) throw error

      if (!filas || filas.length === 0) {
        setSuccess('No hay cuotas para confirmar')
        setLoading(false)
        return
      }

      const confirmadas = []
      const sinSocio = []
      const errores = []

      for (const fila of filas) {
        try {
          // Buscar el socio por RUT en la tabla profiles
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('rut', fila.rut)
            .single()

          if (!profile) {
            // El socio no existe → dejar pendiente para cuando se cree
            sinSocio.push({ rut: fila.rut, nombre: fila.nombre })
            await supabase
              .from('cuotas_importacion')
              .update({
                estado: 'sin_socio',
                observacion: 'Socio no encontrado. Crear el socio y volver a confirmar.'
              })
              .eq('id', fila.id)
            continue
          }

          // Confirmar la cuota vinculándola al profile
          const { error: updateError } = await supabase
            .from('cuotas_importacion')
            .update({
              estado: 'confirmado',
              profile_id: profile.id,
              observacion: null
            })
            .eq('id', fila.id)

          if (updateError) throw updateError

          confirmadas.push({ rut: fila.rut, nombre: fila.nombre })
        } catch (err) {
          errores.push({ rut: fila.rut, error: err.message })
          await supabase
            .from('cuotas_importacion')
            .update({ estado: 'error', observacion: err.message })
            .eq('id', fila.id)
        }
      }

      setResultado({ confirmadas, sinSocio, errores })

      if (confirmadas.length > 0) {
        setSuccess(`✅ ${confirmadas.length} cuota(s) confirmada(s) correctamente`)
      }
      if (sinSocio.length > 0) {
        setError(`⚠️ ${sinSocio.length} cuota(s) quedaron pendientes porque el socio no existe. Créalo en Gestión de Socios y vuelve a confirmar.`)
      }

      if (onFinish) onFinish()

    } catch (err) {
      console.error(err)
      setError('Error al confirmar cuotas: ' + err.message)
    } finally {
      setLoading(false)
      ejecutandoRef.current = false
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confirmar cuotas importadas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {success && <Alert>{success}</Alert>}
        {error && <Alert variant="destructive">{error}</Alert>}

        {resultado && resultado.sinSocio.length > 0 && (
          <div className="text-sm border rounded p-3 bg-yellow-50 text-yellow-800">
            <p className="font-semibold mb-1">Socios no encontrados (cuotas en espera):</p>
            <ul className="list-disc pl-4">
              {resultado.sinSocio.map((s, i) => (
                <li key={i}>{s.nombre} — RUT: {s.rut}</li>
              ))}
            </ul>
          </div>
        )}

        <Button onClick={confirmarCuotas} disabled={loading}>
          {loading ? 'Confirmando...' : 'Confirmar cuotas pendientes'}
        </Button>
      </CardContent>
    </Card>
  )
}
