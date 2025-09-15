import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Download } from 'lucide-react';

import { pekerjaanOptions, agamaOptions, statusKawinOptions, pendidikanOptions, golonganDarahOptions, statusHubunganOptions } from '@/lib/options';

const formatRupiah = (angka: string | number) => {
  if (angka === null || angka === undefined || angka === '') return '';
  let [integerPart, decimalPart] = angka.toString().split('.');
  
  integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  let result = `Rp ${integerPart}`;
  if (decimalPart) {
    result += `,${decimalPart}`;
  }
  return result;
};

const terbilang = (angka: number): string => {
  if (isNaN(angka) || angka === null) return '';

  const terbilangInner = (n: number): string => {
    if (n < 0) return `minus ${terbilangInner(Math.abs(n))}`;
    
    const units = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan'];
    const teens = ['sepuluh', 'sebelas', 'dua belas', 'tiga belas', 'empat belas', 'lima belas', 'enam belas', 'tujuh belas', 'delapan belas', 'sembilan belas'];
    const tens = ['', '', 'dua puluh', 'tiga puluh', 'empat puluh', 'lima puluh', 'enam puluh', 'tujuh puluh', 'delapan puluh', 'sembilan puluh'];

    if (n === 0) return 'nol';
    if (n < 10) return units[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + units[n % 10] : '');
    if (n < 200) return 'seratus' + (n % 100 !== 0 ? ' ' + terbilangInner(n % 100) : '');
    if (n < 1000) return units[Math.floor(n / 100)] + ' ratus' + (n % 100 !== 0 ? ' ' + terbilangInner(n % 100) : '');
    if (n < 2000) return 'seribu' + (n % 1000 !== 0 ? ' ' + terbilangInner(n % 1000) : '');
    if (n < 1000000) return terbilangInner(Math.floor(n / 1000)) + ' ribu' + (n % 1000 !== 0 ? ' ' + terbilangInner(n % 1000) : '');
    if (n < 1000000000) return terbilangInner(Math.floor(n / 1000000)) + ' juta' + (n % 1000000 !== 0 ? ' ' + terbilangInner(n % 1000000) : '');
    if (n < 1000000000000) return terbilangInner(Math.floor(n / 1000000000)) + ' milyar' + (n % 1000000000 !== 0 ? ' ' + terbilangInner(n % 1000000000) : '');
    if (n < 1000000000000000) return terbilangInner(Math.floor(n / 1000000000000)) + ' triliun' + (n % 1000000000000 !== 0 ? ' ' + terbilangInner(n % 1000000000000) : '');
    return 'Angka terlalu besar';
  };

  const strAngka = angka.toString();
  const [integerPartStr, decimalPartStr] = strAngka.split('.');

  const integerPart = parseInt(integerPartStr, 10);
  let result = terbilangInner(integerPart);

  if (decimalPartStr) {
    result += ' koma';
    for (const digit of decimalPartStr) {
      result += ' ' + terbilangInner(parseInt(digit, 10));
    }
  }

  return result;
};

const toRoman = (num: number): string => {
  if (isNaN(num) || num < 1 || num > 12) return ''; // Hanya untuk bulan 1-12
  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  return roman[num - 1];
};



interface SuratGeneratorProps {
  template: any;
  onSave: () => void;
  onCancel: () => void;
}

