
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';

const DownloadTemplateButton = () => {
  const { toast } = useToast();

  const handleDownloadTemplate = () => {
    try {
      console.log('Creating Excel template for import...');
      
      // Template data dengan header dan contoh data
      const templateData = [
        {
          'No. KK': '1234567890123456',
          'NIK': '1234567890123456',
          'Nama': 'Contoh Nama',
          'Jenis Kelamin': 'Laki-laki',
          'Tempat Lahir': 'Jakarta',
          'Tanggal Lahir': '1990-01-01',
          'Golongan Darah': 'A',
          'Agama': 'Islam',
          'Status Kawin': 'Belum Kawin',
          'Status Hubungan': 'Kepala Keluarga',
          'Pendidikan': 'SMA',
          'Pekerjaan': 'Pegawai Swasta',
          'Nama Ibu': 'Nama Ibu Kandung',
          'Nama Ayah': 'Nama Ayah Kandung',
          'RT': '001',
          'RW': '001',
          'Dusun': 'Dusun 1',
          'Alamat Lengkap': 'Jl. Contoh No. 123'
        }
      ];

      // Membuat workbook dan worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(templateData);

      // Menambahkan sheet petunjuk pengisian
      const petunjukData = [
        ['PETUNJUK PENGISIAN TEMPLATE IMPORT DATA PENDUDUK'],
        [''],
        ['1. Isi data sesuai dengan kolom yang tersedia'],
        ['2. Format tanggal: YYYY-MM-DD (contoh: 1990-01-01)'],
        ['3. Jenis Kelamin: Laki-laki atau Perempuan'],
        ['4. Agama: Islam, Kristen, Katolik, Hindu, Buddha, Konghucu'],
        ['5. Status Kawin: Belum Kawin, Kawin, Cerai Hidup, Cerai Mati'],
        ['6. Status Hubungan: Kepala Keluarga, Istri, Anak, Menantu, Cucu, Orang Tua, Mertua, Famili Lain, Pembantu, Lainnya'],
        ['7. Pendidikan: Tidak/Belum Sekolah, Belum Tamat SD/Sederajat, Tamat SD/Sederajat, SLTP/Sederajat, SLTA/Sederajat, Diploma I/II, Akademi/Diploma III/S.Muda, Diploma IV/Strata I, Strata II, Strata III'],
        ['8. Golongan Darah: A, B, AB, O, Tidak Tahu'],
        ['9. Hapus baris contoh data sebelum mengisi data sebenarnya'],
        ['10. Pastikan semua data yang wajib diisi sudah terisi'],
        [''],
        ['KOLOM WAJIB DIISI:'],
        ['- NIK (16 digit)'],
        ['- Nama'],
        ['- Jenis Kelamin'],
        [''],
        ['KOLOM OPSIONAL:'],
        ['- Semua kolom lainnya bisa dikosongkan jika tidak ada data']
      ];

      const wsPetunjuk = XLSX.utils.aoa_to_sheet(petunjukData);

      // Menambahkan sheet ke workbook
      XLSX.utils.book_append_sheet(wb, wsPetunjuk, 'Petunjuk Pengisian');
      XLSX.utils.book_append_sheet(wb, ws, 'Template Data Penduduk');

      // Mengatur lebar kolom
      const colWidths = [
        { wch: 20 }, // No. KK
        { wch: 20 }, // NIK
        { wch: 25 }, // Nama
        { wch: 15 }, // Jenis Kelamin
        { wch: 20 }, // Tempat Lahir
        { wch: 15 }, // Tanggal Lahir
        { wch: 15 }, // Golongan Darah
        { wch: 15 }, // Agama
        { wch: 15 }, // Status Kawin
        { wch: 20 }, // Status Hubungan
        { wch: 20 }, // Pendidikan
        { wch: 25 }, // Pekerjaan
        { wch: 25 }, // Nama Ibu
        { wch: 25 }, // Nama Ayah
        { wch: 5 },  // RT
        { wch: 5 },  // RW
        { wch: 15 }, // Dusun
        { wch: 40 }  // Alamat Lengkap
      ];

      ws['!cols'] = colWidths;
      wsPetunjuk['!cols'] = [{ wch: 80 }];

      // Generate file dan download
      const fileName = `Template_Import_Data_Penduduk_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({
        title: 'Template berhasil diunduh',
        description: `File ${fileName} telah diunduh. Silakan isi data sesuai petunjuk yang tersedia.`,
      });

      console.log('Template Excel downloaded successfully');
    } catch (error) {
      console.error('Error creating template:', error);
      toast({
        title: 'Gagal mengunduh template',
        description: 'Terjadi kesalahan saat membuat template Excel',
        variant: 'destructive',
      });
    }
  };

  return (
    <Button 
      onClick={handleDownloadTemplate}
      variant="outline" 
      size="sm" 
      className="flex items-center gap-2"
    >
      <Download className="h-4 w-4" />
      <span>Unduh Template</span>
    </Button>
  );
};

export default DownloadTemplateButton;
