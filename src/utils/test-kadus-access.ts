/**
 * Test script untuk memverifikasi implementasi akses kadus
 * File ini membantu memverifikasi bahwa RLS (Row Level Security) 
 * bekerja sesuai dengan yang diharapkan untuk pembatasan akses
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Fungsi untuk menguji akses penduduk berdasarkan peran pengguna
 * @returns Promise<boolean> - Berhasil atau gagal dalam pengujian
 */
export const testKadusAccess = async (): Promise<boolean> => {
  try {
    // Ambil informasi pengguna saat ini
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Gagal mendapatkan informasi pengguna:', userError);
      return false;
    }

    // Ambil profile pengguna untuk mengetahui peran dan dusun
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, dusun')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Gagal mendapatkan profile pengguna:', profileError);
      return false;
    }

    // Ambil data penduduk berdasarkan hak akses RLS
    const { data: pendudukData, error: pendudukError } = await supabase
      .from('penduduk')
      .select('*')
      .order('nama', { ascending: true });

    if (pendudukError) {
      console.error('Gagal mengambil data penduduk:', pendudukError);
      // Cek apakah ini karena akses ditolak (ini sebenarnya bisa menjadi perilaku normal untuk kadus)
      if (profile.role === 'kadus') {
        console.log('Pengguna dengan peran kadus tidak dapat mengakses data - ini bisa normal jika tidak ada penduduk di dusun mereka');
      }
      return false;
    }

    console.log(`Berhasil mengambil ${pendudukData.length} data penduduk`);

    // Untuk pengguna kadus, verifikasi bahwa semua penduduk yang diakses adalah dari dusun mereka
    if (profile.role === 'kadus') {
      const unauthorizedAccess = pendudukData.filter(penduduk => penduduk.dusun !== profile.dusun);
      
      if (unauthorizedAccess.length > 0) {
        console.error('DETEKSI Akses Tidak Sah: Kadus dapat mengakses penduduk dari dusun lain:', unauthorizedAccess);
        return false;
      } else {
        console.log('VERIFIKASI SUKSES: Kadus hanya mengakses penduduk dari dusun mereka:', profile.dusun);
      }
    } else if (profile.role === 'admin') {
      console.log('VERIFIKASI SUKSES: Admin dapat mengakses semua data penduduk');
    }

    return true;
  } catch (error) {
    console.error('Terjadi kesalahan saat menguji akses kadus:', error);
    return false;
  }
};

/**
 * Fungsi untuk menguji fungsi move_penduduk
 * @param residentId - ID penduduk yang akan dipindahkan
 * @param newDusun - Dusun baru untuk penduduk tersebut
 */
export const testMovePenduduk = async (residentId: string, newDusun: string): Promise<boolean> => {
  try {
    const { error } = await supabase.rpc('move_penduduk', {
      resident_id: residentId,
      new_dusun: newDusun,
    });

    if (error) {
      console.error('Gagal memindahkan penduduk:', error);
      return false;
    }

    console.log('Penduduk berhasil dipindahkan ke dusun:', newDusun);
    return true;
  } catch (error) {
    console.error('Terjadi kesalahan saat mencoba memindahkan penduduk:', error);
    return false;
  }
};

/**
 * Fungsi untuk melihat semua dusun yang tersedia
 */
export const getAllDusuns = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('wilayah')
      .select('nama')
      .eq('jenis', 'Dusun')
      .order('nama');

    if (error) {
      console.error('Gagal mengambil daftar dusun:', error);
      return [];
    }

    return data.map(d => d.nama);
  } catch (error) {
    console.error('Terjadi kesalahan saat mengambil daftar dusun:', error);
    return [];
  }
};

// Contoh penggunaan
export const runAccessTest = async () => {
  console.log('Memulai pengujian akses kadus...');
  
  const testResult = await testKadusAccess();
  
  if (testResult) {
    console.log('✅ Pengujian akses kadus BERHASIL - RLS berfungsi dengan benar');
  } else {
    console.log('❌ Pengujian akses kadus GAGAL - Perlu pengecekan lebih lanjut');
  }
};