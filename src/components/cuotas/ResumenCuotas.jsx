import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, CardContent } from '../ui/card'

export default function ResumenCuotas() {
  const [data, setData] = useState({
    pendientes: 0,
    errores: 0,
    confirmadas: 0,
  })

  useEffect(() => {
    loadResumen()
  }, [])

  const loadResumen = async () => {
    try {
      const [
        pendientesRes,
        erroresRes,
        confirmadasRes
      ] = await Promise.all([
        supabase
          .from('cuotas_importacion')
          .select('*', { count: 'exact', head: true })
          .eq('estado', 'pendiente'),

        supabase
          .from('cuotas_importacion')
          .select('*', { count: 'exact', head: true })
          .eq('estado_validacion', 'error'),

        supabase
          .from('cuotas')
          .select('*', { count: 'exact', head: true }),
      ])

      setData({
        pendientes: pendientesRes.count || 0,
        errores: erroresRes.count || 0,
        confirmadas: confirmadasRes.count || 0,
      })
    } catch (err) {
      console.error('Error cargando resumen de cuotas:', err)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Cuotas Pendientes</p>
          <p className="text-3xl font-bold text-yellow-600">
            {data.pendientes}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Cuotas con Error</p>
          <p className="text-3xl font-bold text-red-600">
            {data.errores}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Cuotas Confirmadas</p>
          <p className="text-3xl font-bold text-green-600">
            {data.confirmadas}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
