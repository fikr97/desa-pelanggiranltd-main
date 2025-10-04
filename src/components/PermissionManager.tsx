
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
  const categoryMap: Record<string, string> = {
    // Penduduk permissions
    'button:create:penduduk': 'penduduk',
    'button:edit:penduduk': 'penduduk',
    'button:delete:penduduk': 'penduduk',
    'button:import:penduduk': 'penduduk',
    'sidebar:view:penduduk': 'penduduk',
    
    // Keluarga permissions
    'button:manage:keluarga': 'keluarga',
    'sidebar:view:keluarga': 'keluarga',
    
    // Surat permissions
    'button:create:surat_keluar': 'surat',
    'button:edit:surat_keluar': 'surat',
    'button:delete:surat_keluar': 'surat',
    'sidebar:view:surat_keluar': 'surat',
    'button:create:surat_template': 'surat',
    'button:edit:surat_template': 'surat',
    'button:delete:surat_template': 'surat',
    'sidebar:view:template_surat': 'surat',
    
    // Form Tugas permissions
    'form_tugas:view': 'form_tugas',
    'form_tugas:create': 'form_tugas',
    'form_tugas:fill': 'form_tugas',
    'form_tugas:edit': 'form_tugas',
    'form_tugas:delete': 'form_tugas',
    'sidebar:view:form_tugas': 'form_tugas',
    
    // Berita permissions
    'button:manage:berita': 'berita',
    'sidebar:view:berita': 'berita',
    
    // Dashboard permissions
    'sidebar:view:dashboard': 'dashboard',
    
    // Statistik permissions
    'sidebar:view:statistik': 'statistik',
    
    // Laporan permissions
    'sidebar:view:laporan': 'laporan',
    
    // Wilayah permissions
    'sidebar:view:wilayah': 'wilayah',
    
    // Info Desa permissions
    'sidebar:view:info_desa': 'info_desa',
    
    // Kelola Website permissions
    'sidebar:view:kelola_website': 'kelola_website',
    
    // Manajemen User permissions
    'button:edit:manajemen_user': 'manajemen_user',
    'button:create:manajemen_user': 'manajemen_user',
    'button:delete:manajemen_user': 'manajemen_user',
    'sidebar:view:manajemen_user': 'manajemen_user',
    
    // Pengaturan permissions
    'button:manage:permissions': 'pengaturan',
    'sidebar:view:pengaturan': 'pengaturan'
  };

  return permissions.reduce((acc, permission) => {
    // First check the explicit mapping
    let category = categoryMap[permission.permission];
    
    // If no explicit mapping, try to determine from the permission string
    if (!category) {
      if (permission.permission.includes('penduduk')) {
        category = 'penduduk';
      } else if (permission.permission.includes('surat')) {
        category = 'surat';
      } else if (permission.permission.includes('form_tugas')) {
        category = 'form_tugas';
      } else if (permission.permission.includes('keluarga')) {
        category = 'keluarga';
      } else if (permission.permission.includes('berita')) {
        category = 'berita';
      } else if (permission.permission.includes('statistik')) {
        category = 'statistik';
      } else if (permission.permission.includes('laporan')) {
        category = 'laporan';
      } else if (permission.permission.includes('dashboard')) {
        category = 'dashboard';
      } else if (permission.permission.includes('wilayah')) {
        category = 'wilayah';
      } else if (permission.permission.includes('info_desa')) {
        category = 'info_desa';
      } else if (permission.permission.includes('kelola_website')) {
        category = 'kelola_website';
      } else if (permission.permission.includes('manajemen_user')) {
        category = 'manajemen_user';
      } else if (permission.permission.includes('pengaturan')) {
        category = 'pengaturan';
      } else {
        // Default to the first part of the permission string if no specific category found
        category = permission.permission.split(':')[0] || 'general';
      }
    }
    
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
    <div className="space-y-6">
      {Object.entries(groupedPermissions).map(([category, perms]) => (
        <div key={category} className="p-5 border border-gray-200 rounded-xl bg-white shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="capitalize">{category.replace(/_/g, ' ')}</span>
            <span className="ml-2 text-sm bg-blue-100 text-blue-800 py-0.5 px-2 rounded-full">
              {perms.length} akses
            </span>
          </h3>
          <div className="space-y-3 pl-2">
            {perms.map(permission => (
              <div key={permission.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <Label htmlFor={`perm-${permission.id}`} className="flex-grow pr-4 cursor-pointer">
                  <div className="font-medium text-gray-700">
                    {permission.description || permission.permission}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {permission.permission}
                  </div>
                </Label>
                <Switch
                  id={`perm-${permission.id}`}
                  checked={permission.is_enabled}
                  onCheckedChange={newStatus => handlePermissionToggle(permission.id, newStatus)}
                  className="data-[state=checked]:bg-blue-600"
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
