import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DataTable from '@/components/DataTable';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ArsipSuratKeluarForm from '@/components/ArsipSuratKeluarForm';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

// Define the type for our data
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
  const { toast } = useToast();

  // Fetch info desa data (this is the primary source for kepala desa info)
  const { data: infoDesa } = useQuery({
    queryKey: ['info-desa-arsip'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('info_desa')
        .select('nama_kepala_desa')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
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
        supabase.from('surat_template').select('nama_template')
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
      toast({
        title: 'Akses Ditolak',
        description: 'Anda tidak memiliki izin untuk menambah arsip surat keluar.',
        variant: 'destructive',
      });
      return;
    }
    setSelectedArsip(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item: any) => {
    if (!hasPermission('button:edit:surat_keluar')) {
      toast({
        title: 'Akses Ditolak',
        description: 'Anda tidak memiliki izin untuk mengedit arsip surat keluar.',
        variant: 'destructive',
      });
      return;
    }
    setSelectedArsip(item);
    setIsFormOpen(true);
  };

  const handleDelete = async (item: any) => {
    if (!hasPermission('button:delete:surat_keluar')) {
      toast({
        title: 'Akses Ditolak',
        description: 'Anda tidak memiliki izin untuk menghapus arsip surat keluar.',
        variant: 'destructive',
      });
      return;
    }
    if (window.confirm('Apakah Anda yakin ingin menghapus data arsip ini?')) {
      const { error: deleteError } = await supabase
        .from('arsip_surat_keluar')
        .delete()
        .eq('id', item.id);

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

  const columns = [
    { key: 'no', label: 'No' },
    { key: 'nama_pemohon', label: 'Nama Pemohon' },
    { key: 'no_surat', label: 'No Surat' },
    { 
      key: 'tanggal_surat', 
      label: 'Tanggal Surat',
      render: (value: string) => value ? new Date(value).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'
    },
    { key: 'perihal', label: 'Perihal' },
    { 
      key: 'penanggung_jawab', 
      label: 'Penanggung Jawab',
      render: (value: string) => {
        // If value exists, show it as is
        if (value) return value;
        
        // If no value, show kepala desa from info desa
        if (infoDesa?.nama_kepala_desa) {
          return `${infoDesa.nama_kepala_desa} (Kepala Desa)`;
        }
        
        // Fallback
        return '-';
      }
    },
    { 
      key: 'tanggal_pengiriman', 
      label: 'Tgl. Pengiriman',
      render: (value: string) => value ? new Date(value).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'
    },
  ];

  const canEditArsip = hasPermission('button:edit:surat_keluar');
  const canDeleteArsip = hasPermission('button:delete:surat_keluar');

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-sm">Memuat data arsip...</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 p-4">Error: {error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gradient truncate">Arsip Surat Keluar</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2">Kelola arsip surat yang telah diterbitkan</p>
        </div>
        {hasPermission('button:create:surat_keluar') && (
          <Button onClick={handleAddNew} size="sm" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>Tambah Manual</span>
          </Button>
        )}
      </div>
      <DataTable
        columns={columns}
        data={data}
        onEdit={handleEdit}
        onDelete={handleDelete}
        canEdit={canEditArsip}
        canDelete={canDeleteArsip}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedArsip ? 'Edit Arsip' : 'Tambah Arsip Manual'}</DialogTitle>
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