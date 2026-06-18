import React, { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { DesktopNav } from './DesktopNav'
import { MobileNav } from './MobileNav'
import { InstallPWA } from './InstallPWA'
import { FCMConsentModal } from '../auth/FCMConsentModal'
import { useNotifications } from '../../hooks/useNotifications'
import { useAuth } from '../../contexts/AuthContext'

export function AppLayout() {
  const { profile } = useAuth()
  const { requestPermission } = useNotifications()
  const [showFCMConsent, setShowFCMConsent] = useState(false)

  // Mostrar modal de consentimiento solo si aún no ha respondido (null)
  useEffect(() => {
    if (profile && profile.fcm_consentimiento === null) {
      // Pequeño delay para no mostrar el modal en el mismo instante del login
      const timer = setTimeout(() => setShowFCMConsent(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [profile])

  const handleConsentAccept = async () => {
    setShowFCMConsent(false)
    // Solicitar permiso al navegador y registrar token FCM
    await requestPermission()
  }

  const handleConsentReject = () => {
    setShowFCMConsent(false)
  }

  // Usar la ruta actual como key para forzar remonte de cada página
  const location = useLocation()

  return (
    <div className="min-h-screen bg-background">
      {/* Menú lateral escritorio */}
      <DesktopNav />

      {/* Menú móvil (incluye header superior + barra inferior + offsets) */}
      <MobileNav />

      {/* Banner instalación PWA */}
      <InstallPWA />

      {/* Modal consentimiento notificaciones push (Ley 21.719) */}
      {showFCMConsent && (
        <FCMConsentModal
          onAccept={handleConsentAccept}
          onReject={handleConsentReject}
        />
      )}

      {/* Contenido principal */}
      {/* pt-16 móvil = barra superior | pb-20 móvil = barra inferior */}
      <main className="md:ml-64 pt-20 pb-20 md:pt-0 md:pb-0">
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          <Outlet key={location.pathname} />
        </div>
      </main>
    </div>
  )
}
