# Panduan Lengkap: Perbaikan Akses Form Tugas dan Data Penduduk (Versi Aman)

## Masalah
1. Dalam mode "Kadus Bisa Lihat & Isi Semua Data", kolom data penduduk muncul "N/A"
2. Kadus tidak bisa menyimpan perubahan data dalam form dengan mode tersebut
3. Error "infinite recursion" pada RLS penduduk

## Solusi Komprehensif (Aman - TANPA Recursion)

### 1. Migrasi Database (3 file utama dalam urutan ini):
- `20251005170000_fix_penduduk_recursion_error.sql` - **Perbaikan error recursion**
- `20251005163000_all_data_access_form_visibility.sql` - Migrasi utama 3 mode form
- `20251005165000_comprehensive_form_penduduk_functions.sql` - Fungsi pendukung untuk form

### 2. Migrasi RLS Penduduk (Migrasi Terpenting)
Kebijakan RLS pada tabel `penduduk` dimodifikasi agar memungkinkan akses untuk:

```sql
CREATE POLICY "Allow penduduk access based on form_tugas_data access"
ON public.penduduk FOR SELECT
TO authenticated
USING (
  -- Admin bisa akses semua
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- Kadus bisa akses penduduk dari dusun mereka (untuk operasi normal)
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND penduduk.dusun = (SELECT dusun FROM public.profiles WHERE user_id = auth.uid())
  )
  OR
  -- Kadus bisa akses penduduk jika penduduk ini terkait dengan form_tugas_data 
  -- dalam form_tugas dengan mode 'semua_data' YANG BISA DIAKSES OLEH USER
  EXISTS (
    SELECT 1 
    FROM form_tugas_data ftd
    JOIN form_tugas ft ON ftd.form_tugas_id = ft.id
    WHERE ftd.penduduk_id = penduduk.id
    AND (
      -- Form dalam mode 'semua_data' dan user adalah kadus
      (ft.visibilitas_dusun = 'semua_data' AND (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus')
    )
  )
);
```

### 3. Fungsi-Fungsi Pendukung
- `get_form_data_with_penduduk(form_id)` - Mengambil data form lengkap dengan data penduduk terkait
- `update_form_data_with_penduduk_check(...)` - Memvalidasi dan mengupdate data form dengan cek akses

### 4. Implementasi Frontend (PEMBARUAN PENTING)
Untuk sepenuhnya menyelesaikan masalah "N/A" dan update data, modifikasi berikut DIPERLUKAN di sisi frontend:

#### A. FormDataEntry.tsx
Harus diganti untuk menggunakan fungsi RPC khusus untuk mode 'semua_data':
```typescript
// Di dalam useQuery untuk mengambil data
const { data, isLoading } = useQuery({
  queryKey: ['form_data_with_penduduk', formId],
  queryFn: async () => {
    if (formDef?.visibilitas_dusun === 'semua_data') {
      // KUNCI: Gunakan fungsi RPC untuk form dengan mode 'semua_data'
      // Ini menghindari pembatasan RLS dan memberikan data penduduk lengkap
      const { data, error } = await supabase
        .rpc('get_form_data_with_penduduk', { p_form_id: formId });
      if (error) throw error;
      return data;
    } else {
      // Gunakan query standar untuk mode lain
      const { data, error } = await supabase
        .from('form_tugas_data')
        .select('*, penduduk(*)')
        .eq('form_tugas_id', formId)
        .order('created_at');
      if (error) throw error;
      return data;
    }
  }
});
```

#### B. DataEntryForm.tsx  
Juga harus dimodifikasi untuk menyediakan data penduduk saat dropdown atau autocomplete:
```typescript
const loadResidents = async (formId) => {
  try {
    const { data: formData, error: formError } = await supabase
      .from('form_tugas')
      .select('visibilitas_dusun')
      .eq('id', formId)
      .single();
    
    if (formError) throw formError;

    if (formData.visibilitas_dusun === 'semua_data') {
      // Gunakan RPC untuk mengambil semua penduduk dalam mode ini
      const { data, error } = await supabase
        .rpc('get_form_data_with_penduduk', { p_form_id: formId });
      if (error) throw error;
      
      // Konversi data ke format yang diharapkan
      const uniqueResidents = [...new Map(
        data.map(item => [item.penduduk_id, {
          id: item.penduduk_id,
          nama: item.penduduk_nama,
          nik: item.penduduk_nik,
          dusun: item.penduduk_dusun,
          // tambahkan field lain sesuai kebutuhan
        }])
      ).values()];
      
      return uniqueResidents;
    } else {
      // Gunakan query biasa untuk mode lain
      const { data, error } = await supabase
        .from('penduduk')
        .select('*')
        .order('nama');
      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('Error loading residents:', error);
    throw error;
  }
};
```

#### C. Proses Update
Gunakan fungsi RPC untuk update jika dalam mode 'semua_data':
```typescript
const handleSave = async (formData) => {
  if (formDef?.visibilitas_dusun === 'semua_data') {
    // Gunakan fungsi update khusus untuk mode 'semua_data'
    const { data, error } = await supabase.rpc('update_form_data_with_penduduk_check', {
      p_form_data_id: entryId,
      p_form_id: formId,
      p_penduduk_id: formData.penduduk_id,
      p_data_custom: formData.data_custom
    });
    
    if (error) throw error;
    return data;
  } else {
    // Gunakan update biasa untuk mode lain
    const { error } = await supabase
      .from('form_tugas_data')
      .update(formData)
      .eq('id', entryId);
    if (error) throw error;
  }
};
```

#### B. DataEntryForm.tsx
Sama halnya, pastikan form juga menyesuaikan akses data penduduk tergantung mode form.

### 5. Pengujian
1. Jalankan semua migrasi di atas
2. Buat form dengan mode "Kadus Bisa Lihat & Isi Semua Data"
3. Login sebagai kadus dan akses form
4. Pastikan data penduduk muncul dengan benar (bukan "N/A")
5. Coba edit dan simpan data, harus berhasil

### 6. Catatan Penting
- Solusi ini menjaga keamanan untuk fitur lain
- RLS tetap aktif untuk mencegah akses tidak sah
- Solusi fokus pada konteks form_tugas spesifik
- Tetap harus memodifikasi frontend untuk hasil optimal