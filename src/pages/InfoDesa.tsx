import React, { useState, useEffect } from 'react';
import { Building2, MapPin, Phone, Mail, Globe, User, Edit, Save, X, Users, Plus, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import PerangkatDesaForm from '@/components/PerangkatDesaForm';
import OrganizationalChart from '@/components/OrganizationalChart';

interface PerangkatDesa {
  id: string;
  nama: string;
  jabatan: string;
  nip?: string;
  foto?: string;
  bertanggung_jawab_kepada?: string;
  urutan_display?: number;
}

const InfoDesa = () => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch info desa data
  const { data: infoDesaData, isLoading: isLoadingData, refetch } = useQuery({
    queryKey: ['info-desa'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('info_desa')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching info desa:', error);
        toast({
          title: 'Gagal memuat data',
          description: 'Terjadi kesalahan saat memuat data info desa',
          variant: 'destructive',
        });
        return null;
      }
      return data;
    }
  });

  // Set preview URL when infoDesaData changes
  useEffect(() => {
    if (infoDesaData?.logo_desa) {
      setPreviewUrl(infoDesaData.logo_desa);
    }
  }, [infoDesaData]);

  // Fetch perangkat desa data
  const { data: perangkatDesaData, isLoading: isLoadingPerangkat, refetch: refetchPerangkat } = useQuery({
    queryKey: ['perangkat-desa'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('perangkat_desa')
        .select('*')
        .eq('status', 'Aktif')
        .order('urutan_display', { ascending: true });

      if (error) {
        console.error('Error fetching perangkat desa:', error);
        toast({
          title: 'Gagal memuat data perangkat desa',
          description: 'Terjadi kesalahan saat memuat data perangkat desa',
          variant: 'destructive',
        });
        return [];
      }
      // Ensure urutan_display always exists
      const fixedData = (data ?? []).map((d: any) => ({
        ...d,
        urutan_display: d.urutan_display ?? 0,
      }));
      return fixedData as PerangkatDesa[];
    }
  });

  // Type guard: make sure perangkatDesaData is always an array
  const perangkatDesa: PerangkatDesa[] = Array.isArray(perangkatDesaData) ? perangkatDesaData : [];

  // Get Kepala Desa from perangkat desa
  const kepalaDesa = perangkatDesa.find(
    p =>
      typeof p.jabatan === 'string' &&
      (p.jabatan.toLowerCase().includes('kepala desa') || p.jabatan.toLowerCase().includes('lurah'))
  );

  const handleEdit = () => {
    setEditData(infoDesaData || {});
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditData({});
    setIsEditing(false);
    setSelectedFile(null);
    setPreviewUrl(infoDesaData?.logo_desa || null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      let logoUrl = editData.logo_desa;

      // Upload logo if selected
      if (selectedFile) {
        const filePath = `public/${Date.now()}-${selectedFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('logo-desa')
          .upload(filePath, selectedFile, { upsert: true });
        
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('logo-desa').getPublicUrl(filePath);
        logoUrl = urlData.publicUrl;
      }

      const dataToSave = {
        ...editData,
        logo_desa: logoUrl,
        updated_at: new Date().toISOString()
      };

      if (infoDesaData) {
        // Update existing data
        const { error } = await supabase
          .from('info_desa')
          .update(dataToSave)
          .eq('id', infoDesaData.id);

        if (error) throw error;
      } else {
        // Insert new data
        const { error } = await supabase
          .from('info_desa')
          .insert([dataToSave]);

        if (error) throw error;
      }

      toast({
        title: 'Data berhasil disimpan',
        description: 'Informasi desa telah diperbarui',
      });

      setIsEditing(false);
      setSelectedFile(null);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['info-desa-logo'] });
      queryClient.invalidateQueries({ queryKey: ['info-desa-header'] });
    } catch (error) {
      console.error('Error saving info desa:', error);
      toast({
        title: 'Gagal menyimpan data',
        description: 'Terjadi kesalahan saat menyimpan data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEditData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSavePerangkat = async (data: Partial<PerangkatDesa>, id?: string) => {
    // Ensure required fields are present
    if (!data.nama || !data.jabatan) {
      toast({
        title: 'Data tidak lengkap',
        description: 'Nama dan jabatan harus diisi',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (id) {
        // Update existing
        const { error } = await supabase
          .from('perangkat_desa')
          .update({
            nama: data.nama,
            jabatan: data.jabatan,
            nip: data.nip || null,
            bertanggung_jawab_kepada: data.bertanggung_jawab_kepada || null,
            urutan_display: data.urutan_display || 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);

        if (error) throw error;
      } else {
        // Get next urutan for new perangkat
        const { data: maxUrutan } = await supabase
          .from('perangkat_desa')
          .select('urutan_display')
          .order('urutan_display', { ascending: false })
          .limit(1);

        const nextUrutan = (maxUrutan?.[0]?.urutan_display || 0) + 1;

        // Insert new
        const { error } = await supabase
          .from('perangkat_desa')
          .insert([{
            nama: data.nama,
            jabatan: data.jabatan,
            nip: data.nip || null,
            bertanggung_jawab_kepada: data.bertanggung_jawab_kepada || null,
            urutan_display: data.urutan_display || nextUrutan,
            status: 'Aktif'
          }]);

        if (error) throw error;
      }
      
      refetchPerangkat();
      toast({
        title: 'Data berhasil disimpan',
        description: 'Data perangkat desa telah diperbarui',
      });
    } catch (error) {
      console.error('Error saving perangkat desa:', error);
      toast({
        title: 'Gagal menyimpan data',
        description: 'Terjadi kesalahan saat menyimpan data',
        variant: 'destructive',
      });
    }
  };

  const handleDeletePerangkat = async (id: string) => {
    try {
      const { error } = await supabase
        .from('perangkat_desa')
        .update({ status: 'Tidak Aktif' })
        .eq('id', id);

      if (error) throw error;
      refetchPerangkat();
      toast({
        title: 'Data berhasil dihapus',
        description: 'Data perangkat desa telah dihapus',
      });
    } catch (error) {
      console.error('Error deleting perangkat desa:', error);
      toast({
        title: 'Gagal menghapus data',
        description: 'Terjadi kesalahan saat menghapus data',
        variant: 'destructive',
      });
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Memuat data info desa...</span>
      </div>
    );
  }

  const displayData = isEditing ? editData : infoDesaData;

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient">Informasi Desa</h1>
          <p className="text-muted-foreground mt-2">Data dan informasi desa</p>
        </div>
        {!isEditing ? (
          <Button onClick={handleEdit} className="flex items-center space-x-2">
            <Edit className="h-4 w-4" />
            <span>Edit Info</span>
          </Button>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleSave} disabled={isLoading} className="flex items-center space-x-2">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>Simpan</span>
            </Button>
            <Button onClick={handleCancel} variant="outline" className="flex items-center space-x-2">
              <X className="h-4 w-4" />
              <span>Batal</span>
            </Button>
          </div>
        )}
      </div>

      {/* Logo Desa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Logo Desa</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-24 h-24 rounded-lg border border-dashed flex items-center justify-center bg-muted/40">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="h-full w-full object-contain rounded-lg"/>
                  ) : (
                    <Building2 className="h-10 w-10 text-muted-foreground"/>
                  )}
                </div>
                <div>
                  <Input id="logo-upload" type="file" accept="image/*" onChange={handleFileChange} className="max-w-xs"/>
                  <p className="text-sm text-muted-foreground mt-2">Unggah file gambar (PNG, JPG, SVG) maks 2MB.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <div className="w-24 h-24 rounded-lg border flex items-center justify-center bg-muted/40">
                {displayData?.logo_desa ? (
                  <img src={displayData.logo_desa} alt="Logo Desa" className="h-full w-full object-contain rounded-lg"/>
                ) : (
                  <Building2 className="h-10 w-10 text-muted-foreground"/>
                )}
              </div>
              <div>
                <p className="font-medium">Logo Desa</p>
                <p className="text-sm text-muted-foreground">Logo resmi desa</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informasi Umum */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Informasi Umum</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="nama_desa">Nama Desa</Label>
            {isEditing ? (
              <Input
                id="nama_desa"
                value={displayData?.nama_desa || ''}
                onChange={(e) => handleInputChange('nama_desa', e.target.value)}
                placeholder="Nama desa"
              />
            ) : (
              <p className="text-lg font-semibold">{displayData?.nama_desa || '-'}</p>
            )}
          </div>
          <div>
            <Label htmlFor="kode_desa">Kode Desa</Label>
            {isEditing ? (
              <Input
                id="kode_desa"
                value={displayData?.kode_desa || ''}
                onChange={(e) => handleInputChange('kode_desa', e.target.value)}
                placeholder="Kode desa"
              />
            ) : (
              <p className="text-muted-foreground">{displayData?.kode_desa || '-'}</p>
            )}
          </div>
          <div>
            <Label htmlFor="nama_kecamatan">Kecamatan</Label>
            {isEditing ? (
              <Input
                id="nama_kecamatan"
                value={displayData?.nama_kecamatan || ''}
                onChange={(e) => handleInputChange('nama_kecamatan', e.target.value)}
                placeholder="Nama kecamatan"
              />
            ) : (
              <p className="text-muted-foreground">{displayData?.nama_kecamatan || '-'}</p>
            )}
          </div>
          <div>
            <Label htmlFor="nama_kabupaten">Kabupaten</Label>
            {isEditing ? (
              <Input
                id="nama_kabupaten"
                value={displayData?.nama_kabupaten || ''}
                onChange={(e) => handleInputChange('nama_kabupaten', e.target.value)}
                placeholder="Nama kabupaten"
              />
            ) : (
              <p className="text-muted-foreground">{displayData?.nama_kabupaten || '-'}</p>
            )}
          </div>
          <div>
            <Label htmlFor="nama_provinsi">Provinsi</Label>
            {isEditing ? (
              <Input
                id="nama_provinsi"
                value={displayData?.nama_provinsi || ''}
                onChange={(e) => handleInputChange('nama_provinsi', e.target.value)}
                placeholder="Nama provinsi"
              />
            ) : (
              <p className="text-muted-foreground">{displayData?.nama_provinsi || '-'}</p>
            )}
          </div>
          <div>
            <Label htmlFor="kode_pos">Kode Pos</Label>
            {isEditing ? (
              <Input
                id="kode_pos"
                value={displayData?.kode_pos || ''}
                onChange={(e) => handleInputChange('kode_pos', e.target.value)}
                placeholder="Kode pos"
              />
            ) : (
              <p className="text-muted-foreground">{displayData?.kode_pos || '-'}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Kontak & Alamat */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Kontak & Alamat</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="alamat_kantor">Alamat Kantor</Label>
            {isEditing ? (
              <Textarea
                id="alamat_kantor"
                value={displayData?.alamat_kantor || ''}
                onChange={(e) => handleInputChange('alamat_kantor', e.target.value)}
                placeholder="Alamat lengkap kantor desa"
                rows={3}
              />
            ) : (
              <p className="text-muted-foreground">{displayData?.alamat_kantor || '-'}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <Label htmlFor="telepon">Telepon</Label>
              {isEditing ? (
                <Input
                  id="telepon"
                  value={displayData?.telepon || ''}
                  onChange={(e) => handleInputChange('telepon', e.target.value)}
                  placeholder="Nomor telepon"
                />
              ) : (
                <p className="text-muted-foreground">{displayData?.telepon || '-'}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <Label htmlFor="email">Email</Label>
              {isEditing ? (
                <Input
                  id="email"
                  type="email"
                  value={displayData?.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Alamat email"
                />
              ) : (
                <p className="text-muted-foreground">{displayData?.email || '-'}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <Label htmlFor="website">Website</Label>
              {isEditing ? (
                <Input
                  id="website"
                  value={displayData?.website || ''}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="Website desa"
                />
              ) : (
                <p className="text-muted-foreground">{displayData?.website || '-'}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kepala Desa - Integrated with Perangkat Desa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Kepala Desa</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {kepalaDesa ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nama Kepala Desa</Label>
                <p className="text-lg font-semibold">{kepalaDesa.nama}</p>
              </div>
              <div>
                <Label>NIP Kepala Desa</Label>
                <p className="text-muted-foreground">{kepalaDesa.nip || '-'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">
                  Data kepala desa diambil dari Struktur Organisasi Perangkat Desa. 
                  Untuk mengubah data kepala desa, silakan edit pada bagian Struktur Organisasi di bawah.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Belum ada data kepala desa.</p>
              <p className="text-sm">Tambahkan kepala desa pada Struktur Organisasi Perangkat Desa di bawah.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Struktur Organisasi Perangkat Desa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Struktur Organisasi Perangkat Desa</span>
            </div>
            <PerangkatDesaForm 
              perangkatList={perangkatDesa}
              onSave={(data) => handleSavePerangkat(data)}
              trigger={
                <Button size="sm" className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Tambah</span>
                </Button>
              }
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {isLoadingPerangkat ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2">Memuat data perangkat desa...</span>
              </div>
            ) : (
              <OrganizationalChart 
                perangkatDesa={perangkatDesa}
                onSave={handleSavePerangkat}
                onDelete={handleDeletePerangkat}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InfoDesa;
