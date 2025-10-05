# Perubahan Frontend untuk Mode "Semua Data" Form Tugas

## File yang Dimodifikasi

### 1. `src/pages/FormDataEntry.tsx`
#### Perubahan Utama:
1. **Logika Query Dinamis**: Menambahkan deteksi mode form (`visibilitas_dusun = 'semua_data'`)
2. **Pemrosesan Data dengan RPC**: Menggunakan fungsi RPC `get_form_data_with_penduduk` ketika dalam mode 'semua_data'
3. **Transformasi Data**: Mengkonversi hasil dari fungsi RPC ke format yang diharapkan oleh komponen UI
4. **Update Data dengan RPC**: Menggunakan fungsi RPC `update_form_data_with_penduduk_check` untuk update data dalam mode 'semua_data'

#### Fungsi Utama yang Diubah:
- `useQuery` untuk mengambil data form dan penduduk
- `handleSave` untuk menyimpan/update data

### 2. `src/components/DataEntryForm.tsx`
Tidak perlu perubahan karena hanya menerima data melalui props dan mengirim hasil ke handler parent.

### 3. `src/components/ResidentSearchCombobox.tsx`
Tidak perlu perubahan karena menerima data penduduk melalui props.

## Logika Implementasi

### Deteksi Mode:
```javascript
const isAllDataMode = tempFormDef.visibilitas_dusun === 'semua_data';
```

### Pengambilan Data:
- **Mode Normal**: `SELECT *, penduduk(*) FROM form_tugas_data` (dibatasi oleh RLS)
- **Mode 'Semua Data'**: `RPC get_form_data_with_penduduk()` (akses penuh ke semua penduduk)

### Pengiriman Data:
- **Mode Normal**: `UPDATE/INSERT form_tugas_data` langsung
- **Mode 'Semua Data'**: `RPC update_form_data_with_penduduk_check()` dengan validasi akses

## Keuntungan Perubahan:
1. ✅ **Menghilangkan "N/A"** - Data penduduk muncul lengkap
2. ✅ **Update Berhasil** - Data bisa disimpan dan diedit
3. ✅ **Keamanan Tetap Terjaga** - Validasi akses di server side
4. ✅ **Transparan untuk Pengguna** - Tidak ada perubahan UX untuk user
5. ✅ **Kompatibel dengan Fitur Lain** - Tidak mempengaruhi form lain

## Pengujian:
- [x] Mode 'semua_data' dengan kadus - ✅ Berhasil
- [x] Mode 'tertentu' dengan kadus - ✅ Berhasil  
- [x] Mode 'semua' dengan kadus/admin - ✅ Berhasil
- [x] Update data dalam mode 'semua_data' - ✅ Berhasil
- [x] Tampilan data penduduk - ✅ Tidak ada lagi "N/A"