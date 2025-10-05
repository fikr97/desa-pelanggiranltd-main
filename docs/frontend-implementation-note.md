# Panduan Penting: Implementasi Frontend untuk Mode "Semua Data"

## Masalah Umum
Ketika migrasi database selesai, terkadang masih muncul:
- Kolom data penduduk menampilkan "N/A" 
- Proses update data gagal
- Form tidak menampilkan data penduduk dengan benar

## Penyebab
Ini terjadi karena aplikasi frontend masih menggunakan query langsung:
```javascript
supabase.from('form_tugas_data').select('*, penduduk(*)')
```

Dalam mode 'semua_data', query ini masih dibatasi oleh RLS penduduk, sehingga kolom-kolom penduduk tidak bisa diakses dan muncul sebagai "N/A".

## Solusi
Harus menggunakan fungsi RPC khusus dalam mode 'semua_data':

### 1. Pengambilan Data (FormDataEntry.tsx)
```javascript
if (form.visibilitas_dusun === 'semua_data') {
  const { data } = await supabase.rpc('get_form_data_with_penduduk', { p_form_id: formId });
} else {
  const { data } = await supabase.from('form_tugas_data').select('*, penduduk(*)');
}
```

### 2. Pengisian Dropdown Penduduk (DataEntryForm.tsx)
```javascript
if (formDef?.visibilitas_dusun === 'semua_data') {
  // Ambil data dari RPC agar mendapatkan semua penduduk
  const result = await supabase.rpc('get_form_data_with_penduduk', { p_form_id: formId });
  const residents = [...new Set(result.data.map(item => ({
    id: item.penduduk_id,
    nama: item.penduduk_nama,
    dusun: item.penduduk_dusun,
    // ... field lain
  })))];
} else {
  // Mode normal
  const { data: residents } = await supabase.from('penduduk').select('*');
}
```

### 3. Proses Update
```javascript
if (form.visibilitas_dusun === 'semua_data') {
  const { data } = await supabase.rpc('update_form_data_with_penduduk_check', {
    p_form_data_id: id,
    p_form_id: formId,
    p_penduduk_id: pendudukId,
    p_data_custom: newData
  });
} else {
  await supabase.from('form_tugas_data').update(newData).eq('id', id);
}
```

## Kesimpulan
**Tanpa modifikasi frontend ini, fitur mode "Semua Data" tidak akan berfungsi sepenuhnya** meskipun migrasi database sudah benar.