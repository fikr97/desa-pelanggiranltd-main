import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import PublicLayout from "@/components/PublicLayout";

const PrivacyPolicy = () => {
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
        <h1 className="text-3xl font-bold mb-6">Kebijakan Privasi</h1>
        
        <div className="prose max-w-none">
          <p className="mb-4 text-muted-foreground">
            Terakhir diperbarui: {new Date().toLocaleDateString('id-ID')}
          </p>
          
          <p className="mb-6">
            Kebijakan Privasi ini menjelaskan kebijakan dan prosedur kami mengenai pengumpulan, 
            penggunaan, dan pengungkapan informasi Anda saat Anda menggunakan layanan kami.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Informasi yang Kami Kumpulkan</h2>
          <h3 className="text-xl font-medium mt-4 mb-2">Informasi yang Anda Berikan</h3>
          <p className="mb-4">
            Kami dapat mengumpulkan informasi yang secara pribadi mengidentifikasi Anda, seperti:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Nama lengkap</li>
            <li>Alamat email</li>
            <li>Nomor telepon</li>
            <li>Informasi akun (username, password)</li>
            <li>Data penduduk (NIK, alamat, dll.)</li>
          </ul>

          <h3 className="text-xl font-medium mt-4 mb-2">Informasi yang Kami Kumpulkan Secara Otomatis</h3>
          <p className="mb-4">
            Saat Anda menggunakan layanan kami, kami secara otomatis mengumpulkan informasi tertentu:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Alamat IP</li>
            <li>Jenis browser dan versi</li>
            <li>Halaman yang Anda kunjungi</li>
            <li>Waktu dan tanggal akses</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Cara Kami Menggunakan Informasi Anda</h2>
          <p className="mb-4">
            Kami menggunakan informasi yang dikumpulkan untuk berbagai tujuan:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Menyediakan dan memelihara layanan kami</li>
            <li>Memberi tahu Anda tentang perubahan layanan</li>
            <li>Memungkinkan Anda berpartisipasi dalam fitur interaktif</li>
            <li>Menyediakan dukungan pelanggan</li>
            <li>Memantau penggunaan layanan kami</li>
            <li>Mendeteksi, mencegah, dan mengatasi masalah teknis</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Pengungkapan Informasi</h2>
          <p className="mb-4">
            Kami dapat membagikan informasi Anda dalam situasi tertentu:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Dengan penyedia layanan yang membantu kami dalam operasi bisnis</li>
            <li>Untuk mematuhi hukum atau menanggapi permintaan hukum</li>
            <li>Untuk melindungi hak, properti, atau keamanan kami dan pengguna</li>
            <li>Dengan persetujuan Anda yang jelas</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Keamanan Data</h2>
          <p className="mb-4">
            Kami menerapkan berbagai langkah keamanan untuk menjaga keamanan informasi pribadi Anda. 
            Ini termasuk enkripsi data, kontrol akses, dan audit keamanan rutin.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Hak Anda</h2>
          <p className="mb-4">
            Anda memiliki hak tertentu terkait data pribadi Anda:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Hak untuk mengakses informasi yang kami miliki tentang Anda</li>
            <li>Hak untuk memperbaiki informasi yang tidak akurat</li>
            <li>Hak untuk menghapus data pribadi Anda</li>
            <li>Hak untuk membatasi pemrosesan data Anda</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Perubahan Kebijakan Ini</h2>
          <p className="mb-4">
            Kami dapat memperbarui Kebijakan Privasi kami dari waktu ke waktu. Kami akan memberi tahu 
            Anda tentang perubahan apa pun dengan memposting kebijakan baru di halaman ini.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Hubungi Kami</h2>
          <p className="mb-4">
            Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini, silakan hubungi kami melalui:
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

export default PrivacyPolicy;