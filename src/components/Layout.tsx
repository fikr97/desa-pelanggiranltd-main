import React, { useState } from 'react';
import Sidebar from './Sidebar';
import AdminHeader from './AdminHeader';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex w-full overflow-hidden bg-gradient-to-br from-background via-background to-muted/40">
      {/* Ambient background shapes */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/3 -right-40 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <Sidebar
        isMobileOpen={isMobileMenuOpen}
        onMobileToggle={() => setIsMobileMenuOpen(v => !v)}
        onSidebarToggle={setIsSidebarCollapsed}
      />

      <div className={cn(
        "relative flex-1 flex flex-col w-full min-w-0 overflow-hidden transition-all duration-300",
        isSidebarCollapsed ? "md:ml-16" : "md:ml-64"
      )}>
        <AdminHeader
          onMobileMenuToggle={() => setIsMobileMenuOpen(v => !v)}
          isSidebarCollapsed={isSidebarCollapsed}
        />
        <main className="flex-1 overflow-auto w-full pt-16">
          <div className="h-full w-full p-3 sm:p-4 md:p-6 lg:p-8 max-w-full">
            {children}
          </div>
        </main>
        <footer className="py-4 px-6 text-center text-xs text-muted-foreground border-t border-border/40 backdrop-blur bg-background/40">
          <p>
            © {new Date().getFullYear()}{' '}
            <span className="font-semibold">SIDesa Platform</span>{' '}
            — Dibuat oleh Ihsanul Fikri
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
