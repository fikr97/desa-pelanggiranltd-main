import React, { useState, useEffect } from 'react';
import ResidentSearchCombobox from './ResidentSearchCombobox';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  pekerjaanOptions,
  agamaOptions,
  statusKawinOptions,
  pendidikanOptions,
  golonganDarahOptions,
  statusHubunganOptions,
  jenisKelaminOptions
} from '@/lib/options';

const DataEntryForm = ({ formDef, residents, onSave, onCancel, initialData, isLoading }) => {
  const [selectedResident, setSelectedResident] = useState(null);
  const [formData, setFormData] = useState({});
  const [dusunList, setDusunList] = useState<string[]>([]);

  const getDropdownOptions = (fieldName) => {
    switch (fieldName) {
      case 'jenis_kelamin': return jenisKelaminOptions;
      case 'golongan_darah': return golonganDarahOptions;
      case 'agama': return agamaOptions;
      case 'status_kawin': return statusKawinOptions;
      case 'status_hubungan': return statusHubunganOptions;
      case 'pendidikan': return pendidikanOptions;
      case 'pekerjaan': return pekerjaanOptions;
      case 'dusun': return dusunList;
      default: return [];
    }
  };

  const applyFormat = (value, field) => {
    let processedValue = value;
    const dropdownFields = ['jenis_kelamin', 'golongan_darah', 'agama', 'status_kawin', 'status_hubungan', 'pendidikan', 'pekerjaan', 'dusun'];

    // Special handling for dropdowns to find a case-insensitive match
    if (dropdownFields.includes(field.nama_field) && typeof value === 'string' && value) {
      const options = getDropdownOptions(field.nama_field);
      const foundOption = options.find(opt => opt.toLowerCase() === value.toLowerCase());
      if (foundOption) {
        return foundOption;
      }
    }

    if (field && field.text_format && typeof value === 'string') {
      switch (field.text_format) {
        case 'uppercase':
          processedValue = value.toUpperCase();
          break;
        case 'lowercase':
          processedValue = value.toLowerCase();
          break;
        case 'capitalize':
          processedValue = value.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
          break;
      }
    }
    return processedValue;
  };

  useEffect(() => {
    const fetchDusun = async () => {
      const { data, error } = await supabase.from('wilayah').select('nama').eq('jenis', 'Dusun').order('nama', { ascending: true });
      if (!error) {
        setDusunList(data.map(d => d.nama));
      }
    };
    fetchDusun();
  }, []);

  useEffect(() => {
    // Wait until dusunList is loaded if the form includes a dusun field
    const hasDusunField = formDef.fields.some(f => f.nama_field === 'dusun');
    if (hasDusunField && dusunList.length === 0) {
      return; // Don't run until dusunList is populated
    }

    if (initialData) {
      const resident = residents.find(r => r.id === initialData.penduduk_id);
      setSelectedResident(resident || null);
      
      const combinedData = {};
      formDef.fields.forEach(field => {
        let value;
        const customValue = initialData.data_custom?.[field.nama_field];
        if (customValue !== undefined && customValue !== null) {
          value = customValue;
        } else if (field.sumber_data && field.sumber_data.startsWith('penduduk.')) {
          value = resident ? resident[field.nama_field] : '';
        } else {
          value = '';
        }
        combinedData[field.nama_field] = applyFormat(value, field);
      });
      setFormData(combinedData);

    } else {
      setSelectedResident(null);
      setFormData({});
    }
  }, [initialData, residents, formDef, dusunList]);

  useEffect(() => {
    // Wait until dusunList is loaded if the form includes a dusun field
    const hasDusunField = formDef.fields.some(f => f.nama_field === 'dusun');
    if (hasDusunField && dusunList.length === 0) {
      return; // Don't run until dusunList is populated
    }

    // Only auto-fill resident data if we're adding new data, not when editing existing data
    if (selectedResident && !initialData) {
      const newFormData = {};
      formDef.fields.forEach(field => {
        let value = '';
        if (field.sumber_data && field.sumber_data.startsWith('penduduk.')) {
          value = selectedResident[field.nama_field] || '';
        }
        // This now correctly resets custom fields to empty when a new resident is selected
        // Apply format to the auto-filled value
        newFormData[field.nama_field] = applyFormat(value, field);
      });
      setFormData(newFormData);
    }
  }, [selectedResident, formDef, initialData, dusunList]);

  const handleInputChange = (fieldName, value) => {
    const field = formDef.fields.find(f => f.nama_field === fieldName);
    const formattedValue = applyFormat(value, field);
    setFormData(prev => ({ ...prev, [fieldName]: formattedValue }));
  };

  const renderField = (field) => {
    const value = formData[field.nama_field] || '';
    const dropdownFields = ['jenis_kelamin', 'golongan_darah', 'agama', 'status_kawin', 'status_hubungan', 'pendidikan', 'pekerjaan', 'dusun'];

    const requiredIndicator = field.is_required ? <span className="text-red-500 ml-1">*</span> : null;

    if (field.tipe_field === 'predefined' && dropdownFields.includes(field.nama_field)) {
      return (
        <div key={field.id}>
          <Label htmlFor={field.nama_field}>{field.label_field}{requiredIndicator}</Label>
          <Select value={value} onValueChange={(newValue) => handleInputChange(field.nama_field, newValue)}>
            <SelectTrigger id={field.nama_field}>
              <SelectValue placeholder={`Pilih ${field.label_field}...`} />
            </SelectTrigger>
            <SelectContent>
              {getDropdownOptions(field.nama_field).map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    switch (field.tipe_field) {
      case 'textarea':
        return (
          <div key={field.id}>
            <Label htmlFor={field.nama_field}>{field.label_field}{requiredIndicator}</Label>
            <Textarea id={field.nama_field} value={value} onChange={e => handleInputChange(field.nama_field, e.target.value)} />
          </div>
        );
      case 'number':
        return (
          <div key={field.id}>
            <Label htmlFor={field.nama_field}>{field.label_field}{requiredIndicator}</Label>
            <Input id={field.nama_field} type="number" value={value} onChange={e => handleInputChange(field.nama_field, e.target.value)} />
          </div>
        );
      case 'date': {
        let displayValue = value;
        try {
          if (value && field.format_tanggal) {
            let formatString = field.format_tanggal;
            if (formatString === 'd MMMM yyyy') {
              formatString = 'dd MMMM yyyy';
            } else if (formatString === 'EEEE, d MMMM yyyy') {
              formatString = 'EEEE, dd MMMM yyyy';
            }
            displayValue = format(new Date(value), formatString, { locale: id });
          }
        } catch (e) {
          console.error("Invalid date or format:", e);
          // Fallback to original value if formatting fails
          displayValue = value;
        }

        return (
          <div key={field.id}>
            <Label htmlFor={field.nama_field}>{field.label_field}{requiredIndicator}</Label>
            <div className="flex items-center gap-2">
               <Input 
                type="text" 
                readOnly 
                value={displayValue} 
                className="flex-grow bg-muted border-none"
                placeholder="Belum diisi"
              />
              <Input 
                id={field.nama_field} 
                type="date" 
                value={value ? format(new Date(value), 'yyyy-MM-dd', { locale: id }) : ''} 
                onChange={e => handleInputChange(field.nama_field, e.target.value)}
                className="w-auto"
              />
            </div>
          </div>
        );
      }
      case 'dropdown':
        return (
          <div key={field.id}>
            <Label htmlFor={field.nama_field}>{field.label_field}{requiredIndicator}</Label>
            <Select value={value} onValueChange={(newValue) => handleInputChange(field.nama_field, newValue)}>
              <SelectTrigger id={field.nama_field}>
                <SelectValue placeholder="Pilih..." />
              </SelectTrigger>
              <SelectContent>
                {(field.opsi_pilihan || []).map((option) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      default: // 'text', 'predefined', etc.
        return (
          <div key={field.id}>
            <Label htmlFor={field.nama_field}>{field.label_field}{requiredIndicator}</Label>
            <Input id={field.nama_field} value={value} onChange={e => handleInputChange(field.nama_field, e.target.value)} />
          </div>
        );
    }
  };

  const handleSubmit = () => {
    onSave({ 
      residentId: selectedResident ? selectedResident.id : null, 
      data: formData,
      entryId: initialData ? initialData.id : null
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <Label>Pilih Penduduk (Opsional)</Label>
        <ResidentSearchCombobox 
          residents={residents || []} 
          onSelect={setSelectedResident} 
          value={selectedResident ? selectedResident.nik : ''}
          placeholder="Ketik untuk mencari NIK atau Nama..."
        />
        <p className="text-xs text-muted-foreground mt-1">
          Pilih penduduk untuk mengisi data secara otomatis. Biarkan kosong jika data untuk penduduk luar.
        </p>
      </div>

      <div className="space-y-4">
        {formDef.fields.map(field => renderField(field))}
      </div>
      
      <div className="flex justify-end pt-4 gap-2">
        <Button variant="ghost" onClick={onCancel}>Batal</Button>
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Simpan Data
        </Button>
      </div>
    </div>
  );
};

export default DataEntryForm;