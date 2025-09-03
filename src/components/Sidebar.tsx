import React, { useState } from 'react';
import { Home, Users, MapPin, FileText, Settings, BarChart3, Building2, Menu, ChevronLeft, ChevronRight, X, UsersRound, FileSignature, UserCog, Globe, ClipboardList } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileToggle?: () => void;
  onSidebarToggle?: (collapsed: boolean) => void;
}

const Sidebar = ({ isMobileOpen = false, onMobileToggle, onSidebarToggle }: SidebarProps) => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { profile } = useAuth();

  const { data: logoData } = useQuery({
    queryKey: ['info-desa-logo'],
    queryFn: async () => {
        const { data, error } = await supabase
            .from('info_desa')
            .select('logo_desa')
            .single();
        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching logo:', error);
        }
        return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  const menuItems = [
    {
      icon: Home,
      label: 'Dashboard',
      path: '/admin'
    },
    {
      icon: Users,
      label: 'Data Penduduk',
      path: '/penduduk'
    },
    {
      icon: UsersRound,
      label: 'Data Keluarga',
      path: '/data-keluarga'
    },
    {
      icon: MapPin,
      label: 'Wilayah',
      path: '/wilayah',
      adminOnly: true
    },
    {
      icon: Building2,
      label: 'Info Desa',
      path: '/info-desa'
    },
    {
      icon: FileSignature,
      label: 'Template Surat',
      path: '/template-surat'
    },
    {
      icon: ClipboardList,
      label: 'Form Tugas',
      path: '/form-tugas'
    },
    {
      icon: Globe,
      label: 'Kelola Website',
      path: '/admin/content',
      adminOnly: true
    },
    {
      icon: BarChart3,
      label: 'Statistik',
      path: '/statistik'
    },
    {
      icon: FileText,
      label: 'Laporan',
      path: '/laporan'
    },
    {
      icon: UserCog,
      label: 'Manajemen User',
      path: '/admin/users',
      adminOnly: true
    },
    {
      icon: Settings,
      label: 'Pengaturan',
      path: '/pengaturan'
    }
  ];

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(item => {
    if (item.adminOnly && profile?.role !== 'admin') {
      return false;
    }
    return true;
  });

  const toggleSidebar = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    onSidebarToggle?.(newCollapsedState);
  };

  const closeMobileSidebar = () => {
    onMobileToggle?.();
  };

  return <>
      {/* Mobile Overlay - increased z-index to ensure it's on top */}
      {isMobileOpen && <div className="fixed inset-0 bg-black/50 z-[998] md:hidden" onClick={closeMobileSidebar} />}

      {/* Desktop Sidebar - fixed position */}
      <div className={`
        hidden md:flex
        bg-card shadow-lg border-r border-border h-screen fixed left-0 top-0 z-40
        transition-all duration-300 ease-in-out flex-col
        ${isCollapsed ? 'w-16' : 'w-64'}
      `}>
        
        {/* Desktop Toggle Button */}
        <Button variant="outline" size="icon" className="absolute -right-3 top-6 z-50 bg-card border shadow-md" onClick={toggleSidebar}>
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>

        {/* Header */}
        <div className="p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              {logoData?.logo_desa ? (
                <img src={logoData.logo_desa} alt="Logo Desa" className="h-8 w-8 object-contain" />
              ) : (
                <Building2 className="h-6 w-6 text-primary-foreground" />
              )}
            </div>
            {!isCollapsed && <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold text-foreground truncate">OpenSID</h1>
                <p className="text-sm text-muted-foreground truncate">Sistem Informasi Desa</p>
              </div>}
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="p-3 space-y-1 overflow-y-auto flex-1">
          {filteredMenuItems.map(item => {
          const isActive = location.pathname === item.path;
          return <Link key={item.path} to={item.path} className={`flex items-center px-3 py-2.5 rounded-lg transition-colors text-sm ${isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'} ${isCollapsed ? 'justify-center' : 'space-x-3'}`} title={isCollapsed ? item.label : undefined}>
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span className="font-medium truncate text-sm">{item.label}</span>}
              </Link>;
        })}
        </nav>
      </div>

      {/* Mobile Sidebar - Fixed overlay with highest z-index */}
      {isMobileOpen && <div className="fixed left-0 top-0 z-[999] w-64 h-screen bg-card shadow-lg border-r border-border flex flex-col md:hidden">
          {/* Close Button */}
          <Button variant="ghost" size="icon" className="absolute top-4 right-4 z-10 h-8 w-8" onClick={closeMobileSidebar}>
            <X className="h-4 w-4" />
          </Button>

          {/* Header */}
          <div className="p-4 border-b border-border flex-shrink-0 pr-12">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                {logoData?.logo_desa ? (
                  <img src={logoData.logo_desa} alt="Logo Desa" className="h-6 w-6 object-contain" />
                ) : (
                  <Building2 className="h-4 w-4 text-primary-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-bold text-foreground truncate">OpenSID</h1>
                <p className="text-xs text-muted-foreground truncate">Sistem Informasi Desa</p>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="p-3 space-y-1 overflow-y-auto flex-1">
            {filteredMenuItems.map(item => {
          const isActive = location.pathname === item.path;
          return <Link key={item.path} to={item.path} onClick={closeMobileSidebar} className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}>
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium truncate text-xs">{item.label}</span>
                </Link>;
        })}
          </nav>
        </div>}
    </>;
};

export default Sidebar;
