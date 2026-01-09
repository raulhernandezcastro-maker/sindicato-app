import React from 'react';
import { DesktopNav } from './DesktopNav';
import { MobileNav } from './MobileNav';

export function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-background">
      <DesktopNav />
      <main className="md:ml-64 pb-20 md:pb-0">
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
