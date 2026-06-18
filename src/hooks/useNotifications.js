import { useEffect, useState } from 'react'
import { requestNotificationPermission, onForegroundMessage } from '../lib/firebase'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useNotifications() {
  const { user } = useAuth()
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  )

  useEffect(() => {
    if (!user?.id) return
    if (typeof Notification === 'undefined') return
    // Solo registrar token si ya tenía permiso Y ya aceptó el consentimiento
    // El modal FCMConsentModal es quien llama a requestPermission() la primera vez
    if (Notification.permission === 'granted') {
      registerToken()
    }
  }, [user?.id])

  // Mensajes en primer plano — FCM ya maneja la notificación push,
  // no se genera notificación local para evitar duplicados
  useEffect(() => {
    const unsubscribe = onForegroundMessage((payload) => {
      console.log('[FCM] Mensaje en primer plano recibido:', payload)
    })
    return unsubscribe
  }, [])

  const registerToken = async () => {
    if (!user?.id) return
    try {
      const token = await requestNotificationPermission()
      if (!token) return

      // Guardar token en Supabase (upsert por token)
      await supabase.from('fcm_tokens').upsert(
        { user_id: user.id, token, updated_at: new Date().toISOString() },
        { onConflict: 'token' }
      )
    } catch (err) {
      console.error('[FCM] Error registrando token:', err)
    }
  }

  const requestPermission = async () => {
    const token = await requestNotificationPermission()
    setPermission(Notification.permission)
    if (token) await registerToken()
    return token
  }

  return { permission, requestPermission }
}
