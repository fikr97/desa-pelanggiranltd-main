
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { toast } from '../hooks/use-toast';

// Define the structure of a permission object
interface Permission {
  id: number;
  role: string;
  permission: string;
  description: string;
  is_enabled: boolean;
}

// Group permissions by a category derived from the permission string
const groupPermissions = (permissions: Permission[]) => {
  return permissions.reduce((acc, permission) => {
    const category = permission.permission.split(':')[0] || 'general';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);
};

const PermissionManager = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPermissions = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('role', 'kadus');

      if (error) {
        setError('Gagal memuat data hak akses: ' + error.message);
        toast({
          title: 'Error',
          description: 'Gagal memuat data hak akses.',
          variant: 'destructive',
        });
      } else {
        setPermissions(data as Permission[]);
        console.log('Permissions:', data);
      }
      setLoading(false);
    };

    fetchPermissions();
  }, []);

  const handlePermissionToggle = async (permissionId: number, newStatus: boolean) => {
    // Optimistically update the UI
    setPermissions(prev =>
      prev.map(p => (p.id === permissionId ? { ...p, is_enabled: newStatus } : p))
    );

    const { error } = await supabase
      .from('role_permissions')
      .update({ is_enabled: newStatus })
      .eq('id', permissionId);

    if (error) {
      // Revert the UI change on error
      setPermissions(prev =>
        prev.map(p => (p.id === permissionId ? { ...p, is_enabled: !newStatus } : p))
      );
      toast({
        title: 'Update Gagal',
        description: 'Gagal memperbarui hak akses: ' + error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Sukses',
        description: 'Hak akses telah diperbarui.',
      });
    }
  };

  const groupedPermissions = useMemo(() => groupPermissions(permissions), [permissions]);

  if (loading) {
    return <div>Memuat data hak akses...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-8">
      {Object.entries(groupedPermissions).map(([category, perms]) => (
        <div key={category} className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold capitalize mb-4">{category.replace(/_/g, ' ')}</h3>
          <div className="space-y-4">
            {perms.map(permission => (
              <div key={permission.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
                <Label htmlFor={`perm-${permission.id}`} className="flex-grow pr-4">
                  {permission.description || permission.permission}
                </Label>
                <Switch
                  id={`perm-${permission.id}`}
                  checked={permission.is_enabled}
                  onCheckedChange={newStatus => handlePermissionToggle(permission.id, newStatus)}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PermissionManager;
