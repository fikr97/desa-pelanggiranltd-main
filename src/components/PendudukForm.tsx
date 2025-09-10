
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface PendudukFormProps {
  penduduk?: any;
  onClose: () => void;
}

const pekerjaanOptions = [
  'Belum/Tidak Bekerja',
  'Mengurus Rumah Tangga',
  'Pelajar/Mahasiswa',
  'Pensiunan',
  'Pegawai Negeri Sipil',
  'Tentara Nasional Indonesia',
  'Kepolisian RI',
  'Perdagangan',
  'Petani/Pekebun',
  'Peternak',
  'Nelayan/Perikanan',
  'Industri',
  'Konstruksi',
  'Transportasi',
  'Karyawan Swasta',
  'Karyawan BUMN',
  'Karyawan BUMD',
  'Karyawan Honorer',
  'Buruh Harian Lepas',
  'Buruh Tani/Perkebunan',
  'Buruh Nelayan/Perikanan',
  'Buruh Peternakan',
  'Pembantu Rumah Tangga',
  'Tukang Cukur',
  'Tukang Listrik',
  'Tukang Batu',
  'Tukang Kayu',
  'Tukang Sol Sepatu',
  'Tukang Las/Pandai Besi',
  'Tukang Jahit',
  'Penata Rambut',
  'Penata Rias',
  'Penata Busana',
  'Mekanik',
  'Tukang Gigi',
  'Seniman',
  'Tabib',
  'Paraji',
  'Perancang Busana',
  'Penterjemah',
  'Imam Masjid',
  'Pendeta',
  'Pastur',
  'Wartawan',
  'Ustadz/Mubaligh',
  'Juru Masak',
  'Promotor Acara',
  'Anggota DPR-RI',
  'Anggota DPD',
  'Anggota BPK',
  'Presiden',
  'Wakil Presiden',
  'Anggota Mahkamah Konstitusi',
  'Anggota Kabinet/Kementerian',
  'Duta Besar',
  'Gubernur',
  'Wakil Gubernur',
  'Bupati',
  'Wakil Bupati',
  'Walikota',
  'Wakil Walikota',
  'Anggota DPRD Propinsi',
  'Anggota DPRD Kabupaten/Kota',
  'Dosen',
  'Guru',
  'Pilot',
  'Pengacara',
  'Notaris',
  'Arsitek',
  'Akuntan',
  'Konsultan',
  'Dokter',
  'Bidan',
  'Perawat',
  'Apoteker',
  'Psikiater/Psikolog',
  'Penyiar Televisi',
  'Penyiar Radio',
  'Pelaut',
  'Peneliti',
  'Sopir',
  'Pialang',
  'Paranormal',
  'Pedagang',
  'Perangkat Desa',
  'Kepala Desa',
  'Biarawati',
  'Wiraswasta',
  'Anggota Lembaga Tinggi',
  'Artis',
  'Atlit',
  'Chef',
  'Manajer',
  'Tenaga Tata Usaha',
  'Operator',
  'Pekerja Pengolahan, Kerajinan',
  'Teknisi',
  'Asisten Ahli',
  'Lainnya'
];

