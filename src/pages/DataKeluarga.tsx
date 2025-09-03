
import React, { useState, useMemo } from 'react';
import { Search, Users, Eye, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import DataTable from '@/components/DataTable';

interface PendudukData {
  id: string;
  no_kk: string;
  nik: string;
  nama: string;
  jenis_kelamin: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  agama: string;
  status_kawin: string;
  status_hubungan: string;
  pendidikan: string;
  pekerjaan: string;
  dusun: string;
  rt: string;
  rw: string;
  alamat_lengkap: string;
}

interface KeluargaData {
  no_kk: string;
  kepala_keluarga: PendudukData;
  anggota: PendudukData[];
  jumlah_anggota: number;
  alamat: string;
  dusun: string;
  rt: string;
  rw: string;
}

const DataKeluarga = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKeluarga, setSelectedKeluarga] = useState<KeluargaData | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { toast } = useToast();

  // Fetch penduduk data
  const { data: pendudukData = [], isLoading, error } = useQuery({
    queryKey: ['penduduk-keluarga'],
    queryFn: async () => {
      console.log('Fetching penduduk data for keluarga...');
      
      // Use multiple queries if needed to get all data
      let allData: any[] = [];
      let from = 0;
      const limit = 1000; // Supabase default limit per query
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('penduduk')
          .select('*')
          .range(from, from + limit - 1)
          .order('no_kk', { ascending: true });

        if (error) {
          console.error('Error fetching penduduk data:', error);
          toast({
            title: 'Gagal memuat data',
            description: 'Terjadi kesalahan saat memuat data penduduk',
            variant: 'destructive',
          });
          throw error;
        }

        if (data) {
          allData = [...allData, ...data];
          console.log(`Fetched ${data.length} records, total so far: ${allData.length}`);
          
          // If we got less than the limit, we've reached the end
          if (data.length < limit) {
            hasMore = false;
          } else {
            from += limit;
          }
        } else {
          hasMore = false;
        }
      }

      console.log(`Total fetched: ${allData.length} records from database`);
      return allData as PendudukData[];
    }
  });

  // Process data menjadi struktur keluarga
  const keluargaData = useMemo(() => {
    const keluargaMap = new Map<string, KeluargaData>();

    pendudukData.forEach((penduduk) => {
      // Skip jika no_kk kosong atau null
      if (!penduduk.no_kk || penduduk.no_kk.trim() === '') return;

      const no_kk = penduduk.no_kk.trim();

      if (!keluargaMap.has(no_kk)) {
        // Inisialisasi keluarga baru
        keluargaMap.set(no_kk, {
          no_kk: no_kk,
          kepala_keluarga: penduduk, // temporary, akan diganti jika ada kepala keluarga
          anggota: [],
          jumlah_anggota: 0,
          alamat: penduduk.alamat_lengkap || '',
          dusun: penduduk.dusun || '',
          rt: penduduk.rt || '',
          rw: penduduk.rw || ''
        });
      }

      const keluarga = keluargaMap.get(no_kk)!;
      
      // Tentukan kepala keluarga berdasarkan status_hubungan
      if (penduduk.status_hubungan) {
        const statusLower = penduduk.status_hubungan.toLowerCase();
        if (statusLower.includes('kepala') || statusLower.includes('kk') || statusLower === 'kepala keluarga') {
          keluarga.kepala_keluarga = penduduk;
        }
      }
      
      // Tambahkan sebagai anggota keluarga
      keluarga.anggota.push(penduduk);
      keluarga.jumlah_anggota = keluarga.anggota.length;

      // Update alamat, dusun, rt, rw jika masih kosong
      if (!keluarga.alamat && penduduk.alamat_lengkap) {
        keluarga.alamat = penduduk.alamat_lengkap;
      }
      if (!keluarga.dusun && penduduk.dusun) {
        keluarga.dusun = penduduk.dusun;
      }
      if (!keluarga.rt && penduduk.rt) {
        keluarga.rt = penduduk.rt;
      }
      if (!keluarga.rw && penduduk.rw) {
        keluarga.rw = penduduk.rw;
      }
    });

    const result = Array.from(keluargaMap.values()).sort((a, b) => a.no_kk.localeCompare(b.no_kk));
    console.log(`Total keluarga processed: ${result.length} dari ${pendudukData.length} penduduk`);
    return result;
  }, [pendudukData]);

  // Filter data berdasarkan pencarian
  const filteredKeluarga = useMemo(() => {
    if (!searchTerm) return keluargaData;

    return keluargaData.filter(keluarga => 
      keluarga.no_kk.includes(searchTerm) ||
      keluarga.kepala_keluarga.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      keluarga.dusun.toLowerCase().includes(searchTerm.toLowerCase()) ||
      keluarga.alamat.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [keluargaData, searchTerm]);

  const handleViewDetail = (keluarga: KeluargaData) => {
    setSelectedKeluarga(keluarga);
    setIsDetailOpen(true);
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return '-';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Define columns for DataTable
  const columns = [
    {
      key: 'no_kk',
      label: 'No. KK',
      render: (value: string) => <span className="font-mono">{value}</span>
    },
    {
      key: 'kepala_keluarga_nama',
      label: 'Kepala Keluarga',
      render: (value: string, item: KeluargaData) => (
        <div className="flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-primary" />
          <span className="font-medium">{item.kepala_keluarga.nama}</span>
        </div>
      )
    },
    {
      key: 'alamat',
      label: 'Alamat',
      render: (value: string) => (
        <div className="max-w-[200px] truncate" title={value}>
          {value || '-'}
        </div>
      )
    },
    {
      key: 'dusun',
      label: 'Dusun'
    },
    {
      key: 'rt_rw',
      label: 'RT/RW',
      render: (value: string, item: KeluargaData) => 
        item.rt && item.rw ? `${item.rt}/${item.rw}` : '-'
    },
    {
      key: 'jumlah_anggota',
      label: 'Jumlah Anggota',
      render: (value: number) => (
        <Badge variant="secondary">
          {value} orang
        </Badge>
      )
    }
  ];

  // Transform data for DataTable
  const tableData = filteredKeluarga.map(keluarga => ({
    ...keluarga,
    id: keluarga.no_kk, // Use no_kk as id for DataTable
    kepala_keluarga_nama: keluarga.kepala_keluarga.nama,
    rt_rw: keluarga.rt && keluarga.rw ? `${keluarga.rt}/${keluarga.rw}` : '-'
  }));

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Users className="h-8 w-8 animate-pulse text-primary mx-auto mb-2" />
          <span className="text-sm">Memuat data keluarga...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full max-w-full overflow-hidden">
      <div className="flex flex-col space-y-4 w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-foreground truncate">Data Keluarga</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Kelola data keluarga berdasarkan Nomor KK - Total: {keluargaData.length} Keluarga
            </p>
          </div>
        </div>

        <Card className="w-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm sm:text-base lg:text-lg">Pencarian Keluarga</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari No. KK, nama kepala keluarga, dusun, atau alamat..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-xs sm:text-sm w-full"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm sm:text-base lg:text-lg">
              Daftar Keluarga ({filteredKeluarga.length} dari {keluargaData.length} keluarga)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 lg:p-6 w-full">
            {error ? (
              <div className="text-center py-8 text-red-500 text-xs sm:text-sm">
                Gagal memuat data keluarga. Silakan coba lagi nanti.
              </div>
            ) : (
              <DataTable 
                columns={columns}
                data={tableData}
                onView={handleViewDetail}
                itemsPerPage={20}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Anggota Keluarga Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-full md:max-w-6xl max-h-[90vh] overflow-y-auto mx-4">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">
              Detail Anggota Keluarga - {selectedKeluarga?.no_kk}
            </DialogTitle>
          </DialogHeader>
          
          {selectedKeluarga && (
            <div className="space-y-4">
              {/* Info Keluarga */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm md:text-base">Informasi Keluarga</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">No. KK:</span> {selectedKeluarga.no_kk}
                  </div>
                  <div>
                    <span className="font-medium">Kepala Keluarga:</span> {selectedKeluarga.kepala_keluarga.nama}
                  </div>
                  <div>
                    <span className="font-medium">Alamat:</span> {selectedKeluarga.alamat || '-'}
                  </div>
                  <div>
                    <span className="font-medium">Dusun:</span> {selectedKeluarga.dusun || '-'}
                  </div>
                  <div>
                    <span className="font-medium">RT/RW:</span> {selectedKeluarga.rt && selectedKeluarga.rw ? `${selectedKeluarga.rt}/${selectedKeluarga.rw}` : '-'}
                  </div>
                  <div>
                    <span className="font-medium">Jumlah Anggota:</span> {selectedKeluarga.jumlah_anggota} orang
                  </div>
                </CardContent>
              </Card>

              {/* Daftar Anggota */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm md:text-base">Daftar Anggota Keluarga</CardTitle>
                </CardHeader>
                <CardContent className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs md:text-sm">NIK</TableHead>
                        <TableHead className="text-xs md:text-sm">Nama</TableHead>
                        <TableHead className="text-xs md:text-sm">L/P</TableHead>
                        <TableHead className="text-xs md:text-sm">Umur</TableHead>
                        <TableHead className="text-xs md:text-sm">Status Hubungan</TableHead>
                        <TableHead className="text-xs md:text-sm">Status Kawin</TableHead>
                        <TableHead className="text-xs md:text-sm">Pendidikan</TableHead>
                        <TableHead className="text-xs md:text-sm">Pekerjaan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedKeluarga.anggota.map((anggota, index) => (
                        <TableRow key={anggota.id || index}>
                          <TableCell className="text-xs md:text-sm font-mono">
                            {anggota.nik}
                          </TableCell>
                          <TableCell className="text-xs md:text-sm">
                            <div className="flex items-center gap-2">
                              {anggota.status_hubungan?.toLowerCase().includes('kepala') && (
                                <UserCheck className="h-3 w-3 text-primary" />
                              )}
                              <span className={anggota.status_hubungan?.toLowerCase().includes('kepala') ? 'font-medium' : ''}>
                                {anggota.nama}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs md:text-sm">
                            {anggota.jenis_kelamin === 'Laki-laki' ? 'L' : anggota.jenis_kelamin === 'Perempuan' ? 'P' : '-'}
                          </TableCell>
                          <TableCell className="text-xs md:text-sm">
                            {calculateAge(anggota.tanggal_lahir)} tahun
                          </TableCell>
                          <TableCell className="text-xs md:text-sm">
                            <Badge variant={anggota.status_hubungan?.toLowerCase().includes('kepala') ? 'default' : 'secondary'}>
                              {anggota.status_hubungan || '-'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs md:text-sm">
                            {anggota.status_kawin || '-'}
                          </TableCell>
                          <TableCell className="text-xs md:text-sm">
                            {anggota.pendidikan || '-'}
                          </TableCell>
                          <TableCell className="text-xs md:text-sm">
                            {anggota.pekerjaan || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DataKeluarga;
