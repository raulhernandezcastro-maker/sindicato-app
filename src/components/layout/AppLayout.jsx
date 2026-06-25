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

  // Mostrar modal si fcm_consentimiento es null O false
  useEffect(() => {
    if (profile && profile.fcm_consentimiento !== true) {
      setShowFCMConsent(true)
    }
  }, [profile])

  const handleConsentAccept = async () => {
    setShowFCMConsent(false)
    await requestPermission()
  }

  const handleConsentReject = () => {
    setShowFCMConsent(false)
  }

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
