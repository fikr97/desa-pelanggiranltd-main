import * as XLSX from 'xlsx';
import { ImportError, pekerjaanOptions, dusunOptions, validateData } from './importValidation';

// Fungsi untuk normalisasi data
const normalizeJenisKelamin = (value: string): string => {
  const cleanValue = value.toLowerCase().trim();
  if (cleanValue.includes('laki')) return 'Laki-laki';
  if (cleanValue.includes('perempuan') || cleanValue.includes('wanita')) return 'Perempuan';
  return value; // kembalikan nilai asli jika tidak cocok
};

const normalizeAgama = (value: string): string => {
  const cleanValue = value.toLowerCase().trim();
  if (cleanValue === 'islam') return 'Islam';
  if (cleanValue === 'kristen') return 'Kristen';
  if (cleanValue === 'katolik') return 'Katolik';
  if (cleanValue === 'hindu') return 'Hindu';
  if (cleanValue === 'buddha') return 'Buddha';
  if (cleanValue === 'konghucu') return 'Konghucu';
  return value;
};

const normalizeStatusKawin = (value: string): string => {
  const cleanValue = value.toLowerCase().trim();
  if (cleanValue.includes('belum') && cleanValue.includes('kawin')) return 'Belum Kawin';
  if (cleanValue === 'kawin') return 'Kawin';
  if (cleanValue.includes('cerai') && cleanValue.includes('hidup')) return 'Cerai Hidup';
  if (cleanValue.includes('cerai') && cleanValue.includes('mati')) return 'Cerai Mati';
  return value;
};

const normalizePekerjaan = (value: string): string => {
  if (!value) return '';
  
  const cleanValue = value.toLowerCase().trim();
  
  // Mapping untuk pekerjaan yang sering salah format
  const mappings: { [key: string]: string } = {
    'belum / tidak bekerja': 'Belum/Tidak Bekerja',
    'belum/ tidak bekerja': 'Belum/Tidak Bekerja',
    'belum /tidak bekerja': 'Belum/Tidak Bekerja',
    'belum/tidak bekerja': 'Belum/Tidak Bekerja',
    'pelajar / mahasiswa': 'Pelajar/Mahasiswa',
    'pelajar/ mahasiswa': 'Pelajar/Mahasiswa',
    'pelajar /mahasiswa': 'Pelajar/Mahasiswa',
    'pelajar/mahasiswa': 'Pelajar/Mahasiswa',
    'petani / pekebun': 'Petani/Pekebun',
    'petani/ pekebun': 'Petani/Pekebun',
    'petani /pekebun': 'Petani/Pekebun',
    'petani/pekebun': 'Petani/Pekebun',
    'nelayan / perikanan': 'Nelayan/Perikanan',
    'nelayan/ perikanan': 'Nelayan/Perikanan',
    'nelayan /perikanan': 'Nelayan/Perikanan',
    'nelayan/perikanan': 'Nelayan/Perikanan',
    'buruh tani / perkebunan': 'Buruh Tani/Perkebunan',
    'buruh tani/ perkebunan': 'Buruh Tani/Perkebunan',
    'buruh tani /perkebunan': 'Buruh Tani/Perkebunan',
    'buruh tani/perkebunan': 'Buruh Tani/Perkebunan',
    'buruh nelayan / perikanan': 'Buruh Nelayan/Perikanan',
    'buruh nelayan/ perikanan': 'Buruh Nelayan/Perikanan',
    'buruh nelayan /perikanan': 'Buruh Nelayan/Perikanan',
    'buruh nelayan/perikanan': 'Buruh Nelayan/Perikanan',
    'tukang las / pandai besi': 'Tukang Las/Pandai Besi',
    'tukang las/ pandai besi': 'Tukang Las/Pandai Besi',
    'tukang las /pandai besi': 'Tukang Las/Pandai Besi',
    'tukang las/pandai besi': 'Tukang Las/Pandai Besi',
    'ustadz / mubaligh': 'Ustadz/Mubaligh',
    'ustadz/ mubaligh': 'Ustadz/Mubaligh',
    'ustadz /mubaligh': 'Ustadz/Mubaligh',
    'ustadz/mubaligh': 'Ustadz/Mubaligh',
    'anggota dprd kabupaten / kota': 'Anggota DPRD Kabupaten/Kota',
    'anggota dprd kabupaten/ kota': 'Anggota DPRD Kabupaten/Kota',
    'anggota dprd kabupaten /kota': 'Anggota DPRD Kabupaten/Kota',
    'anggota dprd kabupaten/kota': 'Anggota DPRD Kabupaten/Kota',
    'psikiater / psikolog': 'Psikiater/Psikolog',
    'psikiater/ psikolog': 'Psikiater/Psikolog',
    'psikiater /psikolog': 'Psikiater/Psikolog',
    'psikiater/psikolog': 'Psikiater/Psikolog',
    'anggota kabinet / kementerian': 'Anggota Kabinet/Kementerian',
    'anggota kabinet/ kementerian': 'Anggota Kabinet/Kementerian',
    'anggota kabinet /kementerian': 'Anggota Kabinet/Kementerian',
    'anggota kabinet/kementerian': 'Anggota Kabinet/Kementerian'
  };

  // Cek mapping langsung
  if (mappings[cleanValue]) {
    return mappings[cleanValue];
  }

  // Cari yang paling cocok dari daftar pekerjaan
  const matchedPekerjaan = pekerjaanOptions.find(option => 
    option.toLowerCase() === cleanValue ||
    option.toLowerCase().includes(cleanValue) || 
    cleanValue.includes(option.toLowerCase())
  );

  return matchedPekerjaan || value;
};

