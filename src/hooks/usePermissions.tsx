
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const usePermissions = () => {
  const { profile } = useAuth();

  const { data: permissions, isLoading } = useQuery({
    queryKey: ['permissions', profile?.role],
    queryFn: async () => {
      if (!profile?.role) return [];
      const { data, error } = await supabase
        .from('role_permissions')
        .select('permission, is_enabled')
        .eq('role', profile.role);

      if (error) {
        console.error('Error fetching permissions:', error);
        return [];
      }
      return data;
    },
    enabled: !!profile?.role,
  });

  const hasPermission = (permissionName: string) => {
    if (!permissions) return false;
    const permission = permissions.find(p => p.permission === permissionName);
    return permission?.is_enabled || false;
  };

  return { permissions, hasPermission, isLoading };
};
