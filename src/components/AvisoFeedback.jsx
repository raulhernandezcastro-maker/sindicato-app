import { useState, useEffect } from 'react'
import { ThumbsUp, ThumbsDown, Check, Pencil } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const VERDE_OSCURO = '#1e3a2f'
const VERDE_MEDIO = '#2d7a4f'

const MOTIVOS = [
  'Texto poco claro',
  'Falta información',
  'Demasiado largo',
  'No me afecta / no me interesa el tema',
  'No estoy de acuerdo con lo comunicado',
]

export default function AvisoFeedback({ avisoId }) {
  const { user } = useAuth()
  const [esUtil, setEsUtil] = useState(null)   // null | true | false
  const [motivo, setMotivo] = useState(null)
  const [editandoMotivo, setEditandoMotivo] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    let activo = true
    ;(async () => {
      if (!user) { setCargando(false); return }
      const { data } = await supabase
        .from('avisos_feedback')
        .select('es_util, motivo')
        .eq('aviso_id', avisoId)
        .eq('user_id', user.id)
        .maybeSingle()
      if (!activo) return
      if (data) {
        setEsUtil(data.es_util)
        setMotivo(data.motivo)
      }
      setCargando(false)
    })()
    return () => { activo = false }
  }, [avisoId, user])

  // Guarda el voto SÍ/NO. Al marcar SÍ, limpia cualquier motivo previo.
  async function guardarVoto(nuevoEsUtil) {
    if (!user) return
    setGuardando(true)
    const { error } = await supabase
      .from('avisos_feedback')
      .upsert(
        {
          aviso_id: avisoId,
          user_id: user.id,
          es_util: nuevoEsUtil,
          motivo: nuevoEsUtil ? null : motivo,
        },
        { onConflict: 'aviso_id,user_id' }
      )
    setGuardando(false)
    if (!error) {
      setEsUtil(nuevoEsUtil)
      if (nuevoEsUtil) { setMotivo(null); setEditandoMotivo(false) }
    }
  }

  // Guarda el motivo elegido y colapsa la lista.
  async function guardarMotivo(m) {
    if (!user) return
    setGuardando(true)
    const { error } = await supabase
      .from('avisos_feedback')
      .upsert(
        { aviso_id: avisoId, user_id: user.id, es_util: false, motivo: m },
        { onConflict: 'aviso_id,user_id' }
      )
    setGuardando(false)
    if (!error) {
      setMotivo(m)
      setEditandoMotivo(false)
    }
  }

  if (cargando || !user) return null

  const listaVisible = esUtil === false && (motivo === null || editandoMotivo)
  const motivoColapsado = esUtil === false && motivo !== null && !editandoMotivo

  return (
    <div className="mt-4 border-t pt-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-gray-600">¿Fue útil esta información?</span>

        <button
          type="button"
          onClick={() => guardarVoto(true)}
          disabled={guardando}
          className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition disabled:opacity-60"
          style={
            esUtil === true
              ? { backgroundColor: VERDE_MEDIO, borderColor: VERDE_MEDIO, color: 'white' }
              : { borderColor: '#d1d5db', color: '#374151' }
          }
        >
          <ThumbsUp size={14} /> Sí
        </button>

        <button
          type="button"
          onClick={() => guardarVoto(false)}
          disabled={guardando}
          className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition disabled:opacity-60"
          style={
            esUtil === false
              ? { backgroundColor: VERDE_OSCURO, borderColor: VERDE_OSCURO, color: 'white' }
              : { borderColor: '#d1d5db', color: '#374151' }
          }
        >
          <ThumbsDown size={14} /> No
        </button>
      </div>

      {/* Lista de motivos desplegada: al marcar No, o al pulsar "cambiar" */}
      {listaVisible && (
        <div className="mt-3">
          <p className="mb-2 text-sm text-gray-600">¿Qué podríamos mejorar? (opcional)</p>
          <div className="flex flex-col gap-1.5">
            {MOTIVOS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => guardarMotivo(m)}
                disabled={guardando}
                className="inline-flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition disabled:opacity-60"
                style={
                  motivo === m
                    ? { backgroundColor: '#e8f0ec', borderColor: VERDE_MEDIO, color: VERDE_OSCURO }
                    : { borderColor: '#e5e7eb', color: '#374151' }
                }
              >
                <span>{m}</span>
                {motivo === m && <Check size={16} />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Motivo ya elegido: lista colapsada, solo el elegido + "cambiar" */}
      {motivoColapsado && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm"
            style={{ backgroundColor: '#e8f0ec', borderColor: VERDE_MEDIO, color: VERDE_OSCURO }}
          >
            <Check size={16} /> {motivo}
          </span>
          <button
            type="button"
            onClick={() => setEditandoMotivo(true)}
            className="inline-flex items-center gap-1 text-xs text-gray-500 underline hover:text-gray-700"
          >
            <Pencil size={12} /> cambiar
          </button>
        </div>
      )}

      <p className="mt-3 text-xs text-gray-400">
        Tu respuesta es anónima para el Directorio y se usa solo para mejorar los comunicados.
      </p>
    </div>
  )
}
