import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, Upload, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DataTable from '@/components/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import PendudukForm from '@/components/PendudukForm';
import ImportExcelDialog from '@/components/ImportExcelDialog';
import AdvancedFilter from '@/components/AdvancedFilter';
import DownloadTemplateButton from '@/components/DownloadTemplateButton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useAuth } from '@/contexts/AuthContext';

interface FilterValues {
  jenis_kelamin?: string;
  agama?: string;
  status_kawin?: string;
  pendidikan?: string;
  pekerjaan?: string;
  golongan_darah?: string;
  status_hubungan?: string;
  dusun?: string;
  rt?: string;
  rw?: string;
  umur_min?: string;
  umur_max?: string;
}

const Penduduk = () => {
  const { hasPermission } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedPenduduk, setSelectedPenduduk] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<FilterValues>({});
  const { toast } = useToast();

  // Fetch penduduk data from Supabase respecting RLS policies
  const { data: pendudukData = [], isLoading, error, refetch } = useQuery({
    queryKey: ['penduduk'],
    queryFn: async () => {
      console.log('Fetching penduduk data accessible to current user...');
      
      // This query will be restricted by RLS policies
      // Kadus will only see residents from their own dusun
      let allData: any[] = [];
      let from = 0;
      const limit = 1000; // Supabase default limit per query
      let hasMore = true;

      while (hasMore) {
        const { data, error, count } = await supabase
          .from('penduduk')
          .select('*', { count: 'exact' })
          .range(from, from + limit - 1)
          .order('nama', { ascending: true });

        if (error) {
          console.error('Error fetching penduduk data:', error);
          // Check if it's an RLS violation
          if (error.message.includes('permission denied') || error.code === '42501') {
            toast({
              title: 'Akses Ditolak',
              description: 'Anda hanya dapat mengakses data penduduk dari dusun Anda sendiri.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Gagal memuat data',
              description: 'Terjadi kesalahan saat memuat data penduduk',
              variant: 'destructive',
            });
          }
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

      console.log(`Total fetched: ${allData.length} records accessible to user`);
      
      // Log user's role and dusun to verify RLS is working
      const currentUser = await supabase.auth.getUser();
      if (currentUser.data.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role, dusun')
          .eq('user_id', currentUser.data.user.id)
          .single();
          
        if (profileData) {
          console.log('Current user role:', profileData.role);
          console.log('Current user dusun:', profileData.dusun);
        }
      }
      
      return allData;
    }
  });

  const columns = [
    { key: 'no_kk', label: 'No. KK' },
    { key: 'nik', label: 'NIK' },
    { key: 'nama', label: 'Nama' },
    { key: 'jenis_kelamin', label: 'L/P' },
    { key: 'tempat_lahir', label: 'Tempat Lahir' },
    { key: 'tanggal_lahir', label: 'Tgl Lahir' },
    { key: 'agama', label: 'Agama' },
    { key: 'status_kawin', label: 'Status' },
    { key: 'pekerjaan', label: 'Pekerjaan' },
    { key: 'dusun', label: 'Dusun' },
    { key: 'rt', label: 'RT' },
    { key: 'rw', label: 'RW' },
  ];

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const filteredData = useMemo(() => {
    let filtered = pendudukData.filter(item => {
      const matchesSearch = 
        item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nik.includes(searchTerm) ||
        (item.no_kk && item.no_kk.includes(searchTerm));

      if (!matchesSearch) return false;

      // Apply advanced filters
      if (advancedFilters.jenis_kelamin && item.jenis_kelamin !== advancedFilters.jenis_kelamin) return false;
      if (advancedFilters.agama && item.agama !== advancedFilters.agama) return false;
      if (advancedFilters.status_kawin && item.status_kawin !== advancedFilters.status_kawin) return false;
      if (advancedFilters.pendidikan && item.pendidikan !== advancedFilters.pendidikan) return false;
      if (advancedFilters.golongan_darah && item.golongan_darah !== advancedFilters.golongan_darah) return false;
      if (advancedFilters.status_hubungan && item.status_hubungan !== advancedFilters.status_hubungan) return false;
      if (advancedFilters.dusun && item.dusun?.toLowerCase() !== advancedFilters.dusun.toLowerCase()) return false;
      if (advancedFilters.rt && item.rt !== advancedFilters.rt) return false;
      if (advancedFilters.rw && item.rw !== advancedFilters.rw) return false;
      if (advancedFilters.pekerjaan && item.pekerjaan !== advancedFilters.pekerjaan) return false;

      // Age filters
      if (advancedFilters.umur_min || advancedFilters.umur_max) {
        const age = calculateAge(item.tanggal_lahir);
        if (age === null) return false;
        if (advancedFilters.umur_min && age < parseInt(advancedFilters.umur_min)) return false;
        if (advancedFilters.umur_max && age > parseInt(advancedFilters.umur_max)) return false;
      }

      return true;
    });

    console.log(`Filtered data: ${filtered.length} from ${pendudukData.length} total records`);
    return filtered;
  }, [pendudukData, searchTerm, advancedFilters]);

  const handleEdit = (item: any) => {
    setSelectedPenduduk(item);
    setIsFormOpen(true);
  };

  const handleDelete = async (item: any) => {
    if (confirm('Apakah Anda yakin ingin menghapus data penduduk ini?')) {
      const { error } = await supabase
        .from('penduduk')
        .delete()
        .eq('id', item.id);

      if (error) {
        toast({
          title: 'Gagal menghapus data',
          description: 'Terjadi kesalahan saat menghapus data penduduk',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Data berhasil dihapus',
          description: 'Data penduduk telah dihapus dari sistem',
        });
        refetch();
      }
    }
  };

  const handleView = (item: any) => {
    setSelectedPenduduk(item);
    setIsDetailOpen(true);
  };

  const handleAddNew = () => {
    setSelectedPenduduk(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedPenduduk(null);
    refetch();
  };

  const handleApplyFilter = (filters: FilterValues) => {
    setAdvancedFilters(filters);
  };

  const handleDownloadFiltered = () => {
    if (filteredData.length === 0) {
      toast({
        title: 'Tidak ada data',
        description: 'Tidak ada data yang dapat diunduh dengan filter saat ini',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Prepare data for export with calculated age
      const exportData = filteredData.map((item, index) => ({
        No: index + 1,
        'No. KK': item.no_kk || '',
        NIK: item.nik || '',
        Nama: item.nama || '',
        'Jenis Kelamin': item.jenis_kelamin || '',
        'Tempat Lahir': item.tempat_lahir || '',
        'Tanggal Lahir': item.tanggal_lahir || '',
        Umur: calculateAge(item.tanggal_lahir) || '',
        Agama: item.agama || '',
        'Status Perkawinan': item.status_kawin || '',
        Pendidikan: item.pendidikan || '',
        Pekerjaan: item.pekerjaan || '',
        'Status Hubungan': item.status_hubungan || '',
        'Golongan Darah': item.golongan_darah || '',
        'Nama Ayah': item.nama_ayah || '',
        'Nama Ibu': item.nama_ibu || '',
        Dusun: item.dusun || '',
        RT: item.rt || '',
        RW: item.rw || '',
        'Alamat Lengkap': item.alamat_lengkap || '',
        'Nama Provinsi': item.nama_prop || '',
        'Nama Kabupaten': item.nama_kab || '',
        'Nama Kecamatan': item.nama_kec || '',
        'Nama Kelurahan': item.nama_kel || '',
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const wscols = [
        { wch: 5 },   // No
        { wch: 15 },  // No. KK
        { wch: 18 },  // NIK
        { wch: 25 },  // Nama
        { wch: 12 },  // Jenis Kelamin
        { wch: 15 },  // Tempat Lahir
        { wch: 12 },  // Tanggal Lahir
        { wch: 8 },   // Umur
        { wch: 10 },  // Agama
        { wch: 15 },  // Status Perkawinan
        { wch: 20 },  // Pendidikan
        { wch: 20 },  // Pekerjaan
        { wch: 15 },  // Status Hubungan
        { wch: 12 },  // Golongan Darah
        { wch: 20 },  // Nama Ayah
        { wch: 20 },  // Nama Ibu
        { wch: 15 },  // Dusun
        { wch: 8 },   // RT
        { wch: 8 },   // RW
        { wch: 30 },  // Alamat Lengkap
        { wch: 15 },  // Nama Provinsi
        { wch: 15 },  // Nama Kabupaten
        { wch: 15 },  // Nama Kecamatan
        { wch: 15 },  // Nama Kelurahan
      ];
      ws['!cols'] = wscols;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Data Penduduk Terfilter');

      // Generate filename with current date and filter info
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const activeFiltersCount = Object.values(advancedFilters).filter(Boolean).length;
      const filterInfo = activeFiltersCount > 0 ? `_${activeFiltersCount}filter` : '';
      const filename = `Data_Penduduk_Terfilter_${dateStr}${filterInfo}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);

      toast({
        title: 'Download berhasil',
        description: `File ${filename} telah diunduh dengan ${filteredData.length} data`,
      });
    } catch (error) {
      console.error('Error downloading filtered data:', error);
      toast({
        title: 'Gagal mengunduh',
        description: 'Terjadi kesalahan saat mengunduh data',
        variant: 'destructive',
      });
    }
  };

  const activeFiltersCount = Object.values(advancedFilters).filter(Boolean).length;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-sm">Memuat data penduduk...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full max-w-full overflow-hidden">
      <div className="flex flex-col space-y-4 w-full">
        <div className="flex flex-col space-y-4 w-full">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gradient truncate">Data Penduduk</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">Kelola data penduduk desa - Total: {pendudukData.length} jiwa</p>
          </div>
          
          {/* Action Buttons Container - Scrollable on mobile */}
          <Card className="w-full">
            <CardContent className="p-3">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                <div className="flex gap-2 min-w-max">
                  {hasPermission('button:create:penduduk') && (
                    <Button onClick={handleAddNew} size="sm" className="flex items-center gap-2 text-xs whitespace-nowrap">
                      <Plus className="h-4 w-4" />
                      <span>Tambah</span>
                    </Button>
                  )}
                  <Link to="/data-keluarga">
                    <Button variant="outline" size="sm" className="flex items-center gap-2 text-xs whitespace-nowrap">
                      <Users className="h-4 w-4" />
                      <span>Data Keluarga</span>
                    </Button>
                  </Link>
                  {hasPermission('button:download:penduduk_template') && (
                    <DownloadTemplateButton />
                  )}
                  {hasPermission('button:import:penduduk') && (
                    <Button 
                      onClick={() => setIsImportOpen(true)} 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-2 text-xs whitespace-nowrap"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Import</span>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="w-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm sm:text-base lg:text-lg">Filter & Pencarian</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama, NIK, atau No. KK..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-xs sm:text-sm w-full"
              />
            </div>
            <Button 
              variant="outline" 
              onClick={() => setIsFilterOpen(true)}
              className="flex items-center gap-2 relative w-full sm:w-auto text-xs"
              size="sm"
            >
              <Filter className="h-4 w-4" />
              <span>Filter Lanjutan</span>
              {activeFiltersCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full text-xs h-5 w-5 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm sm:text-base lg:text-lg">
              Daftar Penduduk ({filteredData.length} dari {pendudukData.length} jiwa)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 lg:p-6 w-full">
            {error ? (
              <div className="text-center py-8 text-red-500 text-xs sm:text-sm">
                Gagal memuat data penduduk. Silakan coba lagi nanti.
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={filteredData}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
                itemsPerPage={100}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-full md:max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">
              {selectedPenduduk ? 'Edit Data Penduduk' : 'Tambah Data Penduduk'}
            </DialogTitle>
          </DialogHeader>
          <PendudukForm
            penduduk={selectedPenduduk}
            onClose={handleFormClose}
          />
        </DialogContent>
      </Dialog>

      {/* Import Excel Dialog */}
      <ImportExcelDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImportComplete={refetch}
      />

      {/* Advanced Filter Dialog */}
      <AdvancedFilter
        open={isFilterOpen}
        onOpenChange={setIsFilterOpen}
        onApplyFilter={handleApplyFilter}
        onDownloadFiltered={handleDownloadFiltered}
        initialFilters={advancedFilters}
        filteredCount={filteredData.length}
        totalCount={pendudukData.length}
      />

      {/* Detail Penduduk Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-full md:max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">Detail Data Penduduk</DialogTitle>
          </DialogHeader>
          {selectedPenduduk && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nama Lengkap</p>
                  <p className="text-base font-semibold">{selectedPenduduk.nama}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">NIK</p>
                  <p className="text-base font-semibold">{selectedPenduduk.nik}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">No. KK</p>
                  <p className="text-base font-semibold">{selectedPenduduk.no_kk}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Jenis Kelamin</p>
                  <p className="text-base font-semibold">{selectedPenduduk.jenis_kelamin}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tempat, Tanggal Lahir</p>
                  <p className="text-base font-semibold">{selectedPenduduk.tempat_lahir}, {new Date(selectedPenduduk.tanggal_lahir).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Agama</p>
                  <p className="text-base font-semibold">{selectedPenduduk.agama}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status Perkawinan</p>
                  <p className="text-base font-semibold">{selectedPenduduk.status_kawin}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pendidikan</p>
                  <p className="text-base font-semibold">{selectedPenduduk.pendidikan}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pekerjaan</p>
                  <p className="text-base font-semibold">{selectedPenduduk.pekerjaan}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Golongan Darah</p>
                  <p className="text-base font-semibold">{selectedPenduduk.golongan_darah}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status Hubungan</p>
                  <p className="text-base font-semibold">{selectedPenduduk.status_hubungan}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nama Ayah</p>
                  <p className="text-base font-semibold">{selectedPenduduk.nama_ayah}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nama Ibu</p>
                  <p className="text-base font-semibold">{selectedPenduduk.nama_ibu}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Alamat</p>
                <p className="text-base font-semibold">{selectedPenduduk.alamat_lengkap}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Dusun</p>
                    <p className="text-sm font-medium">{selectedPenduduk.dusun}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">RT</p>
                    <p className="text-sm font-medium">{selectedPenduduk.rt}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">RW</p>
                    <p className="text-sm font-medium">{selectedPenduduk.rw}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Penduduk;