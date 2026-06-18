import React from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

/**
 * Modal de consentimiento para notificaciones push (FCM)
 * Ley 21.719 — se muestra una única vez cuando fcm_consentimiento === null
 */
export function FCMConsentModal({ onAccept, onReject }) {
  const { user } = useAuth()

  const guardarConsentimiento = async (valor) => {
    if (!user?.id) return
    await supabase.from('profiles').update({
      fcm_consentimiento: valor,
      fcm_consentimiento_fecha: new Date().toISOString()
    }).eq('id', user.id)
  }

  const handleAceptar = async () => {
    await guardarConsentimiento(true)
    onAccept()
  }

  const handleRechazar = async () => {
    await guardarConsentimiento(false)
    onReject()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
         style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4" style={{ backgroundColor: '#1e3a2f' }}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔔</span>
            <h2 className="text-white text-base font-bold leading-tight">
              Notificaciones del Sindicato
            </h2>
          </div>
        </div>

        {/* Cuerpo */}
        <div className="px-6 py-5 space-y-3">
          <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>
            El Sindicato Interempresas Liberty Seguros desea enviarte{' '}
            <strong>avisos, comunicados y novedades importantes</strong> a través
            de notificaciones push.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>
            Tu token de dispositivo se almacenará de forma segura y se usará
            exclusivamente para enviarte estas notificaciones. Puedes revocar
            este consentimiento en cualquier momento desde tu perfil.
          </p>
          <p className="text-xs leading-relaxed" style={{ color: '#6b7280' }}>
            Tratamiento conforme a la{' '}
            <a
              href="https://sindicatoliberty.com/privacidad.php"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
              style={{ color: '#2d7a4f' }}
            >
              Ley 21.719
            </a>
            {' '}— Política de Privacidad del Sindicato.
          </p>
        </div>

        {/* Botones */}
        <div className="px-6 pb-6 flex flex-col gap-2">
          <button
            onClick={handleAceptar}
            className="w-full py-3 rounded-xl text-white text-sm font-bold transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#2d7a4f' }}
          >
            Aceptar notificaciones
          </button>
          <button
            onClick={handleRechazar}
            className="w-full py-2.5 rounded-xl text-sm font-medium border transition-colors hover:bg-gray-50"
            style={{ color: '#6b7280', borderColor: '#d1d5db' }}
          >
            No, gracias
          </button>
        </div>

      </div>
    </div>
  )
}