const normalizeDusun = (value: string): string => {
  if (!value) return '';
  
  const cleanValue = value.trim();
  
  // Exact match first - ini yang paling penting untuk menghindari false positive
  const exactMatch = dusunOptions.find(option => 
    option.toLowerCase() === cleanValue.toLowerCase()
  );
  
  if (exactMatch) {
    return exactMatch;
  }
  
  // Jika tidak ada exact match, coba pattern matching yang lebih spesifik
  // Handle "Dusun" + Roman numerals secara khusus
  const dusunPattern = /^dusun\s+(i{1,3}|iv|v|vi{0,3}|ix|x)$/i;
  const match = cleanValue.toLowerCase().match(dusunPattern);
  
  if (match) {
    const romanNum = match[1].toUpperCase();
    const targetDusun = `Dusun ${romanNum}`;
    
    // Cek apakah ada di daftar opsi
    const foundDusun = dusunOptions.find(option => 
      option.toLowerCase() === targetDusun.toLowerCase()
    );
    
    if (foundDusun) {
      return foundDusun;
    }
  }
  
  // Fallback: return original value jika tidak cocok dengan pattern apapun
  return cleanValue;
};

export const createExcelTemplate = () => {
  const headers = [
    'NO_KK', 'NIK', 'NAMA', 'JENIS_KELAMIN', 'TMPT_LHR', 'TGL_LHR', 
    'GOLONGAN_DARAH', 'AGAMA', 'STATUS_KAWIN', 'SHDK', 'PDDK_AKHIR', 
    'PEKERJAAN', 'NAMA_IBU', 'NAMA_AYAH', 'RT', 'RW', 'DUSUN',
    'NAMA_KEP_KEL', 'ALAMAT_LENGKAP', 'NAMA_PROP', 'NAMA_KAB', 'NAMA_KEC', 'NAMA_KEL'
  ];
  
  const exampleRow = [
    '1234567890123456', '1234567890123456', 'Contoh Nama', 'Laki-laki', 'Jakarta', '1990-01-01',
    'A', 'Islam', 'Kawin', 'Kepala Keluarga', 'SLTA/Sederajat',
    'Petani/Pekebun', 'Nama Ibu', 'Nama Ayah', '01', '01', 'Dusun I',
    'Nama Kepala Keluarga', 'Jl. Contoh No. 1 RT 01 RW 01', 'Sumatera Utara', 'Batu Bara', 'Laut Tador', 'Pelanggiran Laut Tador'
  ];
  
  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const wsData = [headers, exampleRow];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Template Penduduk');
  
  // Save file
  XLSX.writeFile(wb, 'template_penduduk.xlsx');
};

