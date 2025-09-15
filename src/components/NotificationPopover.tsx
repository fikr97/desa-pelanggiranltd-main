
import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Bell, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

const NotificationPopover = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notifications:user_id=eq.${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (payload) => {
        console.log('New notification received:', payload);
        queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  const handleOpenChange = async (open) => {
    setIsOpen(open);
    if (open && unreadCount > 0) {
      // Mark all as read
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
      if (!error) {
        queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
      }
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 hover:bg-primary/10 relative">
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 text-xs flex items-center justify-center bg-destructive text-destructive-foreground rounded-full animate-pulse">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Notifikasi</h4>
            <p className="text-sm text-muted-foreground">
              Anda memiliki {unreadCount} notifikasi belum dibaca.
            </p>
          </div>
          <div className="grid gap-2 max-h-96 overflow-y-auto">
            {isLoading ? (
              <p>Loading...</p>
            ) : notifications && notifications.length > 0 ? (
              notifications.map((notification) => (
                <div key={notification.id} className={`flex items-start gap-4 p-2 rounded-lg ${!notification.is_read ? 'bg-primary/5' : ''}`}>
                  <div className="grid gap-1">
                    <Link to={notification.link || '#'} onClick={() => setIsOpen(false)}>
                      <p className="text-sm font-medium leading-none">
                        {notification.message}
                      </p>
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: id })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center">Tidak ada notifikasi.</p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationPopover;