const PendudukForm: React.FC<PendudukFormProps> = ({ penduduk, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Fetch dusun data from wilayah table
  const { data: dusunOptions = [], isLoading: loadingDusun } = useQuery({
    queryKey: ['wilayah-dusun'],
    queryFn: async () => {
      console.log('Fetching dusun data from wilayah table...');
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
      console.log('Fetched dusun list:', dusunList);
      return dusunList;
    }
  });

  const [formData, setFormData] = useState({
    no_kk: '',
    nik: '',
    nama: '',
    jenis_kelamin: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    golongan_darah: '',
    agama: '',
    status_kawin: '',
    status_hubungan: '',
    pendidikan: '',
    pekerjaan: '',
    nama_ibu: '',
    nama_ayah: '',
    rt: '',
    rw: '',
    dusun: '',
    nama_kep_kel: '',
    alamat_lengkap: '',
    nama_prop: 'Sumatera Utara',
    nama_kab: 'Batu Bara',
    nama_kec: 'Laut Tador',
    nama_kel: 'Pelanggiran Laut Tador'
  });

  useEffect(() => {
    if (penduduk) {
      console.log('Loading penduduk data for edit:', penduduk);
      setFormData({
        no_kk: penduduk.no_kk || '',
        nik: penduduk.nik || '',
        nama: penduduk.nama || '',
        jenis_kelamin: penduduk.jenis_kelamin || '',
        tempat_lahir: penduduk.tempat_lahir || '',
        tanggal_lahir: penduduk.tanggal_lahir || '',
        golongan_darah: penduduk.golongan_darah || '',
        agama: penduduk.agama || '',
        status_kawin: penduduk.status_kawin || '',
        status_hubungan: penduduk.status_hubungan || '',
        pendidikan: penduduk.pendidikan || '',
        pekerjaan: penduduk.pekerjaan || '',
        nama_ibu: penduduk.nama_ibu || '',
        nama_ayah: penduduk.nama_ayah || '',
        rt: penduduk.rt || '',
        rw: penduduk.rw || '',
        dusun: penduduk.dusun || '',
        nama_kep_kel: penduduk.nama_kep_kel || '',
        alamat_lengkap: penduduk.alamat_lengkap || '',
        nama_prop: penduduk.nama_prop || 'Sumatera Utara',
        nama_kab: penduduk.nama_kab || 'Batu Bara',
        nama_kec: penduduk.nama_kec || 'Laut Tador',
        nama_kel: penduduk.nama_kel || 'Pelanggiran Laut Tador'
      });
    }
  }, [penduduk]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const originalDusun = penduduk?.dusun;
      const dusunHasChanged = penduduk?.id && originalDusun !== formData.dusun;

      if (penduduk?.id) {
        // This is an UPDATE operation
        let error = null;

        // 1. If dusun has changed, call the RPC function to move the resident
        if (dusunHasChanged) {
          console.log(`Dusun changed from '${originalDusun}' to '${formData.dusun}'. Calling RPC...`);
          const { error: rpcError } = await supabase.rpc('move_penduduk', {
            resident_id: penduduk.id,
            new_dusun: formData.dusun
          });

          if (rpcError) {
            console.error('RPC Error moving resident:', rpcError);
            // Throw the error to be caught by the catch block
            throw new Error(`Gagal memindahkan dusun: ${rpcError.message}`);
          }
          console.log('RPC call successful.');
        }

        // 2. Update the rest of the form data (excluding dusun if it was changed)
        const dataToUpdate = { ...formData };
        if (dusunHasChanged) {
          // We already handled the dusun update via RPC, so remove it from this update payload
          delete (dataToUpdate as { dusun?: string }).dusun;
        }
        
        console.log('Updating remaining data:', dataToUpdate);
        const { error: updateError } = await supabase
          .from('penduduk')
          .update(dataToUpdate)
          .eq('id', penduduk.id);

        error = updateError;

        if (error) {
          console.error('Update error:', error);
          throw error;
        }

        toast({
          title: 'Data berhasil diperbarui',
          description: 'Data penduduk telah diperbarui dalam sistem',
        });

      } else {
        // This is a CREATE operation
        console.log('Creating new penduduk');
        const { error } = await supabase
          .from('penduduk')
          .insert([formData])
          .select();

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }

        toast({
          title: 'Data berhasil ditambahkan',
          description: 'Data penduduk baru telah ditambahkan ke sistem',
        });
      }

      onClose();
    } catch (error: any) {
      console.error('Error saving penduduk:', error);
      toast({
        title: 'Gagal menyimpan data',
        description: error.message || 'Terjadi kesalahan saat menyimpan data penduduk',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Identitas */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Data Identitas</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="no_kk">No. KK *</Label>
              <Input
                id="no_kk"
                value={formData.no_kk}
                onChange={(e) => handleInputChange('no_kk', e.target.value)}
                placeholder="Nomor Kartu Keluarga"
                required
              />
            </div>
            <div>
              <Label htmlFor="nik">NIK *</Label>
              <Input
                id="nik"
                value={formData.nik}
                onChange={(e) => handleInputChange('nik', e.target.value)}
                placeholder="Nomor Induk Kependudukan"
                maxLength={16}
                required
              />
            </div>
            <div>
              <Label htmlFor="nama">Nama Lengkap *</Label>
              <Input
                id="nama"
                value={formData.nama}
                onChange={(e) => handleInputChange('nama', e.target.value)}
                placeholder="Nama lengkap sesuai KTP"
                required
              />
            </div>
            <div>
              <Label htmlFor="jenis_kelamin">Jenis Kelamin *</Label>
              <Select value={formData.jenis_kelamin} onValueChange={(value) => handleInputChange('jenis_kelamin', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis kelamin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                  <SelectItem value="Perempuan">Perempuan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tempat_lahir">Tempat Lahir</Label>
              <Input
                id="tempat_lahir"
                value={formData.tempat_lahir}
                onChange={(e) => handleInputChange('tempat_lahir', e.target.value)}
                placeholder="Kota/Kabupaten tempat lahir"
              />
            </div>
            <div>
              <Label htmlFor="tanggal_lahir">Tanggal Lahir</Label>
              <Input
                id="tanggal_lahir"
                type="date"
                value={formData.tanggal_lahir}
                onChange={(e) => handleInputChange('tanggal_lahir', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Personal */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Data Personal</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="golongan_darah">Golongan Darah</Label>
              <Select value={formData.golongan_darah} onValueChange={(value) => handleInputChange('golongan_darah', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih golongan darah" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="AB">AB</SelectItem>
                  <SelectItem value="O">O</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="agama">Agama</Label>
              <Select value={formData.agama} onValueChange={(value) => handleInputChange('agama', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih agama" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Islam">Islam</SelectItem>
                  <SelectItem value="Kristen">Kristen</SelectItem>
                  <SelectItem value="Katolik">Katolik</SelectItem>
                  <SelectItem value="Hindu">Hindu</SelectItem>
                  <SelectItem value="Buddha">Buddha</SelectItem>
                  <SelectItem value="Konghucu">Konghucu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status_kawin">Status Kawin</Label>
              <Select value={formData.status_kawin} onValueChange={(value) => handleInputChange('status_kawin', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status kawin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Belum Kawin">Belum Kawin</SelectItem>
                  <SelectItem value="Kawin">Kawin</SelectItem>
                  <SelectItem value="Cerai Hidup">Cerai Hidup</SelectItem>
                  <SelectItem value="Cerai Mati">Cerai Mati</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status_hubungan">Status Hub. dalam Keluarga</Label>
              <Select value={formData.status_hubungan} onValueChange={(value) => handleInputChange('status_hubungan', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status hubungan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Kepala Keluarga">Kepala Keluarga</SelectItem>
                  <SelectItem value="Istri">Istri</SelectItem>
                  <SelectItem value="Anak">Anak</SelectItem>
                  <SelectItem value="Menantu">Menantu</SelectItem>
                  <SelectItem value="Cucu">Cucu</SelectItem>
                  <SelectItem value="Orangtua">Orangtua</SelectItem>
                  <SelectItem value="Mertua">Mertua</SelectItem>
                  <SelectItem value="Famili Lain">Famili Lain</SelectItem>
                  <SelectItem value="Pembantu">Pembantu</SelectItem>
                  <SelectItem value="Lainnya">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="pendidikan">Pendidikan Terakhir</Label>
              <Select value={formData.pendidikan} onValueChange={(value) => handleInputChange('pendidikan', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih pendidikan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tidak/Belum Sekolah">Tidak/Belum Sekolah</SelectItem>
                  <SelectItem value="Belum Tamat SD/Sederajat">Belum Tamat SD/Sederajat</SelectItem>
                  <SelectItem value="Tamat SD/Sederajat">Tamat SD/Sederajat</SelectItem>
                  <SelectItem value="SLTP/Sederajat">SLTP/Sederajat</SelectItem>
                  <SelectItem value="SLTA/Sederajat">SLTA/Sederajat</SelectItem>
                  <SelectItem value="Diploma I/II">Diploma I/II</SelectItem>
                  <SelectItem value="Akademi/Diploma III/S.Muda">Akademi/Diploma III/S.Muda</SelectItem>
                  <SelectItem value="Diploma IV/Strata I">Diploma IV/Strata I</SelectItem>
                  <SelectItem value="Strata II">Strata II</SelectItem>
                  <SelectItem value="Strata III">Strata III</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="pekerjaan">Pekerjaan</Label>
              <Select value={formData.pekerjaan} onValueChange={(value) => handleInputChange('pekerjaan', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih pekerjaan" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {pekerjaanOptions.map((pekerjaan) => (
                    <SelectItem key={pekerjaan} value={pekerjaan}>
                      {pekerjaan}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Data Keluarga */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Data Keluarga</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nama_ibu">Nama Ibu</Label>
              <Input
                id="nama_ibu"
                value={formData.nama_ibu}
                onChange={(e) => handleInputChange('nama_ibu', e.target.value)}
                placeholder="Nama lengkap ibu kandung"
              />
            </div>
            <div>
              <Label htmlFor="nama_ayah">Nama Ayah</Label>
              <Input
                id="nama_ayah"
                value={formData.nama_ayah}
                onChange={(e) => handleInputChange('nama_ayah', e.target.value)}
                placeholder="Nama lengkap ayah kandung"
              />
            </div>
            <div>
              <Label htmlFor="nama_kep_kel">Nama Kepala Keluarga</Label>
              <Input
                id="nama_kep_kel"
                value={formData.nama_kep_kel}
                onChange={(e) => handleInputChange('nama_kep_kel', e.target.value)}
                placeholder="Nama kepala keluarga"
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Alamat */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Data Alamat</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <Label htmlFor="alamat_lengkap">Alamat Lengkap</Label>
              <Input
                id="alamat_lengkap"
                value={formData.alamat_lengkap}
                onChange={(e) => handleInputChange('alamat_lengkap', e.target.value)}
                placeholder="Alamat lengkap (Jalan, Gang, No. Rumah)"
              />
            </div>
            <div>
              <Label htmlFor="rt">RT</Label>
              <Input
                id="rt"
                value={formData.rt}
                onChange={(e) => handleInputChange('rt', e.target.value)}
                placeholder="001"
                maxLength={3}
              />
            </div>
            <div>
              <Label htmlFor="rw">RW</Label>
              <Input
                id="rw"
                value={formData.rw}
                onChange={(e) => handleInputChange('rw', e.target.value)}
                placeholder="001"
                maxLength={3}
              />
            </div>
            <div className="lg:col-span-2">
              <Label htmlFor="dusun">Dusun</Label>
              <Select value={formData.dusun} onValueChange={(value) => handleInputChange('dusun', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih dusun" />
                </SelectTrigger>
                <SelectContent>
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
          </CardContent>
        </Card>

        {/* Data Wilayah */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Data Wilayah</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="nama_prop">Provinsi</Label>
              <Input
                id="nama_prop"
                value={formData.nama_prop}
                onChange={(e) => handleInputChange('nama_prop', e.target.value)}
                placeholder="Nama provinsi"
              />
            </div>
            <div>
              <Label htmlFor="nama_kab">Kabupaten/Kota</Label>
              <Input
                id="nama_kab"
                value={formData.nama_kab}
                onChange={(e) => handleInputChange('nama_kab', e.target.value)}
                placeholder="Nama kabupaten/kota"
              />
            </div>
            <div>
              <Label htmlFor="nama_kec">Kecamatan</Label>
              <Input
                id="nama_kec"
                value={formData.nama_kec}
                onChange={(e) => handleInputChange('nama_kec', e.target.value)}
                placeholder="Nama kecamatan"
              />
            </div>
            <div>
              <Label htmlFor="nama_kel">Kelurahan/Desa</Label>
              <Input
                id="nama_kel"
                value={formData.nama_kel}
                onChange={(e) => handleInputChange('nama_kel', e.target.value)}
                placeholder="Nama kelurahan/desa"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end space-x-4 pt-6 border-t">
        <Button type="button" variant="outline" onClick={onClose}>
          Batal
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {penduduk ? 'Perbarui' : 'Simpan'}
        </Button>
      </div>
    </form>
  );
};

export default PendudukForm;
