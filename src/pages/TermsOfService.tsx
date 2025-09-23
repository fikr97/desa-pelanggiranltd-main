import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import PublicLayout from "@/components/PublicLayout";

const TermsOfService = () => {
  const { data: infoDesa } = useQuery({
    queryKey: ['info-desa-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('info_desa')
        .select('email, telepon, alamat_kantor')
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching village info:', error);
        return { email: null, telepon: null, alamat_kantor: null };
      }
      
      return data || { email: null, telepon: null, alamat_kantor: null };
    }
  });

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Syarat dan Ketentuan</h1>
        
        <div className="prose max-w-none">
          <p className="mb-4 text-muted-foreground">
            Terakhir diperbarui: {new Date().toLocaleDateString('id-ID')}
          </p>
          
          <p className="mb-6">
            Selamat datang di Sistem Informasi Desa. Dengan mengakses atau menggunakan layanan kami, 
            Anda setuju untuk terikat oleh syarat dan ketentuan berikut ini.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Penerimaan Syarat</h2>
          <p className="mb-4">
            Dengan mengakses atau menggunakan layanan Sistem Informasi Desa, Anda setuju untuk terikat 
            oleh Syarat dan Ketentuan ini, semua peraturan, dan kebijakan yang berlaku. Jika Anda tidak 
            setuju dengan bagian apa pun dari syarat-syarat ini, Anda tidak boleh menggunakan layanan kami.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Penggunaan Layanan</h2>
          <p className="mb-4">
            Anda setuju untuk menggunakan layanan ini hanya untuk tujuan yang sah dan sesuai dengan 
            peraturan perundang-undangan yang berlaku. Anda tidak boleh:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Menyalahgunakan sistem atau layanan</li>
            <li>Mengunggah konten yang melanggar hukum</li>
            <li>Melakukan tindakan yang dapat merusak sistem</li>
            <li>Mengakses data tanpa izin</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Akun Pengguna</h2>
          <p className="mb-4">
            Untuk mengakses fitur tertentu, Anda mungkin diminta untuk membuat akun. Anda bertanggung 
            jawab penuh atas keamanan akun Anda dan semua aktivitas yang terjadi di bawah akun tersebut.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Hak Kekayaan Intelektual</h2>
          <p className="mb-4">
            Semua konten, fitur, dan fungsionalitas pada Sistem Informasi Desa adalah milik kami 
            atau pemberi lisensi kami dan dilindungi oleh undang-undang hak cipta, merek dagang, 
            dan hak kekayaan intelektual lainnya.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Batasan Tanggung Jawab</h2>
          <p className="mb-4">
            Kami tidak bertanggung jawab atas kerugian tidak langsung, insidental, khusus, konsekuensial 
            atau hukuman yang timbul dari penggunaan layanan kami.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Perubahan Syarat</h2>
          <p className="mb-4">
            Kami berhak untuk memperbarui atau mengubah Syarat dan Ketentuan ini kapan saja. 
            Perubahan akan berlaku segera setelah diposting di situs web ini.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Hubungi Kami</h2>
          <p className="mb-4">
            Jika Anda memiliki pertanyaan tentang Syarat dan Ketentuan ini, silakan hubungi kami melalui:
          </p>
          <div className="bg-muted p-4 rounded-lg">
            {infoDesa?.email && (
              <p><strong>Email:</strong> {infoDesa.email}</p>
            )}
            {infoDesa?.telepon && (
              <p><strong>Telepon:</strong> {infoDesa.telepon}</p>
            )}
            {infoDesa?.alamat_kantor && (
              <p><strong>Alamat:</strong> {infoDesa.alamat_kantor}</p>
            )}
            {!infoDesa?.email && !infoDesa?.telepon && !infoDesa?.alamat_kantor && (
              <p>Informasi kontak belum tersedia. Silakan hubungi kantor desa secara langsung.</p>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default TermsOfService;