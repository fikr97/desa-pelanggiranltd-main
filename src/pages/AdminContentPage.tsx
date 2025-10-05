import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Pencil, Trash2, Plus, FileText, Image, Users, Info, MapPin, Eye, Calendar, Megaphone } from 'lucide-react';
import DataTable from '@/components/DataTable';
import ContentForm from '@/components/ContentForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';

const AdminContentPage = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('konten');
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState<'konten' | 'berita' | 'galeri' | 'halaman'>('konten');
  const [editData, setEditData] = useState<any>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: any; type: string }>({ 
    open: false, 
    item: null, 
    type: '' 
  });
  const { hasPermission } = useAuth();

  // Fetch berita
  const { data: berita = [], isLoading: loadingBerita } = useQuery({
    queryKey: ['admin-berita'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('berita')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch galeri
  const { data: galeri = [], isLoading: loadingGaleri } = useQuery({
    queryKey: ['admin-galeri'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('galeri')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch halaman informasi
  const { data: halamanInfo = [], isLoading: loadingHalaman } = useQuery({
    queryKey: ['admin-halaman'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('halaman_informasi')
        .select('*')
        .order('urutan', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch konten website
  const { data: kontenWebsite = [], isLoading: loadingKonten } = useQuery({
    queryKey: ['admin-konten-website'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('konten_website')
        .select('*')
        .order('jenis', { ascending: true })
        .order('urutan', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  const beritaColumns = [
    { key: 'judul', label: 'Judul' },
    { key: 'slug', label: 'Slug' },
    { key: 'status', label: 'Status' },
    { key: 'tanggal_publikasi', label: 'Tanggal', type: 'date' as const },
  ];

  const galeriColumns = [
    { key: 'judul', label: 'Judul' },
    { key: 'tipe_media', label: 'Tipe' },
    { key: 'status', label: 'Status' },
    { key: 'created_at', label: 'Dibuat', type: 'date' as const },
  ];

  const halamanColumns = [
    { key: 'judul', label: 'Judul' },
    { key: 'slug', label: 'Slug' },
    { key: 'urutan', label: 'Urutan' },
    { key: 'status', label: 'Status' },
  ];

  const kontenColumns = [
    { key: 'judul', label: 'Judul' },
    { key: 'jenis', label: 'Jenis' },
    { key: 'status', label: 'Status' },
    { key: 'created_at', label: 'Dibuat', type: 'date' as const },
  ];

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ id, table }: { id: string; table: 'berita' | 'galeri' | 'halaman_informasi' | 'konten_website' }) => {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { table }) => {
      toast.success('Data berhasil dihapus');
      const queryKey = table === 'konten_website' ? 'admin-konten-website' : `admin-${table}`;
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      setDeleteDialog({ open: false, item: null, type: '' });
    },
    onError: (error) => {
      toast.error('Gagal menghapus data: ' + error.message);
    }
  });

  const handleAdd = (type: 'konten' | 'berita' | 'galeri' | 'halaman') => {
    setFormType(type);
    setEditData(null);
    setFormOpen(true);
  };

  const handleEdit = (item: any, type: string) => {
    setFormType(type as 'konten' | 'berita' | 'galeri' | 'halaman');
    setEditData(item);
    setFormOpen(true);
  };

  const handleDelete = (item: any, type: string) => {
    setDeleteDialog({ open: true, item, type });
  };

  const confirmDelete = () => {
    if (deleteDialog.item) {
      const table = deleteDialog.type === 'konten' ? 'konten_website' : 
                   deleteDialog.type === 'halaman' ? 'halaman_informasi' : 
                   deleteDialog.type as 'berita' | 'galeri';
      deleteMutation.mutate({ id: deleteDialog.item.id, table });
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gradient">Kelola Konten Website</h1>
            <p className="text-muted-foreground mt-2">
              Kelola konten yang ditampilkan di halaman depan website
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
            <TabsTrigger value="konten" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Konten Desa
            </TabsTrigger>
            <TabsTrigger value="berita" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Berita
            </TabsTrigger>
            <TabsTrigger value="galeri" className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              Galeri
            </TabsTrigger>
            <TabsTrigger value="halaman" className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              Halaman Info
            </TabsTrigger>
          </TabsList>

          <TabsContent value="konten" className="space-y-6">
            <Card className="card-elegant">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-gradient">Kelola Konten Desa</CardTitle>
                    <CardDescription>
                      Sejarah, visi misi, kondisi geografis, tupoksi, pengumuman, dan agenda desa
                    </CardDescription>
                  </div>
                  {hasPermission('button:create:konten_website') && (
                    <Button className="button-elegant" onClick={() => handleAdd('konten')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Konten
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={kontenWebsite}
                  columns={kontenColumns}
                  onEdit={hasPermission('button:edit:konten_website') ? (item) => handleEdit(item, 'konten') : undefined}
                  onDelete={hasPermission('button:delete:konten_website') ? (item) => handleDelete(item, 'konten') : undefined}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="berita" className="space-y-6">
            <Card className="card-elegant">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-gradient">Kelola Berita</CardTitle>
                    <CardDescription>
                      Berita dan artikel yang ditampilkan di halaman depan
                    </CardDescription>
                  </div>
                  {hasPermission('button:create:konten_website') && (
                    <Button className="button-elegant" onClick={() => handleAdd('berita')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Berita
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={berita}
                  columns={beritaColumns}
                  onEdit={hasPermission('button:edit:konten_website') ? (item) => handleEdit(item, 'berita') : undefined}
                  onDelete={hasPermission('button:delete:konten_website') ? (item) => handleDelete(item, 'berita') : undefined}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="galeri" className="space-y-6">
            <Card className="card-elegant">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-gradient">Kelola Galeri</CardTitle>
                    <CardDescription>
                      Foto dan video yang ditampilkan di galeri website
                    </CardDescription>
                  </div>
                  {hasPermission('button:create:konten_website') && (
                    <Button className="button-elegant" onClick={() => handleAdd('galeri')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Media
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={galeri}
                  columns={galeriColumns}
                  onEdit={hasPermission('button:edit:konten_website') ? (item) => handleEdit(item, 'galeri') : undefined}
                  onDelete={hasPermission('button:delete:konten_website') ? (item) => handleDelete(item, 'galeri') : undefined}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="halaman" className="space-y-6">
            <Card className="card-elegant">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-gradient">Kelola Halaman Informasi</CardTitle>
                    <CardDescription>
                      Halaman informasi statis yang ditampilkan di website
                    </CardDescription>
                  </div>
                  {hasPermission('button:create:konten_website') && (
                    <Button className="button-elegant" onClick={() => handleAdd('halaman')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Halaman
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={halamanInfo}
                  columns={halamanColumns}
                  onEdit={hasPermission('button:edit:konten_website') ? (item) => handleEdit(item, 'halaman') : undefined}
                  onDelete={hasPermission('button:delete:konten_website') ? (item) => handleDelete(item, 'halaman') : undefined}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Content Form Dialog */}
        <ContentForm
          open={formOpen}
          onOpenChange={setFormOpen}
          type={formType}
          editData={editData}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialog.open} onOpenChange={(open) => 
          setDeleteDialog({ ...deleteDialog, open })
        }>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus "{deleteDialog.item?.judul}"? 
                Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive hover:bg-destructive/90"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default AdminContentPage;