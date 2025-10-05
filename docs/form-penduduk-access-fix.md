# Perbaikan Akses Data Penduduk dalam Form Tugas

## Masalah
Ketika menggunakan mode "Kadus Bisa Lihat & Isi Semua Data", data penduduk dalam form muncul sebagai "N/A" karena RLS penduduk yang membatasi akses.

## Solusi
Menggunakan fungsi RPC khusus untuk mengambil data penduduk dalam konteks form.

## Migrasi Database
Jalankan: `20251005164400_rpc_penduduk_for_form.sql`

Fungsi ini menyediakan endpoint untuk mengambil data penduduk dengan aturan akses yang menyesuaikan dengan mode form.

## Perubahan Frontend yang Diperlukan

### 1. Modifikasi DataEntryForm.tsx
Ubah bagian yang mengambil data penduduk untuk menggunakan fungsi RPC ketika dalam mode 'semua_data':

```typescript
// Dapatkan ID form dari konteks
const getResidentsForForm = async (formId: string) => {
  try {
    // Periksa apakah form dalam mode 'semua_data' dengan mengambil info form
    const { data: formData, error: formError } = await supabase
      .from('form_tugas')
      .select('visibilitas_dusun')
      .eq('id', formId)
      .single();

    if (formError) throw formError;

    if (formData.visibilitas_dusun === 'semua_data') {
      // Gunakan fungsi RPC untuk mengambil semua penduduk
      const { data, error } = await supabase.rpc('get_penduduk_for_form', {
        p_form_id: formId
      });

      if (error) throw error;
      return data;
    } else {
      // Gunakan query biasa yang dibatasi oleh RLS
      const { data, error } = await supabase
        .from('penduduk')
        .select('*')
        .order('nama');
        
      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('Error fetching residents for form:', error);
    throw error;
  }
};
```

### 2. Gunakan fungsi ini dalam komponen
Ganti pemanggilan query langsung ke `penduduk` dalam DataEntryForm.tsx dengan pemanggilan fungsi di atas.

## Pengujian
1. Buat form dengan mode "Kadus Bisa Lihat & Isi Semua Data"
2. Login sebagai kadus
3. Akses form tersebut
4. Pastikan field-field dari data penduduk muncul dengan benar (bukan "N/A")

## Catatan
- Fungsi ini tetap memperhatikan keamanan dan hanya memberikan akses sesuai role dan mode form
- Ini adalah pendekatan yang lebih fleksibel daripada mencoba memodifikasi RLS penduduk secara global
- Tetap menjaga RLS penduduk untuk fitur-fitur lain yang tidak terkait dengan form_tugas