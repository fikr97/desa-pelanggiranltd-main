import React from 'react';
import { User, LogOut, Settings, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

const UserMenu = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  if (!profile) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role: string) => {
    return role === 'admin' ? 'bg-red-500' : 'bg-blue-500';
  };

  const getRoleLabel = (role: string) => {
    return role === 'admin' ? 'Admin' : 'Kadus';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-primary/10">
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarImage src={profile.avatar_url || ''} alt={profile.nama} />
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
              {getInitials(profile.nama)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-64 glass border-border/50" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium leading-none text-foreground">
                {profile.nama}
              </p>
              <Badge 
                variant="secondary" 
                className={`${getRoleColor(profile.role)} text-primary-foreground text-xs px-2 py-0.5`}
              >
                <Shield className="w-3 h-3 mr-1" />
                {getRoleLabel(profile.role)}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {profile.email}
            </p>
            {profile.dusun && (
              <p className="text-xs text-muted-foreground">
                Dusun: {profile.dusun}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className="bg-border/50" />
        
        <DropdownMenuItem 
          className="cursor-pointer hover:bg-primary/10"
          onClick={() => navigate('/profile')}
        >
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          className="cursor-pointer hover:bg-primary/10"
          onClick={() => navigate('/pengaturan')}
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>Pengaturan</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-border/50" />
        
        <DropdownMenuItem 
          className="cursor-pointer hover:bg-destructive/10 focus:bg-destructive/10 text-destructive"
          onClick={signOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Keluar</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;