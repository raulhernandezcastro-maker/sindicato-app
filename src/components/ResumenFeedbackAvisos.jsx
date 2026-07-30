import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { MessageSquareText, ThumbsUp, ThumbsDown } from 'lucide-react'

const VERDE_MEDIO = '#2d7a4f'
const VERDE_OSCURO = '#1e3a2f'

export default function ResumenFeedbackAvisos() {
  const [filas, setFilas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [hayError, setHayError] = useState(false)

  useEffect(() => {
    let activo = true
    ;(async () => {
      const { data, error } = await supabase.rpc('get_avisos_feedback_resumen')
      if (!activo) return
      if (error) {
        console.error('[Feedback] Error al cargar resumen:', error)
        setHayError(true)
      } else {
        setFilas(data || [])
      }
      setCargando(false)
    })()
    return () => { activo = false }
  }, [])

  return (
    <div className="rounded-lg border overflow-hidden">
      {/* Encabezado de sección */}
      <div className="flex items-center gap-2 px-4 py-2"
           style={{ backgroundColor: VERDE_MEDIO }}>
        <MessageSquareText className="w-4 h-4 text-white" />
        <span className="font-semibold text-white text-sm">Feedback de Avisos</span>
      </div>

      <div className="p-4 space-y-3" style={{ backgroundColor: '#f0f9f2' }}>
        {/* Advertencia de lectura: conteos referenciales, no proporción */}
        <p className="text-xs text-gray-500 leading-relaxed">
          Participación baja y voluntaria: los conteos son referenciales, no una medición
          representativa. El valor está en los <strong>motivos</strong> que dejan los socios,
          no en la proporción de "Sí" y "No".
        </p>

        {cargando && (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        )}

        {!cargando && hayError && (
          <p className="text-sm text-red-500">No se pudo cargar el feedback.</p>
        )}

        {!cargando && !hayError && filas.length === 0 && (
          <p className="text-sm text-muted-foreground">No hay avisos publicados.</p>
        )}

        {!cargando && !hayError && filas.map((f) => {
          const motivos = f.motivos && typeof f.motivos === 'object'
            ? Object.entries(f.motivos)
            : []
          const sinVotos = Number(f.total_votos) === 0

          return (
            <div key={f.aviso_id}
                 className="rounded-lg border bg-white p-3"
                 style={{ borderColor: '#d4edda' }}>
              <p className="text-sm font-semibold" style={{ color: VERDE_OSCURO }}>
                {f.titulo}
              </p>

              {sinVotos ? (
                <p className="text-xs text-muted-foreground mt-1">Sin respuestas aún</p>
              ) : (
                <>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
                          style={{ backgroundColor: '#e8f0ec', color: VERDE_MEDIO }}>
                      <ThumbsUp size={12} /> Sí · {f.total_si}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
                          style={{ backgroundColor: '#f0e8e8', color: VERDE_OSCURO }}>
                      <ThumbsDown size={12} /> No · {f.total_no}
                    </span>
                  </div>

                  {motivos.length > 0 && (
                    <div className="mt-2 pl-1">
                      <p className="text-xs text-gray-500 mb-1">Motivos del "No":</p>
                      <ul className="space-y-0.5">
                        {motivos.map(([texto, cnt]) => (
                          <li key={texto} className="text-xs text-gray-700 flex justify-between gap-3">
                            <span>{texto}</span>
                            <span className="font-medium tabular-nums">{cnt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