export const parseExcelFile = async (file: File): Promise<{ data: any[], errors: ImportError[] }> => {
  return new Promise<{ data: any[], errors: ImportError[] }>((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first worksheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length === 0) {
          resolve({ data: [], errors: [] });
          return;
        }
        
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1) as any[][];
        const parsedData = [];
        const allErrors: ImportError[] = [];

        console.log('Headers found:', headers);
        console.log('Total rows to process:', rows.length);

        for (let i = 0; i < rows.length; i++) {
          const rowData = rows[i];
          if (!rowData || rowData.length === 0 || !rowData.some(cell => cell !== undefined && cell !== '')) {
            continue;
          }
          
          const row: any = {};
          
          headers.forEach((header, index) => {
            const value = rowData[index] || '';
            const cleanValue = value.toString().trim();
            
            switch (header) {
              case 'NO_KK':
                row.no_kk = cleanValue || null;
                break;
              case 'NIK':
                row.nik = cleanValue;
                break;
              case 'NAMA':
                row.nama = cleanValue;
                break;
              case 'JENIS_KELAMIN':
                row.jenis_kelamin = normalizeJenisKelamin(cleanValue);
                break;
              case 'TMPT_LHR':
                row.tempat_lahir = cleanValue;
                break;
              case 'TGL_LHR':
                if (cleanValue) {
                  try {
                    let date;
                    if (typeof value === 'number') {
                      // Excel date number
                      date = XLSX.SSF.parse_date_code(value);
                      row.tanggal_lahir = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
                    } else {
                      date = new Date(cleanValue);
                      if (!isNaN(date.getTime())) {
                        row.tanggal_lahir = date.toISOString().split('T')[0];
                      }
                    }
                  } catch (e) {
                    console.warn('Invalid date format:', cleanValue);
                  }
                }
                break;
              case 'GOLONGAN_DARAH':
                row.golongan_darah = cleanValue;
                break;
              case 'AGAMA':
                row.agama = normalizeAgama(cleanValue);
                break;
              case 'STATUS_KAWIN':
                row.status_kawin = normalizeStatusKawin(cleanValue);
                break;
              case 'SHDK':
                row.status_hubungan = cleanValue;
                break;
              case 'PDDK_AKHIR':
                row.pendidikan = cleanValue;
                break;
              case 'PEKERJAAN':
                row.pekerjaan = normalizePekerjaan(cleanValue);
                break;
              case 'NAMA_IBU':
                row.nama_ibu = cleanValue;
                break;
              case 'NAMA_AYAH':
                row.nama_ayah = cleanValue;
                break;
              case 'RT':
                row.rt = cleanValue;
                break;
              case 'RW':
                row.rw = cleanValue;
                break;
              case 'DUSUN':
                row.dusun = normalizeDusun(cleanValue);
                break;
              case 'NAMA_KEP_KEL':
                row.nama_kep_kel = cleanValue;
                break;
              case 'ALAMAT_LENGKAP':
                row.alamat_lengkap = cleanValue;
                break;
              case 'NAMA_PROP':
                row.nama_prop = cleanValue || 'Sumatera Utara';
                break;
              case 'NAMA_KAB':
                row.nama_kab = cleanValue || 'Batu Bara';
                break;
              case 'NAMA_KEC':
                row.nama_kec = cleanValue || 'Laut Tador';
                break;
              case 'NAMA_KEL':
                row.nama_kel = cleanValue || 'Pelanggiran Laut Tador';
                break;
            }
          });
          
          // Validasi data sebelum menambahkan ke array
          const rowErrors = validateData(row, i);
          allErrors.push(...rowErrors);
          
          // Tambahkan ke parsedData hanya jika tidak ada error kritis dan ada nama
          if (rowErrors.length === 0 && row.nama) {
            parsedData.push(row);
          }
        }
        
        console.log('Final parsed data count:', parsedData.length);
        console.log('Total validation errors:', allErrors.length);
        
        resolve({ data: parsedData, errors: allErrors });
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        resolve({ data: [], errors: [] });
      }
    };
    
    reader.readAsArrayBuffer(file);
  });
};
