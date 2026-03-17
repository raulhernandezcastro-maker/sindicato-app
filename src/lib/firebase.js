import { initializeApp } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: "AIzaSyC1kUOV03HaTvhJ-tTUtJtY6BsCRXwSFA4",
  authDomain: "sindicato-liberty.firebaseapp.com",
  projectId: "sindicato-liberty",
  storageBucket: "sindicato-liberty.firebasestorage.app",
  messagingSenderId: "394236327667",
  appId: "1:394236327667:web:da323695cea4dcfd99e986"
}

const VAPID_KEY = "BFfcG2oSE1NkfNZwTHG1QevIrvj3GGrAHVEZsuvx6kswearlgMVekW46DXuD7bYqZ7PQ_VPNEQ1AS4vs8TCUciA"

const app = initializeApp(firebaseConfig)

// Messaging solo funciona en navegadores que lo soporten
let messaging = null
try {
  messaging = getMessaging(app)
} catch (err) {
  console.warn('[FCM] Messaging no soportado en este entorno:', err.message)
}

// Solicitar permiso y obtener token FCM
export const requestNotificationPermission = async () => {
  if (!messaging) return null
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.warn('[FCM] Permiso denegado')
      return null
    }
    const token = await getToken(messaging, { vapidKey: VAPID_KEY })
    return token
  } catch (err) {
    console.error('[FCM] Error obteniendo token:', err)
    return null
  }
}

// Escuchar mensajes cuando la app está en primer plano
export const onForegroundMessage = (callback) => {
  if (!messaging) return () => {}
  return onMessage(messaging, callback)
}

export { messaging }
