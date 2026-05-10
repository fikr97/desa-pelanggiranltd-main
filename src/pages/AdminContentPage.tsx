import React, { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Plus, FileText, Image, Info, Megaphone, Search, Globe, Sparkles, Layers, Camera, BookOpen
} from 'lucide-react';
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
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, string> = {
  published: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  draft: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  archived: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20',
};

const renderStatusBadge = (v: string) => {
  const status = (v || 'draft').toLowerCase();
  const style = STATUS_STYLES[status] || STATUS_STYLES.draft;
  return (
    <Badge variant="outline" className={cn('capitalize font-medium', style)}>
      {status}
    </Badge>
  );
};

const renderDate = (v: string) =>
  v ? new Date(v).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

type TabKey = 'konten' | 'berita' | 'galeri' | 'halaman';

const AdminContentPage = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>('konten');
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState<TabKey>('konten');
  const [editData, setEditData] = useState<any>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: any; type: string }>({
    open: false,
    item: null,
    type: '',
  });
  const [search, setSearch] = useState('');
  const { hasPermission } = useAuth();

  // Fetch queries
  const { data: berita = [], isLoading: loadingBerita } = useQuery({
    queryKey: ['admin-berita'],
    queryFn: async () => {
      const { data, error } = await supabase.from('berita').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: galeri = [], isLoading: loadingGaleri } = useQuery({
    queryKey: ['admin-galeri'],
    queryFn: async () => {
      const { data, error } = await supabase.from('galeri').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: halamanInfo = [], isLoading: loadingHalaman } = useQuery({
    queryKey: ['admin-halaman'],
    queryFn: async () => {
      const { data, error } = await supabase.from('halaman_informasi').select('*').order('urutan', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

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
    },
  });

  // Columns
  const beritaColumns = [
    { key: 'judul', label: 'Judul' },
    { key: 'slug', label: 'Slug', render: (v: string) => <span className="font-mono text-xs text-muted-foreground">{v}</span> },
    { key: 'status', label: 'Status', render: renderStatusBadge },
    { key: 'tanggal_publikasi', label: 'Tanggal', render: renderDate },
  ];

  const galeriColumns = [
    { key: 'judul', label: 'Judul' },
    {
      key: 'tipe_media',
      label: 'Tipe',
      render: (v: string) => (
        <Badge variant="secondary" className="capitalize text-[10px]">
          {v === 'video' ? <><Camera className="h-3 w-3 mr-1" /> Video</> : <><Image className="h-3 w-3 mr-1" /> Foto</>}
        </Badge>
      ),
    },
    { key: 'status', label: 'Status', render: renderStatusBadge },
    { key: 'created_at', label: 'Dibuat', render: renderDate },
  ];

  const halamanColumns = [
    { key: 'judul', label: 'Judul' },
    { key: 'slug', label: 'Slug', render: (v: string) => <span className="font-mono text-xs text-muted-foreground">{v}</span> },
    { key: 'urutan', label: 'Urutan', render: (v: number) => <Badge variant="outline" className="font-mono">{v ?? '-'}</Badge> },
    { key: 'status', label: 'Status', render: renderStatusBadge },
  ];

  const kontenColumns = [
    { key: 'judul', label: 'Judul' },
    {
      key: 'jenis',
      label: 'Jenis',
      render: (v: string) => (
        <Badge variant="outline" className="capitalize">{(v || '').replace(/_/g, ' ')}</Badge>
      ),
    },
    { key: 'status', label: 'Status', render: renderStatusBadge },
    { key: 'created_at', label: 'Dibuat', render: renderDate },
  ];

  // Filter
  const filter = (arr: any[]) => {
    if (!search.trim()) return arr;
    const q = search.toLowerCase();
    return arr.filter((i: any) =>
      i.judul?.toLowerCase().includes(q) ||
      i.slug?.toLowerCase().includes(q) ||
      i.jenis?.toLowerCase().includes(q)
    );
  };

  const filteredKonten = useMemo(() => filter(kontenWebsite), [kontenWebsite, search]);
  const filteredBerita = useMemo(() => filter(berita), [berita, search]);
  const filteredGaleri = useMemo(() => filter(galeri), [galeri, search]);
  const filteredHalaman = useMemo(() => filter(halamanInfo), [halamanInfo, search]);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ id, table }: { id: string; table: 'berita' | 'galeri' | 'halaman_informasi' | 'konten_website' }) => {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { table }) => {
      toast.success('Data berhasil dihapus');
      const queryKey =
        table === 'konten_website' ? 'admin-konten-website' :
        table === 'halaman_informasi' ? 'admin-halaman' :
        `admin-${table}`;
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      setDeleteDialog({ open: false, item: null, type: '' });
    },
    onError: (error: any) => {
      toast.error('Gagal menghapus data: ' + error.message);
    },
  });

  const handleAdd = (type: TabKey) => {
    setFormType(type);
    setEditData(null);
    setFormOpen(true);
  };

  const handleEdit = (item: any, type: TabKey) => {
    setFormType(type);
    setEditData(item);
    setFormOpen(true);
  };

  const handleDelete = (item: any, type: string) => {
    setDeleteDialog({ open: true, item, type });
  };

  const confirmDelete = () => {
    if (deleteDialog.item) {
      const table =
        deleteDialog.type === 'konten' ? 'konten_website' :
        deleteDialog.type === 'halaman' ? 'halaman_informasi' :
        (deleteDialog.type as 'berita' | 'galeri');
      deleteMutation.mutate({ id: deleteDialog.item.id, table });
    }
  };

  const tabs: Array<{ key: TabKey; label: string; icon: any; count: number; color: string; description: string }> = [
    {
      key: 'konten', label: 'Konten Desa', icon: Layers, count: kontenWebsite.length,
      color: 'from-blue-500 to-indigo-600',
      description: 'Sejarah, visi-misi, geografis, tupoksi, pengumuman, agenda.'
    },
    {
      key: 'berita', label: 'Berita', icon: Megaphone, count: berita.length,
      color: 'from-emerald-500 to-teal-600',
      description: 'Artikel & berita yang dipublikasikan di halaman depan.'
    },
    {
      key: 'galeri', label: 'Galeri', icon: Camera, count: galeri.length,
      color: 'from-rose-500 to-fuchsia-600',
      description: 'Foto & video kegiatan desa.'
    },
    {
      key: 'halaman', label: 'Halaman Info', icon: BookOpen, count: halamanInfo.length,
      color: 'from-amber-500 to-orange-600',
      description: 'Halaman informasi statis (tentang, kontak, FAQ, dsb).'
    },
  ];

  const currentTab = tabs.find((t) => t.key === activeTab)!;
  const CurrentIcon = currentTab.icon;

  return (
    <Layout>
      <div className="space-y-6">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary via-fuchsia-600 to-accent text-white p-6 md:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_55%)]" />
          <div className="absolute top-0 right-0 h-56 w-56 rounded-full bg-white/10 blur-3xl" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-semibold uppercase tracking-wider mb-3">
              <Globe className="h-3.5 w-3.5" /> CMS Website
            </div>
            <h1 className="font-display font-bold text-2xl md:text-4xl leading-tight">Kelola Konten Website</h1>
            <p className="text-white/85 mt-2 text-sm md:text-base max-w-2xl">
              Atur semua konten publik yang tampil di halaman depan website desa — dari berita, galeri, hingga halaman informasi.
            </p>
          </div>
        </section>

        {/* STAT TAB CARDS */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {tabs.map((t) => {
            const active = t.key === activeTab;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={cn(
                  'relative overflow-hidden rounded-2xl border p-4 text-left transition-all',
                  active
                    ? 'border-primary/60 bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border bg-card hover:border-primary/40 hover:-translate-y-0.5'
                )}
              >
                <div className={cn('absolute -top-8 -right-8 h-24 w-24 rounded-full blur-2xl opacity-20 bg-gradient-to-br', t.color)} />
                <div className="relative flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground truncate">{t.label}</p>
                    <p className="font-display font-bold text-2xl md:text-3xl mt-1">{t.count}</p>
                  </div>
                  <div className={cn('h-10 w-10 rounded-xl bg-gradient-to-br text-white flex items-center justify-center shadow flex-shrink-0', t.color)}>
                    <t.icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="relative mt-2 text-[11px] text-muted-foreground line-clamp-2">{t.description}</p>
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent" />
                )}
              </button>
            );
          })}
        </section>

        {/* MAIN CARD */}
        <Card className="rounded-2xl border-border/70 overflow-hidden">
          <CardHeader className="border-b border-border bg-muted/30 py-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn('h-11 w-11 rounded-xl bg-gradient-to-br text-white flex items-center justify-center shadow flex-shrink-0', currentTab.color)}>
                  <CurrentIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                    {currentTab.label}
                    <Badge variant="secondary" className="rounded-full text-[10px]">{currentTab.count} item</Badge>
                  </CardTitle>
                  <CardDescription className="mt-0.5">{currentTab.description}</CardDescription>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {hasPermission('button:create:konten_website') && (
                  <Button onClick={() => handleAdd(activeTab)} className="rounded-xl gap-2 btn-gradient">
                    <Plus className="h-4 w-4" /> Tambah
                  </Button>
                )}
              </div>
            </div>

            {/* Search */}
            <div className="mt-3 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Cari ${currentTab.label.toLowerCase()}... (judul, slug, jenis)`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 rounded-xl"
              />
            </div>
          </CardHeader>

          <CardContent className="p-4 md:p-6">
            {/* Tab Pill (secondary navigation for mobile) */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)} className="space-y-4">
              <TabsList className="grid w-full grid-cols-4 h-10 md:hidden">
                {tabs.map((t) => (
                  <TabsTrigger key={t.key} value={t.key} className="text-xs">
                    {t.label.split(' ')[0]}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="konten" className="mt-0">
                <DataTable
                  data={filteredKonten}
                  columns={kontenColumns}
                  onEdit={hasPermission('button:edit:konten_website') ? (item) => handleEdit(item, 'konten') : undefined}
                  onDelete={hasPermission('button:delete:konten_website') ? (item) => handleDelete(item, 'konten') : undefined}
                  itemsPerPage={20}
                />
              </TabsContent>
              <TabsContent value="berita" className="mt-0">
                <DataTable
                  data={filteredBerita}
                  columns={beritaColumns}
                  onEdit={hasPermission('button:edit:konten_website') ? (item) => handleEdit(item, 'berita') : undefined}
                  onDelete={hasPermission('button:delete:konten_website') ? (item) => handleDelete(item, 'berita') : undefined}
                  itemsPerPage={20}
                />
              </TabsContent>
              <TabsContent value="galeri" className="mt-0">
                <DataTable
                  data={filteredGaleri}
                  columns={galeriColumns}
                  onEdit={hasPermission('button:edit:konten_website') ? (item) => handleEdit(item, 'galeri') : undefined}
                  onDelete={hasPermission('button:delete:konten_website') ? (item) => handleDelete(item, 'galeri') : undefined}
                  itemsPerPage={20}
                />
              </TabsContent>
              <TabsContent value="halaman" className="mt-0">
                <DataTable
                  data={filteredHalaman}
                  columns={halamanColumns}
                  onEdit={hasPermission('button:edit:konten_website') ? (item) => handleEdit(item, 'halaman') : undefined}
                  onDelete={hasPermission('button:delete:konten_website') ? (item) => handleDelete(item, 'halaman') : undefined}
                  itemsPerPage={20}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Content Form Dialog */}
        <ContentForm open={formOpen} onOpenChange={setFormOpen} type={formType} editData={editData} />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus <b>"{deleteDialog.item?.judul}"</b>? Tindakan ini tidak dapat dibatalkan.
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
