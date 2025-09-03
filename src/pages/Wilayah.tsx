
import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Loader2, Users, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DataTable from '@/components/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import WilayahForm from '@/components/WilayahForm';

const Wilayah = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedWilayah, setSelectedWilayah] = useState(null);
  const { toast } = useToast();

  // Fetch wilayah data from Supabase
  const { data: wilayahData = [], isLoading, error, refetch } = useQuery({
    queryKey: ['wilayah'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wilayah')
        .select('*')
        .order('nama', { ascending: true });

      if (error) {
        console.error('Error fetching wilayah data:', error);
        toast({
          title: 'Gagal memuat data',
          description: 'Terjadi kesalahan saat memuat data wilayah',
          variant: 'destructive',
        });
        return [];
      }
      return data || [];
    }
  });

  const columns = [
    { key: 'kode', label: 'Kode' },
    { key: 'nama', label: 'Nama Dusun' },
    { key: 'kepala', label: 'Kepala Dusun' },
    { 
      key: 'jumlah_kk', 
      label: 'Jumlah KK',
      render: (value: number) => (
        <Badge variant="outline">
          {value || 0} KK
        </Badge>
      )
    },
    { 
      key: 'jumlah_penduduk', 
      label: 'Jumlah Penduduk',
      render: (value: number) => (
        <Badge variant="secondary">
          {value || 0} jiwa
        </Badge>
      )
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (value: string) => (
        <Badge variant={value === 'Aktif' ? 'default' : 'secondary'}>
          {value}
        </Badge>
      )
    },
  ];

  const filteredData = wilayahData.filter((item: any) =>
    item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.kode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.kepala && item.kepala.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleEdit = (item: any) => {
    setSelectedWilayah(item);
    setIsFormOpen(true);
  };

  const handleDelete = async (item: any) => {
    if (confirm('Apakah Anda yakin ingin menghapus data wilayah ini?')) {
      try {
        const { error } = await supabase
          .from('wilayah')
          .delete()
          .eq('id', item.id);

        if (error) throw error;

        toast({
          title: 'Berhasil',
          description: 'Data wilayah berhasil dihapus',
        });
        refetch();
      } catch (error) {
        console.error('Error deleting wilayah:', error);
        toast({
          title: 'Gagal',
          description: 'Terjadi kesalahan saat menghapus data wilayah',
          variant: 'destructive',
        });
      }
    }
  };

  const handleView = (item: any) => {
    console.log('View wilayah:', item);
    // TODO: Implementasi view detail
  };

  const handleAddNew = () => {
    setSelectedWilayah(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedWilayah(null);
    refetch();
  };

  // Calculate summary statistics
  const totalDusun = wilayahData?.filter((item: any) => item.jenis === 'Dusun').length || 0;
  const totalRW = wilayahData?.filter((item: any) => item.jenis === 'RW').length || 0;
  const totalRT = wilayahData?.filter((item: any) => item.jenis === 'RT').length || 0;
  const totalKK = wilayahData?.reduce((sum: number, item: any) => sum + (item.jumlah_kk || 0), 0) || 0;
  const totalPenduduk = wilayahData?.reduce((sum: number, item: any) => sum + (item.jumlah_penduduk || 0), 0) || 0;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Memuat data wilayah...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full max-w-full overflow-hidden">
      <div className="flex flex-col space-y-4 w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-foreground truncate">Data Wilayah</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Kelola data wilayah administratif desa - Total: {totalDusun} Dusun
            </p>
          </div>
          <Button onClick={handleAddNew} size="sm" className="flex items-center gap-2 text-xs">
            <Plus className="h-4 w-4" />
            <span>Tambah Wilayah</span>
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <MapPin className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="text-xl font-bold">{totalDusun}</p>
                  <p className="text-xs text-muted-foreground">Total Dusun</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <MapPin className="h-6 w-6 text-green-600" />
                <div>
                  <p className="text-xl font-bold">{totalRW}</p>
                  <p className="text-xs text-muted-foreground">Total RW</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <MapPin className="h-6 w-6 text-yellow-600" />
                <div>
                  <p className="text-xl font-bold">{totalRT}</p>
                  <p className="text-xs text-muted-foreground">Total RT</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Home className="h-6 w-6 text-red-600" />
                <div>
                  <p className="text-xl font-bold">{totalKK}</p>
                  <p className="text-xs text-muted-foreground">Total KK</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-6 w-6 text-purple-600" />
                <div>
                  <p className="text-xl font-bold">{totalPenduduk}</p>
                  <p className="text-xs text-muted-foreground">Total Penduduk</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="w-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm sm:text-base lg:text-lg">Pencarian Wilayah</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Input
                placeholder="Cari berdasarkan nama dusun, kode, atau kepala dusun..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-4 text-xs sm:text-sm"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm sm:text-base lg:text-lg">
              Daftar Wilayah ({filteredData.length} dari {wilayahData.length} wilayah)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 lg:p-6 w-full">
            {error ? (
              <div className="text-center py-8 text-red-500 text-xs sm:text-sm">
                Gagal memuat data wilayah. Silakan coba lagi nanti.
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={filteredData}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
                itemsPerPage={20}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-full md:max-w-3xl max-h-[90vh] overflow-y-auto mx-4">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">
              {selectedWilayah ? 'Edit Data Wilayah' : 'Tambah Data Wilayah'}
            </DialogTitle>
          </DialogHeader>
          <WilayahForm
            wilayah={selectedWilayah}
            onClose={handleFormClose}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Wilayah;