const SuratGenerator = ({ template, onSave, onCancel }: SuratGeneratorProps) => {
  const [formData, setFormData] = useState({
    placeholderValues: {} as { [key: string]: string },
    manualNomorSurat: '',
    sectionResidents: {} as { [key: string]: any }, // Data penduduk terpilih per section
    sectionSearchTerms: {} as { [key: string]: string }, // Search terms per section
    sectionSearchResults: {} as { [key: string]: any[] } // Search results per section
  });
  const [useDefaultValues, setUseDefaultValues] = useState<{ [key: string]: boolean }>({});
  const [residents, setResidents] = useState<any[]>([]);
  const [placeholders, setPlaceholders] = useState<any[]>([]);
  const [dusunList, setDusunList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedSurat, setGeneratedSurat] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (template) {
      loadPlaceholders(template.id);
    }
  }, [template]);

  // Initialize default values for sebutan fields after placeholders are loaded
  useEffect(() => {
    if (placeholders.length > 0) {
      const initialValues: { [key: string]: string } = {};
      const initialUseDefault: { [key: string]: boolean } = {};

      placeholders.forEach(p => {
        const placeholderKey = p.field_name.toLowerCase().replace(/\s+/g, '_');
        const isCustom = p.field_type === 'custom_input' || p.field_type === 'custom_textarea';

        if (isCustom) {
          initialValues[placeholderKey] = p.default_value || '';
          initialUseDefault[placeholderKey] = !!p.default_value;
        } else if (p.field_type === 'sistem') {
          if (p.field_source === 'nomor_surat_kustom') {
            const indeksKey = `${placeholderKey}_indeks_no`;
            const kodeKey = `${placeholderKey}_kode`;
            const kodeDesaKey = `${placeholderKey}_kode_desa`;
            
            if (p.custom_field_options) {
              if (!initialValues[indeksKey]) {
                initialValues[indeksKey] = p.custom_field_options.indeks_nomor || '470';
              }
              if (!initialValues[kodeKey]) {
                initialValues[kodeKey] = p.custom_field_options.kode_surat || 'UMUM';
              }
              if (!initialValues[kodeDesaKey]) {
                initialValues[kodeDesaKey] = p.custom_field_options.kode_desa || 'DSA';
              }
            } else {
              if (!initialValues[indeksKey]) {
                initialValues[indeksKey] = p.custom_indeks_nomor || '470';
              }
              if (!initialValues[kodeKey]) {
                initialValues[kodeKey] = p.custom_kode_surat || 'UMUM';
              }
              if (!initialValues[kodeDesaKey]) {
                initialValues[kodeDesaKey] = p.custom_kode_desa || 'DSA';
              }
            }
          } else if (['sebutan_desa', 'sebutan_desa_kel'].includes(p.field_source)) {
            initialValues[placeholderKey] = 'Desa';
          } else if (['sebutan_kabupaten', 'sebutan_kab_kota'].includes(p.field_source)) {
            initialValues[placeholderKey] = 'Kabupaten';
          } else if (p.field_source === 'sebutan_kecamatan') {
            initialValues[placeholderKey] = 'Kecamatan';
          } else if (p.field_source === 'nama_kel' || p.field_source === 'nama_desa_kel') {
            initialValues[placeholderKey] = 'Pelanggiran Laut Tador';
          } else if (p.field_source === 'nama_kec' || p.field_source === 'nama_kecamatan') {
            initialValues[placeholderKey] = 'Laut Tador';
          } else if (p.field_source === 'nama_kab' || p.field_source === 'nama_kab_kota') {
            initialValues[placeholderKey] = 'Batu Bara';
          }
        } else if (p.field_type === 'tanggal') {
          initialValues[placeholderKey] = new Date().toISOString().split('T')[0];
        }
      });

      setFormData(prev => ({
        ...prev,
        placeholderValues: {
          ...initialValues,
          ...prev.placeholderValues,
        }
      }));
      setUseDefaultValues(initialUseDefault);
    }
  }, [placeholders]);

  // Set defaults immediately when component mounts (sebagai fallback)
  useEffect(() => {
    setFormData(prev => {
      const newPlaceholderValues = { ...prev.placeholderValues };
      
      // Set default values jika belum ada atau kosong
      const fieldsToCheck = {
        'sebutan_desa': 'Desa',
        'sebutan_desa_kel': 'Desa', 
        'sebutan_kabupaten': 'Kabupaten',
        'sebutan_kab_kota': 'Kabupaten',
        'sebutan_kecamatan': 'Kecamatan'
      };
      
      Object.entries(fieldsToCheck).forEach(([key, defaultValue]) => {
        if (!newPlaceholderValues[key] || newPlaceholderValues[key] === '') {
          newPlaceholderValues[key] = defaultValue;
        }
      });
      
      return {
        ...prev,
        placeholderValues: newPlaceholderValues
      };
    });
  }, []);

  useEffect(() => {
    loadResidents();
    loadDusunList();
  }, []);

  const loadPlaceholders = async (templateId: string) => {
    try {
      const { data, error } = await supabase
        .from('surat_field_mapping')
        .select('*')
        .eq('template_id', templateId)
        .order('urutan');
      
      if (error) throw error;
      setPlaceholders(data || []);
    } catch (error) {
      console.error('Error loading placeholders:', error);
    }
  };

  const loadResidents = async () => {
    try {
      console.log('Fetching ALL penduduk...');
      let allResidents: any[] = [];
      let from = 0;
      const batchSize = 1000;
      
      while (true) {
        const { data, error } = await supabase
          .from('penduduk')
          .select('*')
          .order('nama', { ascending: true })
          .range(from, from + batchSize - 1);
        
        if (error) throw error;
        
        if (!data || data.length === 0) break;
        
        allResidents = [...allResidents, ...data];
        console.log(`Fetched ${data.length} records, total so far: ${allResidents.length}`);
        
        if (data.length < batchSize) break;
        from += batchSize;
      }
      
      setResidents(allResidents);
      console.log('Total penduduk fetched:', allResidents.length);
      console.log('First 10 residents:', allResidents.slice(0, 10).map(r => ({ nama: r.nama, nik: r.nik })));
      console.log('Sample residents names:', allResidents.map(r => r.nama).slice(0, 20));
    } catch (error) {
      console.error('Error loading residents:', error);
    }
  };

  const loadDusunList = async () => {
    try {
      const { data, error } = await supabase
        .from('wilayah')
        .select('nama')
        .eq('jenis', 'Dusun')
        .order('nama');
      
      if (error) throw error;
      setDusunList(data?.map(w => w.nama) || []);
    } catch (error) {
      console.error('Error loading dusun list:', error);
    }
  };

  const handleValueChange = (placeholderName: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      placeholderValues: {
        ...prev.placeholderValues,
        [placeholderName]: value
      }
    }));
  };

  const handleSectionSearch = (sectionName: string, searchTerm: string) => {
    setFormData(prev => ({
      ...prev,
      sectionSearchTerms: {
        ...prev.sectionSearchTerms,
        [sectionName]: searchTerm
      }
    }));

    // Filter residents based on search term - show all residents regardless of gender
    if (searchTerm.length > 2) {
      const filtered = residents.filter(resident =>
        resident.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resident.nik.includes(searchTerm)
      );
      
      setFormData(prevData => ({
        ...prevData,
        sectionSearchResults: {
          ...prevData.sectionSearchResults,
          [sectionName]: filtered // Show all results without limiting
        }
      }));
    } else {
      setFormData(prevData => ({
        ...prevData,
        sectionSearchResults: {
          ...prevData.sectionSearchResults,
          [sectionName]: []
        }
      }));
    }
  };

  const handleResidentSelect = (sectionName: string, resident: any) => {
    setFormData(prev => ({
      ...prev,
      sectionResidents: {
        ...prev.sectionResidents,
        [sectionName]: resident
      },
      sectionSearchTerms: {
        ...prev.sectionSearchTerms,
        [sectionName]: `${resident.nama} (${resident.nik})`
      },
      sectionSearchResults: {
        ...prev.sectionSearchResults,
        [sectionName]: []
      }
    }));

    // Auto-fill form fields untuk section ini
    const sectionPlaceholders = getSectionPlaceholders(sectionName);
    const newValues = { ...formData.placeholderValues };
    
    sectionPlaceholders.forEach(placeholder => {
      const placeholderKey = placeholder.field_name.toLowerCase().replace(/\s+/g, '_');
      if (placeholder.field_source && resident[placeholder.field_source]) {
        let value = resident[placeholder.field_source];
        // Format tanggal lahir: simpan dalam format yyyy-mm-dd untuk konsistensi
        if (placeholder.field_source === 'tanggal_lahir' && value) {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            value = date.toISOString().split('T')[0]; // Format to YYYY-MM-DD directly for the input type="date"
          } else {
            value = ''; // If invalid date, set to empty string
          }
        }
        newValues[placeholderKey] = value;
      }
    });

    setFormData(prevFormData => ({
      ...prevFormData,
      placeholderValues: newValues
    }));

    toast({
      title: 'Data Ditemukan',
      description: `Data ${resident.nama} berhasil dimuat untuk ${sectionName}`,
    });
  };

  const getSectionPlaceholders = (sectionName: string) => {
    return placeholders.filter(p => 
      p.section_name === sectionName && p.field_type !== 'section'
    );
  };

  // Check if section has resident-related fields
  const sectionHasResidentFields = (sectionName: string) => {
    const sectionPlaceholders = getSectionPlaceholders(sectionName);
    return sectionPlaceholders.some(p => 
      p.field_type === 'penduduk' || p.field_type === 'alamat'
    );
  };

  const getFieldLabel = (field: string) => {
    const fieldLabels: { [key: string]: string } = {
      'nama': 'Nama Lengkap',
      'nik': 'NIK',
      'no_kk': 'Nomor KK',
      'jenis_kelamin': 'Jenis Kelamin',
      'tempat_lahir': 'Tempat Lahir',
      'tanggal_lahir': 'Tanggal Lahir',
      'agama': 'Agama',
      'status_kawin': 'Status Kawin',
      'pekerjaan': 'Pekerjaan',
      'pendidikan': 'Pendidikan',
      'nama_ayah': 'Nama Ayah',
      'nama_ibu': 'Nama Ibu',
      'alamat_lengkap': 'Alamat Lengkap',
      'rt': 'RT',
      'rw': 'RW',
      'dusun': 'Dusun',
      'nama_kel': 'Kelurahan/Desa',
      'nama_kec': 'Kecamatan',
      'nama_kab': 'Kabupaten',
      'nama_prop': 'Provinsi',
      'nomor_surat': 'Nomor Surat',
      'tanggal_surat': 'Tanggal Surat',
      'nama_kepala_desa': 'Nama Kepala Desa',
      'nama_desa': 'Nama Desa',
      'nama_kecamatan': 'Nama Kecamatan',
      'nama_kabupaten': 'Nama Kabupaten'
    };
    return fieldLabels[field] || field;
  };

  // Group placeholders by section
  const groupedPlaceholders = () => {
    const grouped: { [key: string]: any[] } = {};
    const withoutSection: any[] = [];
    
    placeholders?.forEach(p => {
      if (p.field_type === 'section') return; // Skip section markers
      
      if (p.section_name) {
        if (!grouped[p.section_name]) {
          grouped[p.section_name] = [];
        }
        grouped[p.section_name].push(p);
      } else {
        withoutSection.push(p);
      }
    });
    
    return { grouped, withoutSection };
  };

  const getSectionDescription = (sectionName: string) => {
    const sectionPlaceholder = placeholders.find(p => 
      p.field_type === 'section' && p.section_name === sectionName
    );
    return sectionPlaceholder?.section_description || '';
  };

  const renderPlaceholderField = (placeholder: any, sectionName?: string) => {
  const placeholderKey = placeholder.field_name.toLowerCase().replace(/\s+/g, '_');
  const fieldValue = formData.placeholderValues[placeholderKey] || '';

  if (placeholder.field_type === 'penduduk' || placeholder.field_type === 'alamat') {
    if (sectionName) {
      // Field khusus dengan dropdown
      if (['jenis_kelamin', 'agama', 'status_kawin', 'pendidikan', 'golongan_darah', 'status_hubungan', 'pekerjaan'].includes(placeholder.field_source)) {
        const getDropdownOptions = (fieldSource: string) => {
          if (fieldSource === 'pekerjaan') return pekerjaanOptions;
          if (fieldSource === 'agama') return agamaOptions;
          if (fieldSource === 'status_kawin') return statusKawinOptions;
          if (fieldSource === 'pendidikan') return pendidikanOptions;
          if (fieldSource === 'golongan_darah') return golonganDarahOptions;
          if (fieldSource === 'status_hubungan') return statusHubunganOptions;
          
          // Fallback for any other fields
          const uniqueValues = [...new Set(residents.map(r => r[fieldSource as keyof typeof r]).filter(Boolean))];
          return uniqueValues.sort();
        };

        return (
          <div key={placeholder.id}>
            <Label htmlFor={placeholderKey}>
              {placeholder.field_name} ({getFieldLabel(placeholder.field_source)})
            </Label>
            <Select
              value={fieldValue}
              onValueChange={(value) => handleValueChange(placeholderKey, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Pilih ${placeholder.field_name.toLowerCase()}...`} />
              </SelectTrigger>
              <SelectContent>
                {getDropdownOptions(placeholder.field_source).map((option: any) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Placeholder: {`{${placeholderKey}}`}
            </p>
          </div>
        );
      }

      if (placeholder.field_source === 'dusun') {
        const dusunTypeKey = `${placeholderKey}_type`;
        const selectedDusunType = formData.placeholderValues[dusunTypeKey] || 'dusun'; // Default to 'dusun'

        return (
          <div key={placeholder.id} className="space-y-3">
            <Label htmlFor={placeholderKey}>
              {placeholder.field_name} ({getFieldLabel(placeholder.field_source)})
            </Label>

            {/* Type selection: Dusun or Custom */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  type="radio"
                  id={`${placeholderKey}_type_dusun`}
                  name={`${placeholderKey}_type`}
                  value="dusun"
                  checked={selectedDusunType === 'dusun'}
                  onChange={() => {
                    handleValueChange(dusunTypeKey, 'dusun');
                    handleValueChange(placeholderKey, ''); // Clear custom value when switching
                  }}
                  className="mr-2"
                />
                <Label htmlFor={`${placeholderKey}_type_dusun`}>Dusun</Label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id={`${placeholderKey}_type_custom`}
                  name={`${placeholderKey}_type`}
                  value="custom"
                  checked={selectedDusunType === 'custom'}
                  onChange={() => {
                    handleValueChange(dusunTypeKey, 'custom');
                    handleValueChange(placeholderKey, ''); // Clear dusun selection when switching
                  }}
                  className="mr-2"
                />
                <Label htmlFor={`${placeholderKey}_type_custom`}>Custom</Label>
              </div>
            </div>

            {/* Conditional rendering based on selected type */}
            {selectedDusunType === 'dusun' ? (
              <Select
                value={fieldValue}
                onValueChange={(value) => handleValueChange(placeholderKey, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih dusun..." />
                </SelectTrigger>
                <SelectContent>
                  {dusunList.map((dusun) => (
                    <SelectItem key={dusun} value={dusun}>
                      {dusun}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={placeholderKey}
                value={fieldValue}
                onChange={(e) => handleValueChange(placeholderKey, e.target.value)}
                placeholder="Masukkan nama jalan, dusun, atau alamat custom..."
              />
            )}

            <p className="text-xs text-muted-foreground mt-1">
              Placeholder: {`{${placeholderKey}}`} - Akan terisi otomatis dari pencarian atau manual
            </p>
          </div>
        );
      }
        // Field tanggal lahir dengan date picker
        if (placeholder.field_source === 'tanggal_lahir') {
          const formatKey = `${placeholderKey}_format`;
          const selectedFormat = formData.placeholderValues[formatKey] || 'indonesia';

          return (
            <div key={placeholder.id}>
              <Label htmlFor={placeholderKey}>
                {placeholder.field_name} ({getFieldLabel(placeholder.field_source)})
              </Label>
              <Input
                id={placeholderKey}
                type="date"
                value={fieldValue || ''} // fieldValue will now be YYYY-MM-DD or empty
                onChange={(e) => {
                  handleValueChange(placeholderKey, e.target.value); // e.target.value is already YYYY-MM-DD
                }}
              />
              
              {/* Format Selection for tanggal_lahir */}
              <div>
                <Label htmlFor={formatKey}>Format Tanggal Lahir</Label>
                <Select
                  value={selectedFormat}
                  onValueChange={(value) => handleValueChange(formatKey, value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="indonesia">Bahasa Indonesia (13 Agustus 2025)</SelectItem>
                    <SelectItem value="dd-mm-yyyy">DD-MM-YYYY (13-08-2025)</SelectItem>
                    <SelectItem value="dd/mm/yyyy">DD/MM/YYYY (13/08/2025)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <p className="text-xs text-muted-foreground mt-1">
                Placeholder: {`{${placeholderKey}}`} - Akan terisi otomatis dari pencarian atau manual
              </p>
            </div>
          );
        }

        return (
          <div key={placeholder.id}>
            <Label htmlFor={placeholderKey}>
              {placeholder.field_name} ({getFieldLabel(placeholder.field_source)})
            </Label>
            <Input
              id={placeholderKey}
              value={fieldValue}
              onChange={(e) => handleValueChange(placeholderKey, e.target.value)}
              placeholder={`${placeholder.field_name} akan terisi otomatis dari pencarian`}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Placeholder: {`{${placeholderKey}}`}
            </p>
          </div>
        );
      } else {
        return (
          <div key={placeholder.id}>
            <Label htmlFor={placeholderKey}>
              {placeholder.field_name} ({getFieldLabel(placeholder.field_source)})
            </Label>
            <Select
              value={fieldValue}
              onValueChange={(value) => handleValueChange(placeholderKey, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Pilih ${placeholder.field_name.toLowerCase()}...`} />
              </SelectTrigger>
              <SelectContent>
                {residents?.map((resident) => (
                  <SelectItem key={resident.id} value={resident[placeholder.field_source as keyof typeof resident] || ''}>
                    {resident[placeholder.field_source as keyof typeof resident] || 'Data tidak tersedia'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Placeholder: {`{${placeholderKey}}`}
            </p>
          </div>
        );
      }
    }

    if (placeholder.field_type === 'tanggal') {
      const formatKey = `${placeholderKey}_format`;
      const selectedFormat = formData.placeholderValues[formatKey] || 'indonesia';

      return (
        <div key={placeholder.id}>
          <Label htmlFor={placeholderKey}>
            {placeholder.field_name}
          </Label>
          <Input
            id={placeholderKey}
            type="date"
            value={fieldValue}
            onChange={(e) => handleValueChange(placeholderKey, e.target.value)}
          />
          
          <div>
            <Label htmlFor={formatKey}>Format Tanggal</Label>
            <Select
              value={selectedFormat}
              onValueChange={(value) => handleValueChange(formatKey, value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="indonesia">Bahasa Indonesia (13 Agustus 2025)</SelectItem>
                <SelectItem value="dd-mm-yyyy">DD-MM-YYYY (13-08-2025)</SelectItem>
                <SelectItem value="dd/mm/yyyy">DD/MM/YYYY (13/08/2025)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <p className="text-xs text-muted-foreground mt-1">
            Placeholder: {`{${placeholderKey}}`}
          </p>
        </div>
      );
    }

    // Dusun field type for dropdown selections
    if (placeholder.field_type === 'dusun') {
      if (placeholder.field_source === 'dropdown_dusun') {
        const dusunTypeKey = `${placeholderKey}_type`;
        const selectedDusunType = formData.placeholderValues[dusunTypeKey] || 'dusun'; // Default to 'dusun'

        return (
          <div key={placeholder.id} className="space-y-3">
            <Label htmlFor={placeholderKey}>
              {placeholder.field_name}
            </Label>

            {/* Type selection: Dusun or Custom */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  type="radio"
                  id={`${placeholderKey}_type_dusun`}
                  name={`${placeholderKey}_type`}
                  value="dusun"
                  checked={selectedDusunType === 'dusun'}
                  onChange={() => {
                    handleValueChange(dusunTypeKey, 'dusun');
                    handleValueChange(placeholderKey, ''); // Clear custom value when switching
                  }}
                  className="mr-2"
                />
                <Label htmlFor={`${placeholderKey}_type_dusun`}>Dusun</Label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id={`${placeholderKey}_type_custom`}
                  name={`${placeholderKey}_type`}
                  value="custom"
                  checked={selectedDusunType === 'custom'}
                  onChange={() => {
                    handleValueChange(dusunTypeKey, 'custom');
                    handleValueChange(placeholderKey, ''); // Clear dusun selection when switching
                  }}
                  className="mr-2"
                />
                <Label htmlFor={`${placeholderKey}_type_custom`}>Custom</Label>
              </div>
            </div>

            {/* Conditional rendering based on selected type */}
            {selectedDusunType === 'dusun' ? (
              <Select
                value={fieldValue}
                onValueChange={(value) => handleValueChange(placeholderKey, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih dusun..." />
                </SelectTrigger>
                <SelectContent>
                  {dusunList.map((dusun) => (
                    <SelectItem key={dusun} value={dusun}>
                      {dusun}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={placeholderKey}
                value={fieldValue}
                onChange={(e) => handleValueChange(placeholderKey, e.target.value)}
                placeholder="Masukkan nama jalan, dusun, atau lainnya..."
              />
            )}

            <p className="text-xs text-muted-foreground mt-1">
              Placeholder: {`{${placeholderKey}}`}
            </p>
          </div>
        );
      }
    }

    // Angka field type for number conversions
    if (placeholder.field_type === 'angka') {
      if (placeholder.field_source === 'angka_rupiah') {
        const terbilangRupiahKey = `${placeholderKey}_text`;

        return (
          <div key={placeholder.id}>
            <Label htmlFor={placeholderKey}>
              {placeholder.field_name}
            </Label>
            <Input
              id={placeholderKey}
              type="text"
              value={fieldValue}
              onChange={(e) => {
                const rawValue = e.target.value;
                // Allow only numbers, one comma, and dots
                const sanitizedValue = rawValue.replace(/[^0-9,.]/g, '');
                const parts = sanitizedValue.split(',');
                let integerPart = parts[0].replace(/\./g, ''); // Remove existing dots for re-formatting
                const decimalPart = parts.length > 1 ? `,${parts[1]}` : '';

                // Format integer part with dots
                integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                
                const formattedValue = integerPart + decimalPart;
                handleValueChange(placeholderKey, formattedValue);

                // For terbilang conversion
                const numericValueStr = formattedValue.replace(/\./g, '').replace(',', '.');
                const numValue = parseFloat(numericValueStr);

                if (!isNaN(numValue)) {
                  handleValueChange(terbilangRupiahKey, terbilang(numValue) + ' rupiah');
                } else {
                  handleValueChange(terbilangRupiahKey, '');
                }
              }}
              placeholder="Masukkan nominal rupiah..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              Placeholder: {`{${placeholderKey}}`} - Masukkan angka (contoh: 2.000.000,50)
            </p>

            {/* Display for terbilang Rupiah */}
            <div className="mt-2 p-3 bg-muted rounded-md">
              <p className="text-sm font-medium text-muted-foreground">Terbilang Rupiah:</p>
              <p className="font-mono text-base">{formData.placeholderValues[terbilangRupiahKey] || 'nol rupiah'}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Placeholder: {`{${terbilangRupiahKey}}`}
              </p>
            </div>
          </div>
        );
      } else { // For 'angka_biasa'
        const terbilangBiasaKey = `${placeholderKey}_text`; // New key for text conversion

        return (
          <div key={placeholder.id}>
            <Label htmlFor={placeholderKey}>
              {placeholder.field_name}
            </Label>
            <Input
              id={placeholderKey}
              type="text"
              value={fieldValue}
              onChange={(e) => {
                const rawValue = e.target.value;

                // Hanya izinkan angka dan satu koma
                let sanitizedValue = rawValue.replace(/[^0-9,]/g, '');
                const commaIndex = sanitizedValue.indexOf(',');
                if (commaIndex !== -1) {
                  // Hapus semua koma setelah yang pertama
                  sanitizedValue = sanitizedValue.substring(0, commaIndex + 1) + sanitizedValue.substring(commaIndex + 1).replace(/,/g, '');
                }

                const parts = sanitizedValue.split(',');
                let integerPart = parts[0];
                const decimalPart = parts.length > 1 ? parts[1] : undefined;

                // Format bagian integer dengan titik
                integerPart = integerPart.replace(/\./g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                
                // Jika input dimulai dengan koma, tambahkan "0" di depan
                if (integerPart === '' && decimalPart !== undefined) {
                    integerPart = '0';
                }

                let formattedValue = integerPart;
                if (decimalPart !== undefined) {
                    formattedValue += ',' + decimalPart;
                }

                handleValueChange(placeholderKey, formattedValue);

                // Untuk konversi terbilang
                const valueForTerbilang = (integerPart.replace(/\./g, '') || '0') + (decimalPart !== undefined ? '.' + decimalPart : '');
                const numValue = parseFloat(valueForTerbilang);

                if (!isNaN(numValue)) {
                    handleValueChange(terbilangBiasaKey, terbilang(numValue));
                } else {
                    handleValueChange(terbilangBiasaKey, 'nol');
                }
              }}
              placeholder="Masukkan angka..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              Placeholder: {`{${placeholderKey}}`} - Masukkan angka
            </p>

            {/* Display for terbilang Biasa */}
            <div className="mt-2 p-3 bg-muted rounded-md">
              <p className="text-sm font-medium text-muted-foreground">Terbilang Angka:</p>
              <p className="font-mono text-base">{formData.placeholderValues[terbilangBiasaKey] || 'nol'}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Placeholder: {`{${terbilangBiasaKey}}`}
              </p>
            </div>
          </div>
        );
      }
    }

    if (placeholder.field_type === 'sistem') {
      if (placeholder.field_source === 'tanggal_surat') {
        return (
          <div key={placeholder.id}>
            <Label htmlFor={placeholderKey}>
              {placeholder.field_name}
            </Label>
            <Input
              id={placeholderKey}
              type="date"
              value={fieldValue}
              onChange={(e) => handleValueChange(placeholderKey, e.target.value)}
            />
            
            {/* Format Tanggal */}
            <div>
              <Label htmlFor={`${placeholderKey}_format`}>Format Tanggal</Label>
              <Select
                value={formData.placeholderValues.format_tanggal || 'indonesia'}
                onValueChange={(value) => handleValueChange('format_tanggal', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="indonesia">Bahasa Indonesia (24 Juli 2025)</SelectItem>
                  <SelectItem value="dd-mm-yyyy">DD-MM-YYYY (24-07-2025)</SelectItem>
                  <SelectItem value="dd/mm/yyyy">DD/MM/YYYY (24/07/2025)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <p className="text-xs text-muted-foreground mt-1">
              Placeholder: {`{${placeholderKey}}`}
            </p>
          </div>
        );
      } else if (placeholder.field_source === 'sebutan_desa') {
        const currentValue = fieldValue || formData.placeholderValues.sebutan_desa || 'Desa';
        return (
          <div key={placeholder.id}>
            <Label htmlFor={placeholderKey}>
              {placeholder.field_name}
            </Label>
            <Select
              value={currentValue}
              onValueChange={(value) => handleValueChange(placeholderKey, value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Desa">Desa</SelectItem>
                <SelectItem value="Kelurahan">Kelurahan</SelectItem>
                <SelectItem value="Kel.">Kel.</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Placeholder: {`{${placeholderKey}}`} - Default: Desa
            </p>
          </div>
        );
      } else if (placeholder.field_source === 'sebutan_desa_kel') {
        const currentValue = fieldValue || formData.placeholderValues.sebutan_desa_kel || 'Desa';
        return (
          <div key={placeholder.id}>
            <Label htmlFor={placeholderKey}>
              {placeholder.field_name}
            </Label>
            <Select
              value={currentValue}
              onValueChange={(value) => handleValueChange(placeholderKey, value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Desa">Desa</SelectItem>
                <SelectItem value="Kelurahan">Kelurahan</SelectItem>
                <SelectItem value="Kel.">Kel.</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Placeholder: {`{${placeholderKey}}`} - Default: Desa
            </p>
          </div>
        );
      } else if (placeholder.field_source === 'sebutan_kabupaten') {
        const currentValue = fieldValue || formData.placeholderValues.sebutan_kabupaten || 'Kabupaten';
        return (
          <div key={placeholder.id}>
            <Label htmlFor={placeholderKey}>
              {placeholder.field_name}
            </Label>
            <Select
              value={currentValue}
              onValueChange={(value) => handleValueChange(placeholderKey, value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Kabupaten">Kabupaten</SelectItem>
                <SelectItem value="Kota">Kota</SelectItem>
                <SelectItem value="Kab.">Kab.</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Placeholder: {`{${placeholderKey}}`} - Default: Kabupaten
            </p>
          </div>
        );
      } else if (placeholder.field_source === 'sebutan_kab_kota') {
        const currentValue = fieldValue || formData.placeholderValues.sebutan_kab_kota || 'Kabupaten';
        return (
          <div key={placeholder.id}>
            <Label htmlFor={placeholderKey}>
              {placeholder.field_name}
            </Label>
            <Select
              value={currentValue}
              onValueChange={(value) => handleValueChange(placeholderKey, value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Kabupaten">Kabupaten</SelectItem>
                <SelectItem value="Kota">Kota</SelectItem>
                <SelectItem value="Kab.">Kab.</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Placeholder: {`{${placeholderKey}}`} - Default: Kabupaten
            </p>
          </div>
        );
      } else if (placeholder.field_source === 'nomor_surat_kustom') {
        const noKey = `${placeholderKey}_no`;
        const sequenceNumber = formData.placeholderValues[noKey] || '';

        const indeksKey = `${placeholderKey}_indeks_no`;
        const kodeKey = `${placeholderKey}_kode`;
        const kodeDesaKey = `${placeholderKey}_kode_desa`;

        let fullNumber = '';
        if (sequenceNumber) {
            const formatTemplate = template.format_nomor_surat || '[indeks_no]/[no]/[kode]/[kode_desa]/[bulan_romawi]/[tahun]';
            const indeks_nomor = formData.placeholderValues[indeksKey];
            const kode_surat = formData.placeholderValues[kodeKey];
            const kode_desa = formData.placeholderValues[kodeDesaKey];

            fullNumber = formatTemplate
                .replace('[indeks_no]', indeks_nomor || '470')
                .replace('[no]', sequenceNumber.padStart(3, '0'))
                .replace('[kode]', kode_surat || 'UMUM')
                .replace('[kode_desa]', kode_desa || 'DSA')
                .replace('[bulan_romawi]', toRoman(new Date().getMonth() + 1))
                .replace('[tahun]', new Date().getFullYear().toString());
        }

        return (
          <div key={placeholder.id} className="p-4 border rounded-lg space-y-3 bg-muted/50 col-span-2">
              <Label className="font-semibold">{placeholder.field_name}</Label>
              <div>
                  <Input
                      id={placeholderKey}
                      value={fullNumber || sequenceNumber}
                      onChange={(e: any) => {
                          const currentSeq = sequenceNumber;
                          const typedChar = e.nativeEvent.data;

                          let newSeq = currentSeq;
                          if (typedChar && /^[0-9]$/.test(typedChar)) {
                              newSeq = currentSeq + typedChar;
                          } else if (e.nativeEvent.inputType === 'deleteContentBackward') {
                              newSeq = currentSeq.slice(0, -1);
                          }
                          
                          handleValueChange(noKey, newSeq);

                          let fullNum = '';
                          if (newSeq) {
                              const formatTemplate = template.format_nomor_surat || '[indeks_no]/[no]/[kode]/[kode_desa]/[bulan_romawi]/[tahun]';
                              const indeks_nomor = formData.placeholderValues[indeksKey];
                              const kode_surat = formData.placeholderValues[kodeKey];
                              const kode_desa = formData.placeholderValues[kodeDesaKey];

                              fullNum = formatTemplate
                                  .replace('[indeks_no]', indeks_nomor || '470')
                                  .replace('[no]', newSeq.padStart(3, '0'))
                                  .replace('[kode]', kode_surat || 'UMUM')
                                  .replace('[kode_desa]', kode_desa || 'DSA')
                                  .replace('[bulan_romawi]', toRoman(new Date().getMonth() + 1))
                                  .replace('[tahun]', new Date().getFullYear().toString());
                          }
                          handleValueChange(placeholderKey, fullNum);
                      }}
                      placeholder="Ketik nomor urut surat..."
                  />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Placeholder: {'{'}{placeholderKey}{'}'}
              </p>
          </div>
        );
      } else if (placeholder.field_source === 'sebutan_kecamatan') {
        const currentValue = fieldValue || formData.placeholderValues.sebutan_kecamatan || 'Kecamatan';
        return (
          <div key={placeholder.id}>
            <Label htmlFor={placeholderKey}>
              {placeholder.field_name}
            </Label>
            <Select
              value={currentValue}
              onValueChange={(value) => handleValueChange(placeholderKey, value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Kecamatan">Kecamatan</SelectItem>
                <SelectItem value="Kec.">Kec.</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Placeholder: {`{${placeholderKey}}`} - Default: Kecamatan
            </p>
          </div>
        );
      } else {
        return (
          <div key={placeholder.id}>
            <Label htmlFor={placeholderKey}>
              {placeholder.field_name}
            </Label>
            <Input
              id={placeholderKey}
              value={fieldValue}
              onChange={(e) => handleValueChange(placeholderKey, e.target.value)}
              placeholder={`Masukkan ${placeholder.field_name.toLowerCase()}...`}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Placeholder: {`{${placeholderKey}}`}
            </p>
          </div>
        );
      }
    }

    if (placeholder.field_type === 'custom_input' || placeholder.field_type === 'custom_textarea') {
      return (
        <div key={placeholder.id} className="space-y-2">
          <Label htmlFor={placeholderKey}>
            {placeholder.field_name}
          </Label>

          {placeholder.field_type === 'custom_textarea' ? (
            <Textarea
              id={placeholderKey}
              value={fieldValue}
              onChange={(e) => handleValueChange(placeholderKey, e.target.value)}
              placeholder={`Masukkan ${placeholder.field_name.toLowerCase()}...`}
              rows={4}
            />
          ) : (
            <Input
              id={placeholderKey}
              value={fieldValue}
              onChange={(e) => handleValueChange(placeholderKey, e.target.value)}
              placeholder={`Masukkan ${placeholder.field_name.toLowerCase()}...`}
            />
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Placeholder: {`{${placeholderKey}}`}
          </p>
        </div>
      );
    }

    // Custom field
    return (
      <div key={placeholder.id}>
        <Label htmlFor={placeholderKey}>
          {placeholder.field_name}
        </Label>
        <Input
          id={placeholderKey}
          value={fieldValue}
          onChange={(e) => handleValueChange(placeholderKey, e.target.value)}
          placeholder={`Masukkan ${placeholder.field_name.toLowerCase()}...`}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Placeholder: {`{${placeholderKey}}`}
        </p>
      </div>
    );
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Generate nomor surat
      let nomorSurat = '';
      
      if (formData.manualNomorSurat) {
        // Use manual number and replace [no] in template format
        let formatTemplate = template.format_nomor_surat || '[indeks_no]/[no]/[kode]/[kode_desa]/[bulan_romawi]/[tahun]';
        const currentYear = new Date().getFullYear().toString();
        const currentMonthRoman = toRoman(new Date().getMonth() + 1);
        
        formatTemplate = formatTemplate.replace('[indeks_no]', template.indeks_nomor?.toString() || '470');
        formatTemplate = formatTemplate.replace('[no]', formData.manualNomorSurat);
        formatTemplate = formatTemplate.replace('[kode]', template.kode_surat || 'UMUM');
        formatTemplate = formatTemplate.replace('[kode_desa]', template.kode_desa || 'DSA');
        formatTemplate = formatTemplate.replace('[bulan_romawi]', currentMonthRoman);
        formatTemplate = formatTemplate.replace('[tahun]', currentYear);
        
        nomorSurat = formatTemplate;
      } else {
        // Use automatic generation
        const { data: nomorData, error: nomorError } = await supabase.rpc('generate_nomor_surat', {
          template_id_param: template.id
        });
        
        if (nomorError) throw nomorError;
        nomorSurat = nomorData;
      }

      // Prepare surat data dengan struktur yang lebih baik
      const suratData = {
        template_id: template.id,
        nomor_surat: nomorSurat,
        judul_surat: template.nama_template,
        konten_surat: template.konten_template,
        tanggal_surat: new Date().toISOString().split('T')[0],
        data_penduduk: formData.sectionResidents, // Data penduduk per section
        data_tambahan: {
          placeholder_values: formData.placeholderValues
        },
        status: 'Draft'
      };

      // Save to database
      const { data, error } = await supabase
        .from('surat')
        .insert([suratData])
        .select()
        .single();

      if (error) throw error;

      setGeneratedSurat(data);

      toast({
        title: 'Berhasil',
        description: 'Surat berhasil dibuat dengan nomor: ' + nomorSurat,
      });
      
    } catch (error) {
      console.error('Error generating surat:', error);
      toast({
        title: 'Gagal',
        description: 'Terjadi kesalahan saat membuat surat',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedSurat) return;

    try {
      // Prepare merge data with proper formatting and default values
      const mergeData = { ...formData.placeholderValues };
      
      // Add nomor surat lengkap
      mergeData.nomor_surat_lengkap = formData.placeholderValues.nomor_surat_lengkap || generatedSurat.nomor_surat;
      
      // Handle custom nomor surat placeholders
      placeholders.forEach(p => {
        if (p.field_type === 'sistem' && p.field_source === 'nomor_surat_kustom') {
          const placeholderKey = p.field_name.toLowerCase().replace(/\s+/g, '_');
          
          const indeksKey = `${placeholderKey}_indeks_no`;
          const noKey = `${placeholderKey}_no`;
          const kodeKey = `${placeholderKey}_kode`;
          const kodeDesaKey = `${placeholderKey}_kode_desa`;

          const sequenceNumber = mergeData[noKey];

          if (sequenceNumber) {
            const indeks_nomor = p.custom_field_options ? p.custom_field_options.indeks_nomor : p.custom_indeks_nomor;
            const kode_surat = p.custom_field_options ? p.custom_field_options.kode_surat : p.custom_kode_surat;
            const kode_desa = p.custom_field_options ? p.custom_field_options.kode_desa : p.custom_kode_desa;

            const formatTemplate = template.format_nomor_surat || '[indeks_no]/[no]/[kode]/[kode_desa]/[bulan_romawi]/[tahun]';
            const fullNumber = formatTemplate
              .replace('[indeks_no]', mergeData[indeksKey] || indeks_nomor || '470')
              .replace('[no]', sequenceNumber.padStart(3, '0'))
              .replace('[kode]', mergeData[kodeKey] || kode_surat || 'UMUM')
              .replace('[kode_desa]', mergeData[kodeDesaKey] || kode_desa || 'DSA')
              .replace('[bulan_romawi]', toRoman(new Date().getMonth() + 1))
              .replace('[tahun]', new Date().getFullYear().toString());
            
            mergeData[placeholderKey] = fullNumber;
          } else {
            mergeData[placeholderKey] = ''; // Clear it if no sequence number is provided
          }
        }
      });

      // Add sistem data dengan fallback dari data desa
      const { data: infoDesaData } = await supabase.from('info_desa').select('*').limit(1).single();
      if (infoDesaData) {
        mergeData.nama_desa_kel = mergeData.nama_desa_kel || infoDesaData.nama_desa;
        mergeData.nama_kec = mergeData.nama_kec || infoDesaData.nama_kecamatan?.replace('Kecamatan ', '');
        mergeData.nama_kab_kota = mergeData.nama_kab_kota || infoDesaData.nama_kabupaten?.replace('Kabupaten ', '');
        mergeData.nama_prop = mergeData.nama_prop || infoDesaData.nama_provinsi;
      }

      // Override location fields if they are empty
      placeholders.forEach(p => {
        const placeholderKey = p.field_name.toLowerCase().replace(/\s+/g, '_');
        if (p.field_source === 'nama_kel' || p.field_source === 'nama_desa_kel') {
          if (!mergeData[placeholderKey]) {
             mergeData[placeholderKey] = 'Pelanggiran Laut Tador';
          }
        } else if (p.field_source === 'nama_kec' || p.field_source === 'nama_kecamatan') {
          if (!mergeData[placeholderKey]) {
             mergeData[placeholderKey] = 'Laut Tador';
          }
        } else if (p.field_source === 'nama_kab' || p.field_source === 'nama_kab_kota') {
          if (!mergeData[placeholderKey]) {
             mergeData[placeholderKey] = 'Batu Bara';
          }
        }
      });
      
      // Handle formatting for all date fields (custom and system)
      placeholders.forEach(placeholder => {
        const placeholderKey = placeholder.field_name.toLowerCase().replace(/\s+/g, '_');
        
        let isDateField = false;
        let formatKey = '';
        
        if (placeholder.field_type === 'tanggal') {
          isDateField = true;
          formatKey = `${placeholderKey}_format`;
        } else if (placeholder.field_type === 'sistem' && placeholder.field_source === 'tanggal_surat') {
          isDateField = true;
          formatKey = 'format_tanggal';
        } else if (placeholder.field_type === 'penduduk' && placeholder.field_source === 'tanggal_lahir') {
          // Tambahan untuk tanggal_lahir
          isDateField = true;
          formatKey = `${placeholderKey}_format`;
        }

        if (isDateField && mergeData[placeholderKey]) {
          const dateFormat = mergeData[formatKey] || 'indonesia';
          const date = new Date(mergeData[placeholderKey]);

          if (!isNaN(date.getTime())) {
            if (dateFormat === 'dd-mm-yyyy') {
              mergeData[placeholderKey] = date.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              }).replace(/\//g, '-');
            } else if (dateFormat === 'dd/mm/yyyy') {
              mergeData[placeholderKey] = date.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              });
            } else { // indonesia
              mergeData[placeholderKey] = date.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              });
            }
          }
        }
      });
      
      // Ensure sebutan fields have default values - PERBAIKAN UTAMA
      if (!mergeData.sebutan_desa) {
        mergeData.sebutan_desa = 'Desa';
      }
      if (!mergeData.sebutan_desa_kel) {
        mergeData.sebutan_desa_kel = 'Desa';
      }
      if (!mergeData.sebutan_kabupaten) {
        mergeData.sebutan_kabupaten = 'Kabupaten';
      }
      if (!mergeData.sebutan_kab_kota) {
        mergeData.sebutan_kab_kota = 'Kabupaten';
      }
      if (!mergeData.sebutan_kecamatan) {
        mergeData.sebutan_kecamatan = 'Kecamatan';
      }
      
      console.log('Final merge data for sebutan fields:', {
        sebutan_desa: mergeData.sebutan_desa,
        sebutan_desa_kel: mergeData.sebutan_desa_kel,
        sebutan_kabupaten: mergeData.sebutan_kabupaten,
        sebutan_kab_kota: mergeData.sebutan_kab_kota,
        sebutan_kecamatan: mergeData.sebutan_kecamatan
      });
      
      // Ensure angka_rupiah (raw) is replaced by formatted version if present
      if (mergeData.angka_rupiah && mergeData.angka_rupiah_formatted) {
        mergeData.angka_rupiah = mergeData.angka_rupiah_formatted;
      }

      // Ensure angka_biasa (raw) is replaced by text version if present
      if (mergeData.angka_biasa && mergeData.angka_biasa_text) {
        mergeData.angka_biasa = mergeData.angka_biasa_text;
      }

      // Apply case formatting untuk semua text fields
      Object.keys(mergeData).forEach(key => {
        if (typeof mergeData[key] === 'string') {
          let fieldFormat = placeholders.find(p => p.field_name.toLowerCase().replace(/\s+/g, '_') === key)?.field_format;

          // Special handling for derived angka_rupiah fields
          if (key.endsWith('_formatted') || key.endsWith('_text')) {
            const originalKey = key.replace('_formatted', '').replace('_text', '');
            const originalPlaceholder = placeholders.find(p => p.field_name.toLowerCase().replace(/\s+/g, '_') === originalKey && p.field_type === 'angka' && p.field_source === 'angka_rupiah');
            if (originalPlaceholder) {
              fieldFormat = originalPlaceholder.field_format;
            }
          }
          // Special handling for derived angka_biasa fields
          else if (key.endsWith('_text')) { // This covers angka_biasa_text
            const originalKey = key.replace('_text', '');
            const originalPlaceholder = placeholders.find(p => p.field_name.toLowerCase().replace(/\s+/g, '_') === originalKey && p.field_type === 'angka' && p.field_source === 'angka_biasa');
            if (originalPlaceholder) {
              fieldFormat = originalPlaceholder.field_format;
            }
          }

          if (fieldFormat === 'uppercase') {
            mergeData[key] = mergeData[key].toUpperCase();
          } else if (fieldFormat === 'lowercase') {
            mergeData[key] = mergeData[key].toLowerCase();
          } else if (fieldFormat === 'capitalize') {
            mergeData[key] = mergeData[key].split(/([ \/])/).map(word => 
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join('');
          }
        }
      });

      // Call edge function to generate DOCX
      const supabaseUrl = 'https://bzivgwvreceohmqmtvqe.supabase.co';
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-surat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6aXZnd3ZyZWNlb2htcW10dnFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MjExNjYsImV4cCI6MjA2NTA5NzE2Nn0._B7-kXD91zlgxXUqSVNceFM-TrOkLN88Lg3SOTMg2lw`
        },
        body: JSON.stringify({
          template_url: template.konten_template,
          merge_data: mergeData,
          template_id: template.id
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gagal generate surat: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Download file from the generated URL
      const fileResponse = await fetch(result.file_url);
      const blob = await fileResponse.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${generatedSurat.nomor_surat.replace(/\//g, '-')}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Berhasil',
        description: 'Surat berhasil didownload',
      });
    } catch (error) {
      console.error('Error downloading surat:', error);
      toast({
        title: 'Gagal',
        description: `Terjadi kesalahan saat mendownload surat: ${error}`,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Manual Letter Number Input */}
      <Card>
        <CardHeader>
          <CardTitle>Nomor Surat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <Label htmlFor="manual_nomor">Nomor Urut Surat (Opsional)</Label>
              <Input
                id="manual_nomor"
                type="number"
                value={formData.manualNomorSurat}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, manualNomorSurat: e.target.value }));
                  
                  // Auto-update nomor_surat_lengkap saat nomor manual berubah
                  if (e.target.value) {
                    const previewNomor = template.format_nomor_surat
                      ?.replace('[indeks_no]', template.indeks_nomor?.toString() || '470')
                      ?.replace('[no]', e.target.value)
                      ?.replace('[kode]', template.kode_surat || 'UMUM')
                      ?.replace('[kode_desa]', template.kode_desa || 'DSA')
                      ?.replace('[bulan_romawi]', toRoman(new Date().getMonth() + 1))
                      ?.replace('[tahun]', new Date().getFullYear().toString());
                    
                    handleValueChange('nomor_surat_lengkap', previewNomor || '');
                  }
                }}
                placeholder="Contoh: 020"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Jika diisi, akan mengganti [no] pada format: {template.format_nomor_surat}
              </p>
            </div>
            
            {/* Preview nomor surat lengkap */}
            {formData.manualNomorSurat && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-800 mb-2">Preview Nomor Surat Lengkap:</p>
                <p className="text-lg font-mono text-primary bg-card px-3 py-2 rounded border">
                  {template.format_nomor_surat
                    ?.replace('[indeks_no]', template.indeks_nomor?.toString() || '470')
                    ?.replace('[no]', formData.manualNomorSurat)
                    ?.replace('[kode]', template.kode_surat || 'UMUM')
                    ?.replace('[kode_desa]', template.kode_desa || 'DSA')
                    ?.replace('[bulan_romawi]', toRoman(new Date().getMonth() + 1))
                    ?.replace('[tahun]', new Date().getFullYear().toString())}
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  Placeholder untuk dokumen: <code className="bg-blue-100 px-1 rounded">{`{nomor_surat_lengkap}`}</code>
                </p>
              </div>
            )}
            
            <div>
              <Label htmlFor="nomor_surat_lengkap">Nomor Surat Lengkap (Manual Override)</Label>
              <Input
                id="nomor_surat_lengkap"
                value={formData.placeholderValues.nomor_surat_lengkap || ''}
                onChange={(e) => handleValueChange('nomor_surat_lengkap', e.target.value)}
                placeholder="Contoh: 470/020/UMUM/DSA/IX/2025"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Placeholder: <code className="bg-gray-100 px-1 rounded">{`{nomor_surat_lengkap}`}</code> - Nomor surat yang akan tampil di dokumen DOCX
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Fields */}
      <div className="space-y-6">
        {(() => {
          const { grouped, withoutSection } = groupedPlaceholders();

          return (
            <>
              {Object.entries(grouped).map(([sectionName, sectionPlaceholders]) => (
                <Card key={sectionName}>
                  <CardHeader className="relative bg-muted/50 p-4">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary rounded-l-lg"></div>
                    <CardTitle className="text-xl font-bold text-primary">{sectionName}</CardTitle>
                    {getSectionDescription(sectionName) && (
                      <p className="text-sm text-muted-foreground">{getSectionDescription(sectionName)}</p>
                    )}
                    {sectionHasResidentFields(sectionName) && (
                      <div className="mt-3 space-y-2">
                        <Label>Cari Data Penduduk</Label>
                        <div className="relative">
                          <Input
                            placeholder="Ketik nama atau NIK untuk mencari..."
                            value={formData.sectionSearchTerms[sectionName] || ''}
                            onChange={(e) => handleSectionSearch(sectionName, e.target.value)}
                          />
                          {formData.sectionSearchResults[sectionName]?.length > 0 && (
                            <div className="absolute top-full left-0 right-0 bg-background border border-input rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                              {formData.sectionSearchResults[sectionName].map((resident: any) => (
                                <div
                                  key={resident.id}
                                  className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                                  onClick={() => handleResidentSelect(sectionName, resident)}
                                >
                                  <div className="font-medium">{resident.nama}</div>
                                  <div className="text-sm text-muted-foreground">NIK: {resident.nik}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        {formData.sectionResidents[sectionName] && (
                          <p className="text-sm text-green-600">
                            ✓ Data terpilih: {formData.sectionResidents[sectionName].nama} ({formData.sectionResidents[sectionName].nik})
                          </p>
                        )}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {sectionPlaceholders.map(placeholder => renderPlaceholderField(placeholder, sectionName))}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {withoutSection.length > 0 && (
                <Card>
                  <CardHeader className="relative bg-muted/50 p-4">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary rounded-l-lg"></div>
                    <CardTitle className="text-xl font-bold text-primary">Data Tambahan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {withoutSection.map(placeholder => renderPlaceholderField(placeholder))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          );
        })()}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Batal
        </Button>
        {!generatedSurat ? (
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Membuat Surat...' : 'Buat Surat'}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download Surat
            </Button>
            <Button onClick={() => { setGeneratedSurat(null); onSave(); }}>
              Selesai
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuratGenerator;

