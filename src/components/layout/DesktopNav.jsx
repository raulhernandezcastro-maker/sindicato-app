import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, FileText, FolderOpen, User, Users, DollarSign, LayoutDashboard, LogOut } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'

export function DesktopNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAdministrador, isDirector, signOut, profile } = useAuth()

  const socioLinks = [
    { to: '/', icon: Home, label: 'Inicio' },
    { to: '/avisos', icon: FileText, label: 'Avisos' },
    { to: '/documentos', icon: FolderOpen, label: 'Documentos' },
    { to: '/perfil', icon: User, label: 'Mi Perfil' },
  ]

  const directorLinks = [
    ...socioLinks,
    { to: '/dashboard', icon: LayoutDashboard, label: 'Panel de Gestión' },
    { to: '/cuotas', icon: DollarSign, label: 'Cuotas' },
  ]

  const adminLinks = [
    ...directorLinks,
    { to: '/socios', icon: Users, label: 'Gestión de Socios' },
  ]

  const links = isAdministrador ? adminLinks : isDirector ? directorLinks : socioLinks

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const getInitials = (nombre) => {
    if (!nombre) return 'U'
    return nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen bg-background border-r fixed left-0 top-0">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-primary">Sindicato</h1>
        <p className="text-xs text-muted-foreground">
          Rol: {isAdministrador ? 'Administrador' : isDirector ? 'Director' : 'Socio'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {links.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="p-4 border-t space-y-3">
        <div className="flex items-center space-x-3 px-2">
          <Avatar>
            <AvatarImage src={profile?.foto_url} />
            <AvatarFallback>{getInitials(profile?.nombre)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{profile?.nombre}</p>
            <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
          </div>
        </div>

        <Button variant="outline" className="w-full" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Cerrar Sesión
        </Button>
      </div>
    </aside>
  )
}
