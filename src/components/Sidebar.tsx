import React, { useState } from 'react';
import {
  Home, Users, MapPin, FileText, Settings, BarChart3, Building2,
  ChevronLeft, ChevronRight, X, UsersRound, FileSignature, UserCog, Globe,
  ClipboardList, Sparkles, LogOut, Upload
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileToggle?: () => void;
  onSidebarToggle?: (collapsed: boolean) => void;
}

const Sidebar = ({ isMobileOpen = false, onMobileToggle, onSidebarToggle }: SidebarProps) => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { profile, hasPermission, signOut } = useAuth();

  const { data: logoData } = useQuery({
    queryKey: ['info-desa-logo'],
    queryFn: async () => {
      const { data, error } = await supabase.from('info_desa').select('logo_desa, nama_desa').single();
      if (error && error.code !== 'PGRST116') console.error(error);
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Menu groups for better UX
  const menuGroups = [
    {
      label: 'Utama',
      items: [
        { icon: Home, label: 'Dashboard', path: '/admin', permission: 'sidebar:view:dashboard' },
      ],
    },
    {
      label: 'Kependudukan',
      items: [
        { icon: Users, label: 'Data Penduduk', path: '/penduduk', permission: 'sidebar:view:penduduk' },
        { icon: UsersRound, label: 'Data Keluarga', path: '/data-keluarga', permission: 'sidebar:view:keluarga' },
        { icon: MapPin, label: 'Wilayah', path: '/wilayah', permission: 'sidebar:view:wilayah' },
      ],
    },
    {
      label: 'Layanan & Konten',
      items: [
        { icon: FileSignature, label: 'Surat Menyurat', path: '/template-surat', permission: 'sidebar:view:surat_menyurat' },
        { icon: Upload, label: 'Dokumen Tanah', path: '/upload-dokumen-tanah', permission: 'sidebar:view:dokumen_tanah' },
        { icon: ClipboardList, label: 'Form Tugas', path: '/form-tugas', permission: 'form_tugas:view' },
        { icon: Globe, label: 'Kelola Website', path: '/admin/content', permission: 'sidebar:view:kelola_website' },
        { icon: Building2, label: 'Info Desa', path: '/info-desa', permission: 'sidebar:view:info_desa' },
      ],
    },
    {
      label: 'Analitik',
      items: [
        { icon: BarChart3, label: 'Statistik', path: '/statistik', permission: 'sidebar:view:statistik' },
        { icon: FileText, label: 'Laporan', path: '/laporan', permission: 'sidebar:view:laporan' },
      ],
    },
    {
      label: 'Administrasi',
      items: [
        { icon: UserCog, label: 'Manajemen User', path: '/admin/users', permission: 'sidebar:view:manajemen_user' },
        { icon: Sparkles, label: 'Verifikasi Dok. Tanah', path: '/verifikasi-dokumen-tanah', permission: 'dokumen_tanah:verify' },
        { icon: Settings, label: 'Pengaturan', path: '/pengaturan', permission: 'sidebar:view:pengaturan' },
      ],
    },
  ];

  const visibleGroups = menuGroups
    .map(g => ({
      ...g,
      items: g.items.filter(item => !item.permission || hasPermission(item.permission)),
    }))
    .filter(g => g.items.length > 0);

  const toggleSidebar = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    onSidebarToggle?.(next);
  };

  const closeMobileSidebar = () => onMobileToggle?.();

  const renderNav = (collapsed: boolean, isMobile = false) => (
    <nav className={cn("p-3 space-y-6 overflow-y-auto flex-1", collapsed && "px-2")}>
      {visibleGroups.map(group => (
        <div key={group.label}>
          {!collapsed && (
            <p className="px-3 mb-2 text-[10px] font-bold tracking-[0.15em] uppercase text-muted-foreground/70">
              {group.label}
            </p>
          )}
          {collapsed && !isMobile && (
            <div className="mx-2 mb-2 border-t border-border/50" />
          )}
          <div className="space-y-1">
            {group.items.map(item => {
              const isActive = location.pathname === item.path
                || (item.path !== '/admin' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={isMobile ? closeMobileSidebar : undefined}
                  className={cn(
                    "relative flex items-center rounded-xl text-sm transition-all duration-200 group/nav",
                    collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5 gap-3",
                    isActive
                      ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/20"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  {isActive && (
                    <span className="absolute -left-3 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-gradient-to-b from-primary to-accent" />
                  )}
                  <item.icon className={cn("h-5 w-5 flex-shrink-0 transition-transform", !isActive && "group-hover/nav:scale-110")} />
                  {!collapsed && <span className="font-medium truncate">{item.label}</span>}
                  {!collapsed && isActive && <Sparkles className="h-3.5 w-3.5 ml-auto opacity-90" />}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  const renderProfile = (collapsed: boolean) => {
    if (!profile) return null;
    const initials = (profile.nama || 'U').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    if (collapsed) {
      return (
        <div className="p-2 border-t border-border">
          <div className="h-10 w-10 mx-auto rounded-full bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center font-bold text-sm shadow-md">
            {initials}
          </div>
        </div>
      );
    }
    return (
      <div className="p-3 border-t border-border">
        <div className="rounded-xl border border-border/70 bg-gradient-to-br from-primary/5 to-accent/5 p-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center font-bold text-sm shadow-md flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{profile.nama}</p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider truncate">
                {profile.role === 'superuser' ? 'Superuser' : profile.role === 'administrator' ? 'Administrator' : profile.role === 'kades' ? 'Kepala Desa' : profile.role === 'sekretaris_desa' ? 'Sekretaris Desa' : profile.role === 'kaur_kasi' ? 'Kaur/Kasi' : profile.role === 'kadus' ? 'Kepala Dusun' : profile.role}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[998] md:hidden" onClick={closeMobileSidebar} />
      )}

      {/* Desktop */}
      <aside className={cn(
        "hidden md:flex bg-background border-r border-border h-screen fixed left-0 top-0 z-40",
        "transition-all duration-300 ease-in-out flex-col shadow-xl",
        isCollapsed ? "w-16" : "w-64"
      )}>
        {/* Toggle */}
        <Button
          variant="outline"
          size="icon"
          className="absolute -right-3 top-6 z-50 h-7 w-7 rounded-full bg-background border shadow-lg hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
          onClick={toggleSidebar}
        >
          {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </Button>

        {/* Brand */}
        <div className={cn("border-b border-border flex-shrink-0", isCollapsed ? "p-2 pt-4" : "p-4")}>
          <Link to="/admin" className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-xl blur-md opacity-60" />
              {logoData?.logo_desa ? (
                <img src={logoData.logo_desa} alt="Logo" className="relative w-10 h-10 object-contain bg-white rounded-xl p-1 ring-1 ring-border shadow" />
              ) : (
                <div className="relative w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
              )}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <h1 className="text-base font-display font-bold truncate">SIDesa</h1>
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] truncate">
                  Admin Dashboard
                </p>
              </div>
            )}
          </Link>
        </div>

        {renderNav(isCollapsed)}
        {renderProfile(isCollapsed)}
      </aside>

      {/* Mobile */}
      {isMobileOpen && (
        <aside className="fixed left-0 top-0 z-[999] w-72 h-screen bg-background border-r border-border flex flex-col md:hidden shadow-2xl">
          <Button variant="ghost" size="icon" className="absolute top-4 right-4 h-8 w-8" onClick={closeMobileSidebar}>
            <X className="h-4 w-4" />
          </Button>
          <div className="p-4 border-b border-border pr-12">
            <Link to="/admin" className="flex items-center gap-3" onClick={closeMobileSidebar}>
              {logoData?.logo_desa ? (
                <img src={logoData.logo_desa} alt="Logo" className="w-10 h-10 object-contain bg-white rounded-xl p-1 ring-1 ring-border" />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-base font-display font-bold">SIDesa</h1>
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em]">Admin Dashboard</p>
              </div>
            </Link>
          </div>
          {renderNav(false, true)}
          {renderProfile(false)}
        </aside>
      )}
    </>
  );
};

export default Sidebar;
