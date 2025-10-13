
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const [isMovingFamily, setIsMovingFamily] = useState(false);
  const [showFamilyMoveDialog, setShowFamilyMoveDialog] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
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

    if (formData.nik.length !== 16) {
      toast({ title: 'Data tidak valid', description: 'NIK harus terdiri dari 16 digit.', variant: 'destructive' });
      return;
    }
    if (formData.no_kk.length !== 16) {
      toast({ title: 'Data tidak valid', description: 'No. KK harus terdiri dari 16 digit.', variant: 'destructive' });
      return;
    }

    if (!formData.jenis_kelamin) {
      toast({ title: 'Data tidak lengkap', description: 'Silakan pilih Jenis Kelamin.', variant: 'destructive' });
      return;
    }
    if (!formData.agama) {
      toast({ title: 'Data tidak lengkap', description: 'Silakan pilih Agama.', variant: 'destructive' });
      return;
    }
    if (!formData.status_kawin) {
      toast({ title: 'Data tidak lengkap', description: 'Silakan pilih Status Kawin.', variant: 'destructive' });
      return;
    }
    if (!formData.status_hubungan) {
      toast({ title: 'Data tidak lengkap', description: 'Silakan pilih Status Hubungan.', variant: 'destructive' });
      return;
    }
    if (!formData.pendidikan) {
      toast({ title: 'Data tidak lengkap', description: 'Silakan pilih Pendidikan.', variant: 'destructive' });
      return;
    }
    if (!formData.pekerjaan) {
      toast({ title: 'Data tidak lengkap', description: 'Silakan pilih Pekerjaan.', variant: 'destructive' });
      return;
    }
    if (!formData.dusun) {
      toast({ title: 'Data tidak lengkap', description: 'Silakan pilih Dusun.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      const originalDusun = penduduk?.dusun;
      const dusunHasChanged = penduduk?.id && originalDusun !== formData.dusun;

      if (penduduk?.id && dusunHasChanged) {
        // Check if there are other family members with the same KK
        const { data: familyMembers, error: familyError } = await supabase
          .from('penduduk')
          .select('*')
          .eq('no_kk', penduduk.no_kk)
          .neq('id', penduduk.id); // Exclude current resident

        if (familyError) {
          console.error('Error fetching family members:', familyError);
          toast({
            title: 'Gagal memuat data keluarga',
            description: 'Terjadi kesalahan saat memeriksa anggota keluarga lainnya',
            variant: 'destructive',
          });
          return;
        }

        // Check if there are other family members with the same KK
        if (familyMembers && familyMembers.length > 0) {
          // Show popup to ask if user wants to move all family members
          setFamilyMembers(familyMembers);
          setShowFamilyMoveDialog(true);
          setIsMovingFamily(true);
          return; // Exit the function to show the dialog
        }
      }

      // If no family members or user decides not to move family, proceed with normal update
      await performUpdate();
    } catch (error: any) {
      if (error.code === '23505' && error.message.includes('penduduk_nik_key')) {
        console.error('Error saving penduduk: NIK already exists.', error);
        toast({
          title: 'Gagal menyimpan data',
          description: 'NIK yang Anda masukkan sudah terdaftar dalam sistem.',
          variant: 'destructive',
        });
      } else {
        console.error('Error saving penduduk:', error);
        toast({
          title: 'Gagal menyimpan data',
          description: error.message || 'Terjadi kesalahan saat menyimpan data penduduk',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const [showIndividualMoveDialog, setShowIndividualMoveDialog] = useState(false);
  const [newKKNumber, setNewKKNumber] = useState('');
  const [newStatusHubungan, setNewStatusHubungan] = useState('Anggota Keluarga');
  const [newGolonganDarah, setNewGolonganDarah] = useState('');
  const [newAgama, setNewAgama] = useState('');
  const [newStatusKawin, setNewStatusKawin] = useState('');
  const [newPendidikan, setNewPendidikan] = useState('');
  const [newPekerjaan, setNewPekerjaan] = useState('');
  
  const performUpdate = async (moveAllFamilyMembers = false, individualNoKK?: string, individualStatus?: string, 
    individualGolDarah?: string, individualAgama?: string, individualStatusKawin?: string, 
    individualPendidikan?: string, individualPekerjaan?: string) => {
    if (penduduk?.id) {
      // This is an UPDATE operation
      const originalDusun = penduduk.dusun;
      const dusunHasChanged = originalDusun !== formData.dusun;

      let error = null;

      if (dusunHasChanged) {
        if (moveAllFamilyMembers) {
          // Move all family members with the same KK to new dusun
          // First update all members of the same family with new dusun
          const { error: updateError } = await supabase
            .from('penduduk')
            .update({ dusun: formData.dusun })
            .eq('no_kk', penduduk.no_kk);

          if (updateError) {
            console.error('Error moving all family members:', updateError);
            throw new Error(`Gagal memindahkan semua anggota keluarga: ${updateError.message}`);
          }
          console.log('All family members moved to new dusun successfully.');
        } else {
          // Move only the current resident
          // If the user provided a new KK number for this individual
          const updateData: any = { dusun: formData.dusun };
          if (individualNoKK) {
            updateData.no_kk = individualNoKK;
          }
          if (individualStatus) {
            updateData.status_hubungan = individualStatus;
          }
          if (individualGolDarah) {
            updateData.golongan_darah = individualGolDarah;
          }
          if (individualAgama) {
            updateData.agama = individualAgama;
          }
          if (individualStatusKawin) {
            updateData.status_kawin = individualStatusKawin;
          }
          if (individualPendidikan) {
            updateData.pendidikan = individualPendidikan;
          }
          if (individualPekerjaan) {
            updateData.pekerjaan = individualPekerjaan;
          }
          
          console.log(`Moving individual with new data:`, updateData);
          const { error: updateError } = await supabase
            .from('penduduk')
            .update(updateData)
            .eq('id', penduduk.id);

          if (updateError) {
            console.error('Error moving individual resident:', updateError);
            throw new Error(`Gagal memindahkan dusun: ${updateError.message}`);
          }
          console.log('Individual resident moved successfully.');
        }
      } else if (individualNoKK || individualStatus || individualGolDarah || individualAgama || individualStatusKawin || individualPendidikan || individualPekerjaan) {
        // If dusun hasn't changed but we're changing other fields for individual
        const updateData: any = {};
        if (individualNoKK) updateData.no_kk = individualNoKK;
        if (individualStatus) updateData.status_hubungan = individualStatus;
        if (individualGolDarah) updateData.golongan_darah = individualGolDarah;
        if (individualAgama) updateData.agama = individualAgama;
        if (individualStatusKawin) updateData.status_kawin = individualStatusKawin;
        if (individualPendidikan) updateData.pendidikan = individualPendidikan;
        if (individualPekerjaan) updateData.pekerjaan = individualPekerjaan;
        
        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from('penduduk')
            .update(updateData)
            .eq('id', penduduk.id);
            
          if (updateError) {
            console.error('Error updating individual data:', updateError);
            throw new Error(`Gagal memperbarui data individu: ${updateError.message}`);
          }
          console.log('Individual data updated successfully.');
        }
      }

      // Update the rest of the form data (excluding fields that may have been handled separately)
      const dataToUpdate = { ...formData };
      delete (dataToUpdate as { dusun?: string }).dusun; // dusun already handled above
      
      // If we're changing fields separately, don't include them in this update
      if (individualNoKK) delete (dataToUpdate as { no_kk?: string }).no_kk;
      if (individualStatus) delete (dataToUpdate as { status_hubungan?: string }).status_hubungan;
      if (individualGolDarah) delete (dataToUpdate as { golongan_darah?: string }).golongan_darah;
      if (individualAgama) delete (dataToUpdate as { agama?: string }).agama;
      if (individualStatusKawin) delete (dataToUpdate as { status_kawin?: string }).status_kawin;
      if (individualPendidikan) delete (dataToUpdate as { pendidikan?: string }).pendidikan;
      if (individualPekerjaan) delete (dataToUpdate as { pekerjaan?: string }).pekerjaan;
      
      console.log('Updating remaining data:', dataToUpdate);
      if (Object.keys(dataToUpdate).length > 0) {
        const { error: updateError } = await supabase
          .from('penduduk')
          .update(dataToUpdate)
          .eq('id', penduduk.id);

        error = updateError;

        if (error) {
          console.error('Update error:', error);
          throw error;
        }
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
  };

  const handleMoveFamilyDecision = async (decision: 'yes' | 'no') => {
    setShowFamilyMoveDialog(false);
    
    if (decision === 'yes') {
      await performUpdate(true); // Move all family members
    } else {
      // If user selects 'no', they need to enter new KK and family status
      setShowIndividualMoveDialog(true); // Show dialog for individual move details
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
                maxLength={16}
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
              <Select required value={formData.jenis_kelamin} onValueChange={(value) => handleInputChange('jenis_kelamin', value)}>
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
              <Label htmlFor="tempat_lahir">Tempat Lahir *</Label>
              <Input
                id="tempat_lahir"
                value={formData.tempat_lahir}
                onChange={(e) => handleInputChange('tempat_lahir', e.target.value)}
                placeholder="Kota/Kabupaten tempat lahir"
                required
              />
            </div>
            <div>
              <Label htmlFor="tanggal_lahir">Tanggal Lahir *</Label>
              <Input
                id="tanggal_lahir"
                type="date"
                value={formData.tanggal_lahir}
                onChange={(e) => handleInputChange('tanggal_lahir', e.target.value)}
                required
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
                  <SelectItem value="-">Tidak Diketahui</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="agama">Agama *</Label>
              <Select required value={formData.agama} onValueChange={(value) => handleInputChange('agama', value)}>
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
              <Label htmlFor="status_kawin">Status Kawin *</Label>
              <Select required value={formData.status_kawin} onValueChange={(value) => handleInputChange('status_kawin', value)}>
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
              <Label htmlFor="status_hubungan">Status Hub. dalam Keluarga *</Label>
              <Select required value={formData.status_hubungan} onValueChange={(value) => handleInputChange('status_hubungan', value)}>
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
              <Label htmlFor="pendidikan">Pendidikan Terakhir *</Label>
              <Select required value={formData.pendidikan} onValueChange={(value) => handleInputChange('pendidikan', value)}>
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
              <Label htmlFor="pekerjaan">Pekerjaan *</Label>
              <Select required value={formData.pekerjaan} onValueChange={(value) => handleInputChange('pekerjaan', value)}>
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
              <Label htmlFor="nama_ibu">Nama Ibu *</Label>
              <Input
                id="nama_ibu"
                value={formData.nama_ibu}
                onChange={(e) => handleInputChange('nama_ibu', e.target.value)}
                placeholder="Nama lengkap ibu kandung"
                required
              />
            </div>
            <div>
              <Label htmlFor="nama_ayah">Nama Ayah *</Label>
              <Input
                id="nama_ayah"
                value={formData.nama_ayah}
                onChange={(e) => handleInputChange('nama_ayah', e.target.value)}
                placeholder="Nama lengkap ayah kandung"
                required
              />
            </div>
            <div>
              <Label htmlFor="nama_kep_kel">Nama Kepala Keluarga *</Label>
              <Input
                id="nama_kep_kel"
                value={formData.nama_kep_kel}
                onChange={(e) => handleInputChange('nama_kep_kel', e.target.value)}
                placeholder="Nama kepala keluarga"
                required
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
              <Label htmlFor="dusun">Dusun *</Label>
              <Select required value={formData.dusun} onValueChange={(value) => handleInputChange('dusun', value)}>
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
              <Label htmlFor="nama_prop">Provinsi *</Label>
              <Input
                id="nama_prop"
                value={formData.nama_prop}
                onChange={(e) => handleInputChange('nama_prop', e.target.value)}
                placeholder="Nama provinsi"
                required
              />
            </div>
            <div>
              <Label htmlFor="nama_kab">Kabupaten/Kota *</Label>
              <Input
                id="nama_kab"
                value={formData.nama_kab}
                onChange={(e) => handleInputChange('nama_kab', e.target.value)}
                placeholder="Nama kabupaten/kota"
                required
              />
            </div>
            <div>
              <Label htmlFor="nama_kec">Kecamatan *</Label>
              <Input
                id="nama_kec"
                value={formData.nama_kec}
                onChange={(e) => handleInputChange('nama_kec', e.target.value)}
                placeholder="Nama kecamatan"
                required
              />
            </div>
            <div>
              <Label htmlFor="nama_kel">Kelurahan/Desa *</Label>
              <Input
                id="nama_kel"
                value={formData.nama_kel}
                onChange={(e) => handleInputChange('nama_kel', e.target.value)}
                placeholder="Nama kelurahan/desa"
                required
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

      {/* Dialog for Family Move Decision */}
      <Dialog open={showFamilyMoveDialog} onOpenChange={setShowFamilyMoveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pemindahan Anggota Keluarga</DialogTitle>
            <DialogDescription>
              Terdapat {familyMembers.length} anggota keluarga lain dengan No. KK yang sama. Apakah Anda ingin memindahkan semua anggota keluarga ke dusun yang baru?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert>
              <AlertDescription className="text-sm">
                <div className="font-medium mb-2">Anggota Keluarga Terpengaruh:</div>
                <ul className="list-disc pl-5 space-y-1">
                  {familyMembers.map((member, index) => (
                    <li key={member.id || index}>{member.nama} ({member.status_hubungan})</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          </div>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => handleMoveFamilyDecision('no')}>
              Tidak, Pindahkan Individu Saja
            </Button>
            <Button onClick={() => handleMoveFamilyDecision('yes')}>
              Ya, Pindahkan Semua
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog for Individual Move Details (when user chooses not to move all family) */}
      <Dialog open={showIndividualMoveDialog} onOpenChange={setShowIndividualMoveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Data Baru untuk Individu</DialogTitle>
            <DialogDescription>
              Karena Anda memilih memindahkan individu saja, silakan masukkan data baru untuk anggota ini:
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4 max-h-96 overflow-y-auto">
            <div>
              <Label htmlFor="new_kk_number">Nomor Kartu Keluarga Baru</Label>
              <Input
                id="new_kk_number"
                value={newKKNumber}
                onChange={(e) => setNewKKNumber(e.target.value)}
                placeholder="Masukkan nomor KK baru"
                maxLength={16}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="new_status_hubungan">Status Hubungan dalam Keluarga</Label>
              <Select value={newStatusHubungan} onValueChange={setNewStatusHubungan}>
                <SelectTrigger id="new_status_hubungan" className="mt-1">
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
              <Label htmlFor="new_gol_darah">Golongan Darah</Label>
              <Select value={newGolonganDarah} onValueChange={setNewGolonganDarah}>
                <SelectTrigger id="new_gol_darah" className="mt-1">
                  <SelectValue placeholder="Pilih golongan darah" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="AB">AB</SelectItem>
                  <SelectItem value="O">O</SelectItem>
                  <SelectItem value="-">Tidak Diketahui</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="new_agama">Agama</Label>
              <Select value={newAgama} onValueChange={setNewAgama}>
                <SelectTrigger id="new_agama" className="mt-1">
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
              <Label htmlFor="new_status_kawin">Status Perkawinan</Label>
              <Select value={newStatusKawin} onValueChange={setNewStatusKawin}>
                <SelectTrigger id="new_status_kawin" className="mt-1">
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
              <Label htmlFor="new_pendidikan">Pendidikan Terakhir</Label>
              <Select value={newPendidikan} onValueChange={setNewPendidikan}>
                <SelectTrigger id="new_pendidikan" className="mt-1">
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
              <Label htmlFor="new_pekerjaan">Pekerjaan</Label>
              <Select value={newPekerjaan} onValueChange={setNewPekerjaan}>
                <SelectTrigger id="new_pekerjaan" className="mt-1">
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
            <Alert>
              <AlertDescription className="text-sm">
                Jika Anda tidak mengisi field-field di atas, individu ini akan mempertahankan data sebelumnya.
              </AlertDescription>
            </Alert>
          </div>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setShowIndividualMoveDialog(false)}>
              Batal
            </Button>
            <Button onClick={() => {
              // Validate new KK number if provided
              if (newKKNumber && newKKNumber.length !== 0 && newKKNumber.length !== 16) {
                toast({ 
                  title: 'Data tidak valid', 
                  description: 'No. KK harus terdiri dari 16 digit.', 
                  variant: 'destructive' 
                });
                return;
              }
              
              performUpdate(false, newKKNumber || undefined, newStatusHubungan, 
                newGolonganDarah || undefined, newAgama || undefined, newStatusKawin || undefined, 
                newPendidikan || undefined, newPekerjaan || undefined);
              setShowIndividualMoveDialog(false);
            }}>
              Simpan Perubahan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
};

export default PendudukForm;
