
export interface ImportError {
  row: number;
  column: string;
  value: string;
  error: string;
  nama?: string;
}

export const pekerjaanOptions = [
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

export const dusunOptions = [
  'Dusun I',
  'Dusun II', 
  'Dusun III',
  'Dusun IV',
  'Dusun Rambutan',
  'Dusun Kelapa',
  'Dusun Nangka',
  'Dusun Jambu',
  'Dusun Sawo',
  'Dusun Jeruk Nipis',
  'Dusun Sirsak',
  'Dusun Mangga',
  'Dusun Manggis',
  'Dusun Durian',
  'Tidak Diketahui'
];

export const validateData = (row: any, rowIndex: number): ImportError[] => {
  const errors: ImportError[] = [];
  
  console.log(`Validating row ${rowIndex + 2}:`, row);
  
  // Validasi RT - maksimal 2 karakter, abaikan jika "-" atau kosong
  if (row.rt && row.rt !== '-' && row.rt.toString().trim() !== '') {
    const rtValue = row.rt.toString().trim();
    if (rtValue.length > 2) {
      errors.push({
        row: rowIndex + 2,
        column: 'RT',
        value: rtValue,
        error: 'RT maksimal 2 karakter (contoh: 01, 02, 1, 2)',
        nama: row.nama
      });
    } else {
      // Format RT dengan leading zero jika perlu
      row.rt = rtValue.padStart(2, '0');
    }
  } else {
    // Jika RT adalah "-" atau kosong, set ke null
    row.rt = null;
  }
  
  // Validasi RW - maksimal 2 karakter, abaikan jika "-" atau kosong
  if (row.rw && row.rw !== '-' && row.rw.toString().trim() !== '') {
    const rwValue = row.rw.toString().trim();
    if (rwValue.length > 2) {
      errors.push({
        row: rowIndex + 2,
        column: 'RW', 
        value: rwValue,
        error: 'RW maksimal 2 karakter (contoh: 01, 02, 1, 2)',
        nama: row.nama
      });
    } else {
      // Format RW dengan leading zero jika perlu
      row.rw = rwValue.padStart(2, '0');
    }
  } else {
    // Jika RW adalah "-" atau kosong, set ke null
    row.rw = null;
  }
  
  // Validasi NIK - harus 16 digit
  if (row.nik) {
    const nikValue = row.nik.toString().trim();
    if (nikValue.length !== 16 || !/^\d{16}$/.test(nikValue)) {
      errors.push({
        row: rowIndex + 2,
        column: 'NIK',
        value: nikValue,
        error: 'NIK harus tepat 16 digit angka',
        nama: row.nama
      });
    }
  }
  
  // Validasi NO_KK - harus 16 digit
  if (row.no_kk) {
    const noKkValue = row.no_kk.toString().trim();
    if (noKkValue.length !== 16 || !/^\d{16}$/.test(noKkValue)) {
      errors.push({
        row: rowIndex + 2,
        column: 'NO_KK',
        value: noKkValue,
        error: 'NO_KK harus tepat 16 digit angka',
        nama: row.nama
      });
    }
  }
  
  // Validasi NAMA - wajib diisi
  if (!row.nama || row.nama.toString().trim() === '') {
    errors.push({
      row: rowIndex + 2,
      column: 'NAMA',
      value: row.nama || '',
      error: 'Nama wajib diisi',
      nama: row.nama
    });
  }
  
  console.log(`Row ${rowIndex + 2} validation errors:`, errors.length);
  return errors;
};

export const validatePendudukData = (data: any[]) => {
  const allErrors: ImportError[] = [];
  const validData: any[] = [];
  
  console.log(`Starting validation of ${data.length} rows`);
  
  data.forEach((row, index) => {
    const rowErrors = validateData(row, index);
    allErrors.push(...rowErrors);
    
    // Add to validData if no errors and has required fields
    if (rowErrors.length === 0 && row.nama) {
      validData.push(row);
    }
  });
  
  console.log(`Validation complete: ${validData.length} valid, ${allErrors.length} errors`);
  
  return {
    validData,
    validCount: validData.length,
    invalidCount: data.length - validData.length,
    errors: allErrors.map(error => error.error),
    totalProcessed: data.length
  };
};
