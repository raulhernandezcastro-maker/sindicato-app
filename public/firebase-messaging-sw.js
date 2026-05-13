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

const APP_URL = 'https://sindicato-app-4vkd.vercel.app/avisos'

// Notificaciones en segundo plano
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Mensaje recibido:', payload)

  const titulo = payload.data?.titulo || 'Sindicato Liberty'
  const cuerpo = payload.data?.cuerpo || 'Tienes un nuevo aviso'

  self.registration.showNotification(titulo, {
    body:    cuerpo,
    icon:    '/logo.png',
    badge:   '/logo.png',
    vibrate: [200, 100, 200],
    tag:     'aviso-sindicato', // evita duplicados si llegan dos eventos
    data:    { url: APP_URL },
  })
})

// Abrir la app al hacer clic en la notificación
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Clic en notificación:', event.notification)
  event.notification.close()

  const url = event.notification.data?.url || APP_URL

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si la app ya está abierta en alguna pestaña, enfocarla y navegar
      for (const client of clientList) {
        if (client.url.includes('sindicato-app-4vkd.vercel.app')) {
          client.focus()
          return client.navigate(url)
        }
      }
      // Si no está abierta, abrir nueva ventana
      return clients.openWindow(url)
    })
  )
})
