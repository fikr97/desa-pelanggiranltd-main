import React from 'react';
import { Menu, Moon, Sun, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from '@/components/AdminThemeProvider';
import UserMenu from './UserMenu';
import DateTime from './DateTime';
import NotificationPopover from './NotificationPopover';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMobileMenuToggle?: () => void;
  isSidebarCollapsed?: boolean;
}

const AdminHeader = ({ onMobileMenuToggle, isSidebarCollapsed = false }: HeaderProps) => {
  const { theme, setTheme } = useTheme();

  const { data: infoDesaData } = useQuery({
    queryKey: ['info-desa-header'],
    queryFn: async () => {
      const { data, error } = await supabase.from('info_desa').select('nama_desa').single();
      if (error && error.code !== 'PGRST116') return null;
      return data;
    },
    refetchInterval: 10000,
    staleTime: 0,
  });

  const displayTitle = infoDesaData?.nama_desa || 'Dashboard';

  return (
    <header className={cn(
      "fixed top-0 right-0 z-40 transition-all duration-300 h-16",
      "bg-background/70 backdrop-blur-xl border-b border-border/60",
      "supports-[backdrop-filter]:bg-background/60",
      isSidebarCollapsed ? "left-0 md:left-16" : "left-0 md:left-64"
    )}>
      <div className="h-full flex items-center justify-between px-3 sm:px-6 gap-3">
        {/* Left: Menu + Title */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9 flex-shrink-0 hover:bg-primary/10 rounded-xl"
            onClick={onMobileMenuToggle}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg md:text-xl font-display font-bold truncate">
                {displayTitle}
              </h2>
              <span className="hidden md:inline-flex badge-premium !px-2 !py-0.5 !text-[10px]">
                <Sparkles className="h-3 w-3" /> Pro
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-muted-foreground uppercase tracking-[0.15em]">
              Sistem Informasi Desa
            </p>
          </div>
        </div>

        {/* Center: Search (desktop only) */}
        <div className="hidden lg:block flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari halaman, data, atau perintah..."
              className="pl-10 pr-14 h-9 rounded-xl bg-muted/40 border-border/60 focus-visible:bg-background"
              onKeyDown={(e) => {
                if (e.key === 'Escape') (e.target as HTMLInputElement).value = '';
              }}
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <div className="hidden md:block px-3 py-1.5 rounded-xl bg-muted/40 border border-border/60">
            <DateTime />
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl hover:bg-primary/10"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            title={theme === 'light' ? 'Mode Gelap' : 'Mode Terang'}
          >
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>

          <NotificationPopover />
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
