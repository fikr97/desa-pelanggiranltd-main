
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleSidebarToggle = (collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
  };

  return (
    <div className="min-h-screen bg-muted/30 flex w-full overflow-hidden">
      <Sidebar 
        isMobileOpen={isMobileMenuOpen} 
        onMobileToggle={toggleMobileMenu}
        onSidebarToggle={handleSidebarToggle}
      />
      <div className={`
        flex-1 flex flex-col w-full min-w-0 overflow-hidden transition-all duration-300
        ${isSidebarCollapsed ? 'md:ml-16' : 'md:ml-64'}
      `}>
        <Header onMobileMenuToggle={toggleMobileMenu} isSidebarCollapsed={isSidebarCollapsed} />
        <main className="flex-1 overflow-auto w-full pt-16">
          <div className="h-full w-full p-2 sm:p-3 md:p-4 lg:p-6 max-w-full">
            {children}
          </div>
        </main>
        <footer className="p-4 text-center text-sm text-muted-foreground">
          Copyright © 2024 Ihsanul Fikri
        </footer>
      </div>
    </div>
  );
};

export default Layout;
