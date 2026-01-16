import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, FolderOpen, User, Users, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

export function MobileNav() {
  const location = useLocation();
  const { isAdministrador, isDirector } = useAuth();

  const socioLinks = [
    { to: '/', icon: Home, label: 'Inicio' },
    { to: '/avisos', icon: FileText, label: 'Avisos' },
    { to: '/documentos', icon: FolderOpen, label: 'Documentos' },
    { to: '/perfil', icon: User, label: 'Perfil' }
  ];

  const directorLinks = [
    { to: '/', icon: Home, label: 'Inicio' },
    { to: '/avisos', icon: FileText, label: 'Avisos' },
    { to: '/documentos', icon: FolderOpen, label: 'Documentos' },
    { to: '/dashboard', icon: LayoutDashboard, label: 'Panel' },
    { to: '/perfil', icon: User, label: 'Perfil' }
  ];

  const adminLinks = [
    { to: '/', icon: Home, label: 'Inicio' },
    { to: '/avisos', icon: FileText, label: 'Avisos' },
    { to: '/dashboard', icon: LayoutDashboard, label: 'Panel' },
    { to: '/socios', icon: Users, label: 'Socios' },
    { to: '/perfil', icon: User, label: 'Perfil' }
  ];

  const links = isAdministrador ? adminLinks : isDirector ? directorLinks : socioLinks;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden">
      <div className="flex items-center justify-around h-16">
        {links.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
