import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Filter, X, Download, Search, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

interface AdvancedFilterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyFilter: (filters: FilterValues) => void;
  onDownloadFiltered: () => void;
  initialFilters?: FilterValues;
  filteredCount: number;
  totalCount: number;
}

const AdvancedFilter = ({ 
  open, 
  onOpenChange, 
  onApplyFilter, 
  onDownloadFiltered, 
  initialFilters = {}, 
  filteredCount, 
  totalCount 
}: AdvancedFilterProps) => {
  const [filters, setFilters] = useState<FilterValues>(initialFilters);

  const handleFilterChange = (key: keyof FilterValues, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const handleApply = () => {
    onApplyFilter(filters);
    onOpenChange(false);
  };

  const handleReset = () => {
    setFilters({});
    onApplyFilter({});
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value && value !== '').length;
  };

  const getFilterSummary = () => {
    const activeFilters = Object.entries(filters)
      .filter(([_, value]) => value && value !== '')
      .map(([key, value]) => {
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        return `${label}: ${value}`;
      });
    return activeFilters;
  };

  const jenisKelaminOptions = ['Laki-laki', 'Perempuan'];
  const agamaOptions = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'];
  const statusKawinOptions = ['Belum Kawin', 'Kawin', 'Cerai Hidup', 'Cerai Mati'];
  const pendidikanOptions = [
    'Tidak/Belum Sekolah', 'Belum Tamat SD/Sederajat', 'Tamat SD/Sederajat',
    'SLTP/Sederajat', 'SLTA/Sederajat', 'Diploma I/II', 'Akademi/Diploma III/S.Muda',
    'Diploma IV/Strata I', 'Strata II', 'Strata III'
  ];
  const pekerjaanOptions = [
    'Belum/Tidak Bekerja', 'Mengurus Rumah Tangga', 'Pelajar/Mahasiswa', 'Pensiunan',
    'Pegawai Negeri Sipil', 'Tentara Nasional Indonesia', 'Kepolisian RI', 'Perdagangan',
    'Petani/Pekebun', 'Peternak', 'Nelayan/Perikanan', 'Industri', 'Konstruksi',
    'Transportasi', 'Karyawan Swasta', 'Karyawan BUMN', 'Karyawan BUMD', 'Karyawan Honorer',
    'Buruh Harian Lepas', 'Buruh Tani/Perkebunan', 'Buruh Nelayan/Perikanan', 'Buruh Peternakan',
    'Pembantu Rumah Tangga', 'Tukang Cukur', 'Tukang Listrik', 'Tukang Batu', 'Tukang Kayu',
    'Tukang Sol Sepatu', 'Tukang Las/Pandai Besi', 'Tukang Jahit', 'Penata Rambut', 'Penata Rias',
    'Penata Busana', 'Mekanik', 'Tukang Gigi', 'Seniman', 'Tabib', 'Paraji', 'Perancang Busana',
    'Penterjemah', 'Imam Masjid', 'Pendeta', 'Pastur', 'Wartawan', 'Ustadz/Mubaligh', 'Juru Masak',
    'Promotor Acara', 'Anggota DPR-RI', 'Anggota DPD', 'Anggota BPK', 'Presiden', 'Wakil Presiden',
    'Anggota Mahkamah Konstitusi', 'Anggota Kabinet/Kementerian', 'Duta Besar', 'Gubernur',
    'Wakil Gubernur', 'Bupati', 'Wakil Bupati', 'Walikota', 'Wakil Walikota', 'Anggota DPRD Propinsi',
    'Anggota DPRD Kabupaten/Kota', 'Dosen', 'Guru', 'Pilot', 'Pengacara', 'Notaris', 'Arsitek',
    'Akuntan', 'Konsultan', 'Dokter', 'Bidan', 'Perawat', 'Apoteker', 'Psikiater/Psikolog',
    'Penyiar Televisi', 'Penyiar Radio', 'Pelaut', 'Peneliti', 'Sopir', 'Pialang', 'Paranormal',
    'Pedagang', 'Perangkat Desa', 'Kepala Desa', 'Biarawati', 'Wiraswasta', 'Anggota Lembaga Tinggi',
    'Artis', 'Atlit', 'Chef', 'Manajer', 'Tenaga Tata Usaha', 'Operator', 'Pekerja Pengolahan, Kerajinan',
    'Teknisi', 'Asisten Ahli', 'Lainnya'
  ];
  const golonganDarahOptions = ['A', 'B', 'AB', 'O'];
  const statusHubunganOptions = [
    'Kepala Keluarga', 'Suami', 'Istri', 'Anak', 'Menantu', 'Cucu', 'Orang Tua',
    'Mertua', 'Famili Lain', 'Pembantu', 'Lainnya'
  ];

  // Fetch dusun data from wilayah table (konsisten dengan form Penduduk)
  const { data: dusunOptions = [], isLoading: loadingDusun } = useQuery({
    queryKey: ['wilayah-dusun-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wilayah')
        .select('nama')
        .eq('jenis', 'Dusun')
        .eq('status', 'Aktif')
        .order('nama', { ascending: true });

      if (error) {
        console.error('Error fetching dusun data:', error);
        return [];
      }
      
      const dusunList = data?.map(item => item.nama).filter(nama => nama && nama.trim() !== '') || [];
      return dusunList;
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Lanjutan Data Penduduk
          </DialogTitle>
          
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Total Data: <strong>{totalCount}</strong></span>
              <span>Hasil Filter: <strong>{filteredCount}</strong></span>
              {getActiveFiltersCount() > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {getActiveFiltersCount()} Filter Aktif
                </Badge>
              )}
            </div>
            
            {getFilterSummary().length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium">Filter Aktif:</span>
                <div className="flex flex-wrap gap-2">
                  {getFilterSummary().map((filter, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {filter}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogHeader>

        <Separator />
        
        <div className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Filter Demografis</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Jenis Kelamin</Label>
                <Select value={filters.jenis_kelamin || 'all'} onValueChange={(value) => handleFilterChange('jenis_kelamin', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis kelamin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    {jenisKelaminOptions.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Agama</Label>
                <Select value={filters.agama || 'all'} onValueChange={(value) => handleFilterChange('agama', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih agama" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    {agamaOptions.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status Perkawinan</Label>
                <Select value={filters.status_kawin || 'all'} onValueChange={(value) => handleFilterChange('status_kawin', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    {statusKawinOptions.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Pendidikan</Label>
                <Select value={filters.pendidikan || 'all'} onValueChange={(value) => handleFilterChange('pendidikan', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih pendidikan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    {pendidikanOptions.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Golongan Darah</Label>
                <Select value={filters.golongan_darah || 'all'} onValueChange={(value) => handleFilterChange('golongan_darah', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih golongan darah" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    {golonganDarahOptions.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status Hubungan</Label>
                <Select value={filters.status_hubungan || 'all'} onValueChange={(value) => handleFilterChange('status_hubungan', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status hubungan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    {statusHubunganOptions.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Filter Lokasi & Pekerjaan</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

              <div className="space-y-2">
                <Label>Dusun</Label>
                <Select value={filters.dusun || 'all'} onValueChange={(value) => handleFilterChange('dusun', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih dusun" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Dusun</SelectItem>
                    {loadingDusun ? (
                      <div className="p-2 text-center">
                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                        <span className="text-sm">Memuat dusun...</span>
                      </div>
                    ) : dusunOptions.length > 0 ? (
                      dusunOptions.map((dusun) => (
                        <SelectItem key={dusun} value={dusun}>
                          {dusun}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        Tidak ada dusun tersedia
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>RT</Label>
                <Input
                  placeholder="Nomor RT"
                  value={filters.rt || ''}
                  onChange={(e) => handleFilterChange('rt', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>RW</Label>
                <Input
                  placeholder="Nomor RW"
                  value={filters.rw || ''}
                  onChange={(e) => handleFilterChange('rw', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Pekerjaan</Label>
                <Select value={filters.pekerjaan || 'all'} onValueChange={(value) => handleFilterChange('pekerjaan', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih pekerjaan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    {pekerjaanOptions.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Filter Usia</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="space-y-2">
                <Label>Umur Minimum</Label>
                <Input
                  type="number"
                  placeholder="Umur minimum"
                  value={filters.umur_min || ''}
                  onChange={(e) => handleFilterChange('umur_min', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Umur Maksimum</Label>
                <Input
                  type="number"
                  placeholder="Umur maksimum"
                  value={filters.umur_max || ''}
                  onChange={(e) => handleFilterChange('umur_max', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <div className="flex flex-col sm:flex-row gap-2 pt-4">
          <Button variant="outline" onClick={handleReset} className="flex items-center gap-2">
            <X className="h-4 w-4" />
            Reset Filter
          </Button>
          <Button 
            variant="outline" 
            onClick={onDownloadFiltered}
            className="flex items-center gap-2"
            disabled={filteredCount === 0}
          >
            <Download className="h-4 w-4" />
            Download ({filteredCount} data)
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Batal
          </Button>
          <Button onClick={handleApply} className="flex-1">
            <Search className="h-4 w-4 mr-2" />
            Terapkan Filter
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdvancedFilter;
