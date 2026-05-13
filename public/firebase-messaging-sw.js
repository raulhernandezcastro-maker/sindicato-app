// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: "AIzaSyC1kUOV03HaTvhJ-tTUtJtY6BsCRXwSFA4",
  authDomain: "sindicato-liberty.firebaseapp.com",
  projectId: "sindicato-liberty",
  storageBucket: "sindicato-liberty.firebasestorage.app",
  messagingSenderId: "394236327667",
  appId: "1:394236327667:web:da323695cea4dcfd99e986"
})

const messaging = firebase.messaging()

// Manejar notificaciones en segundo plano
// IMPORTANTE: solo usar data payload (sin notification) para evitar duplicados
// FCM muestra la notificación automáticamente si viene con "notification"
// Por eso usamos solo "data" y la mostramos manualmente aquí
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Mensaje en segundo plano:', payload)

  const titulo  = payload.data?.titulo  || payload.notification?.title || 'Sindicato Liberty'
  const cuerpo  = payload.data?.cuerpo  || payload.notification?.body  || 'Tienes un nuevo aviso'

  self.registration.showNotification(titulo, {
    body:    cuerpo,
    icon:    '/logo.png',
    badge:   '/logo.png',
    vibrate: [200, 100, 200],
    data:    { url: 'https://sindicato-app-4vkd.vercel.app/avisos' },
  })
})

// Abrir la app al hacer clic en la notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || 'https://sindicato-app-4vkd.vercel.app/avisos'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si la app ya está abierta, enfócarla
      for (const client of clientList) {
        if (client.url.includes('sindicato-app-4vkd.vercel.app') && 'focus' in client) {
          return client.focus()
        }
      }
      // Si no está abierta, abrir nueva ventana
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})
