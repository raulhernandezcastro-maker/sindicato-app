import React from 'react'
import { Outlet } from 'react-router-dom'
import { DesktopNav } from './DesktopNav'
import { MobileNav } from './MobileNav'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      {/* Menú lateral escritorio */}
      <DesktopNav />

      {/* Contenido principal */}
      <main className="md:ml-64 pb-20 md:pb-0">
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          {/* 🔑 AQUÍ SE RENDERIZAN LAS PÁGINAS */}
          <Outlet />
        </div>
      </main>

      {/* Menú móvil */}
      <MobileNav />
    </div>
  )
}
