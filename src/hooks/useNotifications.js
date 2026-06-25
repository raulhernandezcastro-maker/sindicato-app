import { useEffect, useState } from 'react'
import { requestNotificationPermission, onForegroundMessage } from '../lib/firebase'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useNotifications() {
  const { user } = useAuth()
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  )
  const [consentimiento, setConsentimiento] = useState(null)

  // Leer fcm_consentimiento desde profiles al montar
  useEffect(() => {
    if (!user?.id) return

    const fetchConsentimiento = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('fcm_consentimiento')
        .eq('id', user.id)
        .single()
      setConsentimiento(data?.fcm_consentimiento ?? false)
    }

    fetchConsentimiento()
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return
    if (typeof Notification === 'undefined') return

    if (Notification.permission === 'granted') {
      registerToken()
    }
  }, [user?.id])

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
    if (token) {
      await registerToken()
      setConsentimiento(true)
    }
    return token
  }

  return { permission, requestPermission, consentimiento, setConsentimiento }
}
