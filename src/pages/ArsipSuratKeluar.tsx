import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DataTable from '@/components/DataTable';
import {
  Loader2, Plus, Archive, FileText, Search, CalendarDays, UserCheck, Mail, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import ArsipSuratKeluarForm from '@/components/ArsipSuratKeluarForm';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

type ArsipSurat = {
  id: number;
  no: number;
  nama_pemohon: string;
  no_surat: string;
  tanggal_surat: string;
  perihal: string;
  penanggung_jawab: string;
  tanggal_pengiriman: string;
};

const ArsipSuratKeluar = () => {
  const { hasPermission } = useAuth();
  const [data, setData] = useState<ArsipSurat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedArsip, setSelectedArsip] = useState<any | null>(null);
  const [perangkatList, setPerangkatList] = useState<any[]>([]);
  const [templateList, setTemplateList] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  const { data: infoDesa } = useQuery({
    queryKey: ['info-desa-arsip'],
    queryFn: async () => {
      const { data, error } = await supabase.from('info_desa').select('nama_kepala_desa').single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: arsipData, error: fetchError } = await supabase
        .from('arsip_surat_keluar')
        .select('*')
        .order('tanggal_surat', { ascending: false });

      if (fetchError) throw fetchError;

      const dataWithNo = arsipData.map((item, index) => ({ ...item, no: index + 1 }));
      setData(dataWithNo as ArsipSurat[]);
    } catch (err: any) {
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDropdownData = useCallback(async () => {
    try {
      const [perangkatRes, templateRes] = await Promise.all([
        supabase.from('perangkat_desa').select('nama, jabatan').eq('status', 'Aktif'),
        supabase.from('surat_template').select('nama_template'),
      ]);
      if (perangkatRes.error) throw perangkatRes.error;
      if (templateRes.error) throw templateRes.error;
      setPerangkatList(perangkatRes.data || []);
      setTemplateList(templateRes.data || []);
    } catch (err: any) {
      toast({ title: 'Gagal memuat data tambahan', description: err.message, variant: 'destructive' });
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
    fetchDropdownData();
  }, [fetchData, fetchDropdownData]);

  const handleAddNew = () => {
    if (!hasPermission('button:create:surat_keluar')) {
      toast({ title: 'Akses Ditolak', description: 'Anda tidak memiliki izin untuk menambah arsip surat keluar.', variant: 'destructive' });
      return;
    }
    setSelectedArsip(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item: any) => {
    if (!hasPermission('button:edit:surat_keluar')) {
      toast({ title: 'Akses Ditolak', description: 'Anda tidak memiliki izin untuk mengedit arsip.', variant: 'destructive' });
      return;
    }
    setSelectedArsip(item);
    setIsFormOpen(true);
  };

  const handleDelete = async (item: any) => {
    if (!hasPermission('button:delete:surat_keluar')) {
      toast({ title: 'Akses Ditolak', description: 'Anda tidak memiliki izin untuk menghapus arsip.', variant: 'destructive' });
      return;
    }
    if (window.confirm('Apakah Anda yakin ingin menghapus data arsip ini?')) {
      const { error: deleteError } = await supabase.from('arsip_surat_keluar').delete().eq('id', item.id);
      if (deleteError) {
        toast({ title: 'Gagal Menghapus', description: deleteError.message, variant: 'destructive' });
      } else {
        toast({ title: 'Berhasil', description: 'Data arsip telah dihapus.' });
        fetchData();
      }
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    fetchData();
  };

  // Filter by search
  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((item) =>
      item.nama_pemohon?.toLowerCase().includes(q) ||
      item.no_surat?.toLowerCase().includes(q) ||
      item.perihal?.toLowerCase().includes(q) ||
      item.penanggung_jawab?.toLowerCase().includes(q)
    );
  }, [data, search]);

  // Stats
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const bulanIni = data.filter((d) => {
      if (!d.tanggal_surat) return false;
      const dt = new Date(d.tanggal_surat);
      return dt.getMonth() === thisMonth && dt.getFullYear() === thisYear;
    }).length;
    const pemohonUnik = new Set(data.map((d) => d.nama_pemohon).filter(Boolean)).size;
    return { total: data.length, bulanIni, pemohonUnik };
  }, [data]);

  const columns = [
    {
      key: 'no',
      label: 'No',
      render: (value: number) => <span className="font-mono text-muted-foreground">{value}</span>,
    },
    {
      key: 'nama_pemohon',
      label: 'Nama Pemohon',
      render: (value: string) => (
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <UserCheck className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="font-medium truncate">{value || '-'}</span>
        </div>
      ),
    },
    {
      key: 'no_surat',
      label: 'No Surat',
      render: (value: string) => (
        <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted">{value || '-'}</span>
      ),
    },
    {
      key: 'tanggal_surat',
      label: 'Tgl. Surat',
      render: (value: string) =>
        value
          ? new Date(value).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })
          : '-',
    },
    {
      key: 'perihal',
      label: 'Perihal',
      render: (value: string) => (
        <div className="max-w-[200px] truncate" title={value}>
          {value || '-'}
        </div>
      ),
    },
    {
      key: 'penanggung_jawab',
      label: 'Penanggung Jawab',
      render: (value: string) => {
        if (value) return <span className="text-xs">{value}</span>;
        if (infoDesa?.nama_kepala_desa)
          return (
            <span className="text-xs">
              {infoDesa.nama_kepala_desa} <Badge variant="outline" className="ml-1 text-[10px]">Kepala Desa</Badge>
            </span>
          );
        return '-';
      },
    },
    {
      key: 'tanggal_pengiriman',
      label: 'Tgl. Pengiriman',
      render: (value: string) =>
        value
          ? new Date(value).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })
          : <Badge variant="outline" className="text-[10px]">Belum</Badge>,
    },
  ];

  const canEdit = hasPermission('button:edit:surat_keluar');
  const canDelete = hasPermission('button:delete:surat_keluar');

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <span className="text-sm text-muted-foreground">Memuat data arsip...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="p-6 text-destructive">Error: {error}</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 text-white p-6 md:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_55%)]" />
        <div className="absolute top-0 right-0 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-semibold uppercase tracking-wider mb-3">
              <Archive className="h-3.5 w-3.5" /> Arsip Digital
            </div>
            <h1 className="font-display font-bold text-2xl md:text-4xl leading-tight">Arsip Surat Keluar</h1>
            <p className="text-white/85 mt-2 text-sm md:text-base max-w-xl">
              Kelola seluruh arsip surat yang telah diterbitkan pemerintah desa.
            </p>
          </div>
          {hasPermission('button:create:surat_keluar') && (
            <Button onClick={handleAddNew} size="lg" className="rounded-full bg-white text-emerald-700 hover:bg-white/90 font-semibold h-11 px-6">
              <Plus className="mr-2 h-4 w-4" /> Tambah Arsip Manual
            </Button>
          )}
        </div>
      </section>

      {/* STATS */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Arsip', value: stats.total, icon: Archive, color: 'from-emerald-500 to-teal-600' },
          { label: 'Bulan Ini', value: stats.bulanIni, icon: CalendarDays, color: 'from-amber-500 to-orange-600' },
          { label: 'Pemohon Unik', value: stats.pemohonUnik, icon: UserCheck, color: 'from-fuchsia-500 to-pink-600' },
        ].map((s) => (
          <div
            key={s.label}
            className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 hover:border-primary/40 transition-all"
          >
            <div className={`absolute -top-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br ${s.color} opacity-10 blur-2xl`} />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{s.label}</p>
                <p className="font-display font-bold text-3xl mt-2 tracking-tight">{s.value.toLocaleString('id-ID')}</p>
              </div>
              <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${s.color} text-white flex items-center justify-center shadow-lg`}>
                <s.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* SEARCH */}
      <section>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari pemohon, nomor surat, perihal..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 rounded-xl"
            />
          </div>
          {search && (
            <Button variant="outline" onClick={() => setSearch('')} className="rounded-xl h-11">
              Bersihkan
            </Button>
          )}
        </div>
        {search && (
          <p className="mt-2 text-xs text-muted-foreground">
            Menampilkan <span className="font-semibold text-foreground">{filteredData.length}</span> hasil untuk "
            <span className="font-semibold text-foreground">{search}</span>"
          </p>
        )}
      </section>

      {/* TABLE */}
      <DataTable
        columns={columns}
        data={filteredData}
        onEdit={handleEdit}
        onDelete={handleDelete}
        canEdit={canEdit}
        canDelete={canDelete}
        itemsPerPage={20}
      />

      {/* FORM DIALOG */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              {selectedArsip ? 'Edit Arsip Surat' : 'Tambah Arsip Manual'}
            </DialogTitle>
          </DialogHeader>
          <ArsipSuratKeluarForm
            arsip={selectedArsip}
            perangkatList={perangkatList}
            templateList={templateList}
            onClose={handleFormClose}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ArsipSuratKeluar;
