import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { User, Settings, MapPin } from 'lucide-react';

const UserProfilePage = () => {
  const { profile, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [nama, setNama] = useState(profile?.nama || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [dusun, setDusun] = useState(profile?.dusun || '');
  const [dusunOptions, setDusunOptions] = useState<string[]>([]);
  
  const queryClient = useQueryClient();

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

  // Update profile when editing starts
  React.useEffect(() => {
    if (editing && profile) {
      setNama(profile.nama);
      setEmail(profile.email || '');
      setDusun(profile.dusun || '');
    }
  }, [editing, profile]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: { nama: string; email: string; dusun?: string }) => {
      if (!profile) throw new Error('No profile found');
      
      const { error } = await supabase
        .from('profiles')
        .update({
          nama: profileData.nama,
          email: profileData.email || null,
          dusun: profile.role === 'kadus' ? profileData.dusun : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      refreshProfile();
      toast.success('Profil berhasil diperbarui');
      setEditing(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal memperbarui profil');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({ nama, email, dusun });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role: string) => {
    return role === 'admin' ? 'default' : 'secondary';
  };

  const getRoleLabel = (role: string) => {
    return role === 'admin' ? 'Administrator' : 'Kepala Dusun';
  };

  if (!profile) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Memuat profil...</p>
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
            <h1 className="text-3xl font-bold text-gradient">Profil Pengguna</h1>
            <p className="text-muted-foreground mt-2">
              Kelola informasi profil Anda
            </p>
          </div>
          {!editing && (
            <Button onClick={() => setEditing(true)} className="button-elegant">
              <Settings className="w-4 h-4 mr-2" />
              Edit Profil
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Overview */}
          <Card className="lg:col-span-1">
            <CardHeader className="text-center">
              <Avatar className="w-24 h-24 mx-auto mb-4">
                <AvatarImage src={profile.avatar_url || ''} />
                <AvatarFallback className="text-lg bg-gradient-primary text-white">
                  {getInitials(profile.nama)}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-xl">{profile.nama}</CardTitle>
              <CardDescription className="space-y-2">
                <Badge variant={getRoleColor(profile.role)} className="mb-2">
                  {getRoleLabel(profile.role)}
                </Badge>
                {profile.dusun && (
                  <div className="flex items-center justify-center gap-1 text-sm">
                    <MapPin className="w-4 h-4" />
                    {profile.dusun}
                  </div>
                )}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Profile Details */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Informasi Profil
              </CardTitle>
              <CardDescription>
                {editing ? 'Edit informasi profil Anda' : 'Detail informasi profil Anda'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {editing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nama">Nama Lengkap</Label>
                    <Input
                      id="nama"
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input
                      id="role"
                      value={getRoleLabel(profile.role)}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Role tidak dapat diubah. Hubungi administrator jika perlu perubahan.
                    </p>
                  </div>

                  {profile.role === 'kadus' && (
                    <div className="space-y-2">
                      <Label htmlFor="dusun">Dusun yang Dikelola</Label>
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
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setEditing(false)}
                    >
                      Batal
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={updateProfileMutation.isPending}
                      className="button-elegant"
                    >
                      {updateProfileMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">
                        NAMA LENGKAP
                      </Label>
                      <p className="mt-1 font-medium">{profile.nama}</p>
                    </div>
                    
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">
                        EMAIL
                      </Label>
                      <p className="mt-1 font-medium">{profile.email || '-'}</p>
                    </div>
                    
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">
                        ROLE
                      </Label>
                      <p className="mt-1 font-medium">{getRoleLabel(profile.role)}</p>
                    </div>
                    
                    {profile.role === 'kadus' && (
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">
                          DUSUN YANG DIKELOLA
                        </Label>
                        <p className="mt-1 font-medium">{profile.dusun || '-'}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">
                          TERDAFTAR
                        </Label>
                        <p className="mt-1">
                          {new Date(profile.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">
                          TERAKHIR DIPERBARUI
                        </Label>
                        <p className="mt-1">
                          {new Date(profile.updated_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default UserProfilePage;