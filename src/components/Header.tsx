
import React from 'react';
import { Bell, Menu, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from '@/components/ThemeProvider';
import UserMenu from './UserMenu';
import DateTime from './DateTime';

interface HeaderProps {
  onMobileMenuToggle?: () => void;
  isSidebarCollapsed?: boolean;
}

const Header = ({ onMobileMenuToggle, isSidebarCollapsed = false }: HeaderProps) => {
  const { theme, setTheme } = useTheme();
  
  // Fetch village name with refetch interval to get updated data
  const { data: infoDesaData } = useQuery({
    queryKey: ['info-desa-header'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('info_desa')
        .select('nama_desa')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching village name:', error);
        return null;
      }
      return data;
    },
    refetchInterval: 10000, // Refetch every 10 seconds to get updated data
    staleTime: 0 // Always consider data stale to force refetch
  });

  const displayTitle = infoDesaData?.nama_desa || 'Dashboard';

  return (
    <header className={`
      glass border-b border-border/50 px-3 sm:px-6 py-4 fixed top-0 right-0 z-40 transition-all duration-300
      ${isSidebarCollapsed ? 'left-0 md:left-16' : 'left-0 md:left-64'}
    `}>
      <div className="flex items-center justify-between max-w-full">
        <div className="flex items-center space-x-4 min-w-0 flex-1">
          {/* Mobile Menu Button - only visible on mobile */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden h-8 w-8 flex-shrink-0 hover:bg-primary/10" 
            onClick={onMobileMenuToggle}
          >
            <Menu className="h-4 w-4" />
          </Button>
          
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gradient truncate ml-2 md:ml-0">
            {displayTitle}
          </h2>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
          <div className="hidden sm:block">
            <DateTime />
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 sm:h-10 sm:w-10 hover:bg-primary/10"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <Sun className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </Button>
          
          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 hover:bg-primary/10 relative">
            <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full animate-pulse"></span>
          </Button>
          
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default Header;
