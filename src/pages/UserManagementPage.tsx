import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { UserPlus, Edit, Trash2, KeyRound } from 'lucide-react';

interface UserProfile {
  id: string;
  user_id: string;
  nama: string;
  email: string;
  dusun: string;
  role: 'admin' | 'kadus';
  created_at: string;
  updated_at: string;
}

const UserManagementPage = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [passwordResetDialogOpen, setPasswordResetDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<UserProfile | null>(null);
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [dusun, setDusun] = useState('');
  const [role, setRole] = useState<'admin' | 'kadus'>('kadus');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [dusunOptions, setDusunOptions] = useState<string[]>([]);
  
  const queryClient = useQueryClient();

  // Fetch all user profiles
  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['user-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as UserProfile[];
    }
  });

  // Fetch dusun options
  React.useEffect(() => {
    const fetchDusunOptions = async () => {
      const { data, error } = await supabase
        .from('penduduk')
        .select('dusun')
        .not('dusun', 'is', null)
        .neq('dusun', '')
        .neq('dusun', 'Tidak Diketahui');
      
      if (data && !error) {
        const uniqueDusun = [...new Set(data.map(item => item.dusun))].sort();
        setDusunOptions(uniqueDusun);
      }
    };
    fetchDusunOptions();
  }, []);

  // Update user profile mutation
  const updateUserMutation = useMutation({
    mutationFn: async (userData: Partial<UserProfile>) => {
      const { error } = await supabase
        .from('profiles')
        .update(userData)
        .eq('id', editingUser?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
      toast.success('Profil user berhasil diperbarui');
      handleDialogClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal memperbarui profil user');
    }
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: { nama: string; email: string; password: string; role: 'admin' | 'kadus'; dusun?: string }) => {
      const { data, error } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          nama: userData.nama,
          role: userData.role,
          dusun: userData.role === 'kadus' ? userData.dusun : null
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
      toast.success('User berhasil dibuat');
      handleCreateDialogClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal membuat user');
    }
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (userData: { userId: string; newPassword: string }) => {
      const { error } = await supabase.auth.admin.updateUserById(userData.userId, {
        password: userData.newPassword
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Password berhasil direset');
      handlePasswordResetDialogClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal reset password');
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      // First delete from auth.users (this will cascade to profiles)
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
      toast.success('User berhasil dihapus');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal menghapus user');
    }
  });

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user);
    setNama(user.nama);
    setEmail(user.email || '');
    setDusun(user.dusun || '');
    setRole(user.role);
    setDialogOpen(true);
  };

  const handleDelete = async (user: UserProfile) => {
    if (confirm(`Apakah Anda yakin ingin menghapus user ${user.nama}?`)) {
      deleteUserMutation.mutate(user.user_id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingUser) return;

    updateUserMutation.mutate({
      nama,
      email: email || null,
      dusun: role === 'kadus' ? dusun : null,
      role,
      updated_at: new Date().toISOString()
    });
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (role === 'kadus' && !dusun) {
      toast.error('Silakan pilih dusun untuk role Kadus');
      return;
    }

    createUserMutation.mutate({
      nama,
      email,
      password,
      role,
      dusun: role === 'kadus' ? dusun : undefined
    });
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetPasswordUser) return;
    
    if (newPassword.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }

    resetPasswordMutation.mutate({
      userId: resetPasswordUser.user_id,
      newPassword
    });
  };

  const handlePasswordReset = (user: UserProfile) => {
    setResetPasswordUser(user);
    setNewPassword('');
    setPasswordResetDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingUser(null);
    setNama('');
    setEmail('');
    setDusun('');
    setRole('kadus');
  };

  const handleCreateDialogClose = () => {
    setCreateDialogOpen(false);
    setNama('');
    setEmail('');
    setPassword('');
    setDusun('');
    setRole('kadus');
  };

  const handlePasswordResetDialogClose = () => {
    setPasswordResetDialogOpen(false);
    setResetPasswordUser(null);
    setNewPassword('');
  };

  const columns = [
    { key: 'nama', label: 'Nama' },
    { key: 'email', label: 'Email' },
    { 
      key: 'role', 
      label: 'Role',
      type: 'custom' as const,
      render: (value: string) => (
        <Badge variant={value === 'admin' ? 'default' : 'secondary'}>
          {value === 'admin' ? 'Admin' : 'Kadus'}
        </Badge>
      )
    },
    { key: 'dusun', label: 'Dusun' },
    { 
      key: 'created_at', 
      label: 'Terdaftar',
      type: 'date' as const
    }
  ];

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Memuat data user...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gradient">Manajemen User</h1>
            <p className="text-muted-foreground mt-2">
              Kelola akun pengguna dan permissions
            </p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="button-elegant">
                <UserPlus className="w-4 h-4 mr-2" />
                Buat User Baru
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>

        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">Nama</th>
                  <th className="text-left p-4 font-medium">Email</th>
                  <th className="text-left p-4 font-medium">Role</th>
                  <th className="text-left p-4 font-medium">Dusun</th>
                  <th className="text-left p-4 font-medium">Terdaftar</th>
                  <th className="text-left p-4 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((user) => (
                  <tr key={user.id} className="border-t hover:bg-muted/50">
                    <td className="p-4">{user.nama}</td>
                    <td className="p-4">{user.email}</td>
                    <td className="p-4">
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role === 'admin' ? 'Admin' : 'Kadus'}
                      </Badge>
                    </td>
                    <td className="p-4">{user.dusun || '-'}</td>
                    <td className="p-4">{new Date(user.created_at).toLocaleDateString('id-ID')}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePasswordReset(user)}
                        >
                          <KeyRound className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(user)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Profil User</DialogTitle>
              <DialogDescription>
                Ubah informasi profil dan role user
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nama">Nama Lengkap</Label>
                <Input
                  id="edit-nama"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select value={role} onValueChange={(value: 'admin' | 'kadus') => setRole(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kadus">Kadus (Kepala Dusun)</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {role === 'kadus' && (
                <div className="space-y-2">
                  <Label htmlFor="edit-dusun">Dusun yang Dikelola</Label>
                  <Select value={dusun} onValueChange={setDusun}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih dusun" />
                    </SelectTrigger>
                    <SelectContent>
                      {dusunOptions.map((dusunName) => (
                        <SelectItem key={dusunName} value={dusunName}>
                          {dusunName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Batal
                </Button>
                <Button type="submit" disabled={updateUserMutation.isPending}>
                  {updateUserMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Create User Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Buat User Baru</DialogTitle>
              <DialogDescription>
                Buat akun user baru untuk sistem
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-nama">Nama Lengkap</Label>
                <Input
                  id="create-nama"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-email">Email</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-password">Password</Label>
                <Input
                  id="create-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Minimal 6 karakter"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-role">Role</Label>
                <Select value={role} onValueChange={(value: 'admin' | 'kadus') => setRole(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kadus">Kadus (Kepala Dusun)</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {role === 'kadus' && (
                <div className="space-y-2">
                  <Label htmlFor="create-dusun">Dusun yang Dikelola</Label>
                  <Select value={dusun} onValueChange={setDusun}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih dusun" />
                    </SelectTrigger>
                    <SelectContent>
                      {dusunOptions.map((dusunName) => (
                        <SelectItem key={dusunName} value={dusunName}>
                          {dusunName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleCreateDialogClose}>
                  Batal
                </Button>
                <Button type="submit" disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending ? 'Membuat...' : 'Buat User'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Password Reset Dialog */}
        <Dialog open={passwordResetDialogOpen} onOpenChange={setPasswordResetDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>
                Reset password untuk user {resetPasswordUser?.nama}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-password">Password Baru</Label>
                <Input
                  id="reset-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Minimal 6 karakter"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handlePasswordResetDialogClose}>
                  Batal
                </Button>
                <Button type="submit" disabled={resetPasswordMutation.isPending}>
                  {resetPasswordMutation.isPending ? 'Mereset...' : 'Reset Password'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default UserManagementPage;