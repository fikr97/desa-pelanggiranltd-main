import React, { useState, useEffect } from 'react';
import ResidentSearchCombobox from './ResidentSearchCombobox';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Loader2 } from 'lucide-react';

const DataEntryForm = ({ formDef, residents, onSave, onCancel, initialData, isLoading }) => {
  const [selectedResident, setSelectedResident] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (initialData) {
      // Mode Edit: Isi form dengan data yang ada
      const resident = residents.find(r => r.id === initialData.penduduk_id);
      setSelectedResident(resident || null);
      
      const combinedData = {};
      formDef.fields.forEach(field => {
        if (field.tipe_field === 'predefined') {
          combinedData[field.nama_field] = resident ? resident[field.nama_field] : '';
        } else {
          combinedData[field.nama_field] = initialData.data_custom ? initialData.data_custom[field.nama_field] : '';
        }
      });
      setFormData(combinedData);

    } else {
      // Mode Tambah Baru: Reset form
      setSelectedResident(null);
      setFormData({});
    }
  }, [initialData, residents, formDef]);

  useEffect(() => {
    // Autofill saat penduduk dipilih (hanya di mode tambah baru)
    if (selectedResident && !initialData) {
      const newFormData = {};
      formDef.fields.forEach(field => {
        if (field.tipe_field === 'predefined') {
          newFormData[field.nama_field] = selectedResident[field.nama_field] || '';
        } else {
          // Jangan reset field custom yang mungkin sudah diisi
          newFormData[field.nama_field] = formData[field.nama_field] || '';
        }
      });
      setFormData(newFormData);
    }
  }, [selectedResident, formDef, initialData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderField = (field) => {
    const value = formData[field.nama_field] || '';

    // Semua field bisa diedit
    switch (field.tipe_field) {
      case 'textarea':
        return (
          <div key={field.id}>
            <Label htmlFor={field.nama_field}>{field.label_field}</Label>
            <Textarea id={field.nama_field} value={value} onChange={e => handleInputChange(field.nama_field, e.target.value)} />
          </div>
        );
      case 'number':
        return (
          <div key={field.id}>
            <Label htmlFor={field.nama_field}>{field.label_field}</Label>
            <Input id={field.nama_field} type="number" value={value} onChange={e => handleInputChange(field.nama_field, e.target.value)} />
          </div>
        );
      case 'date':
        return (
          <div key={field.id}>
            <Label htmlFor={field.nama_field}>{field.label_field}</Label>
            <Input id={field.nama_field} type="date" value={value} onChange={e => handleInputChange(field.nama_field, e.target.value)} />
          </div>
        );
      default: // 'text', 'predefined', etc.
        return (
          <div key={field.id}>
            <Label htmlFor={field.nama_field}>{field.label_field}</Label>
            <Input id={field.nama_field} value={value} onChange={e => handleInputChange(field.nama_field, e.target.value)} />
          </div>
        );
    }
  };

  const handleSubmit = () => {
    if (!selectedResident) {
      // Tampilkan pesan error jika penduduk belum dipilih
      console.error("Penduduk belum dipilih");
      return;
    }
    onSave({ 
      residentId: selectedResident.id, 
      data: formData,
      entryId: initialData ? initialData.id : null // Kirim ID entri untuk mode update
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <Label>Pilih Penduduk</Label>
        <ResidentSearchCombobox 
          residents={residents || []} 
          onSelect={setSelectedResident} 
          value={selectedResident ? selectedResident.nik : ''}
          placeholder="Ketik untuk mencari NIK atau Nama..."
        />
      </div>

      <div className="space-y-4">
        {formDef.fields.map(field => renderField(field))}
      </div>
      
      <div className="flex justify-end pt-4 gap-2">
        <Button variant="ghost" onClick={onCancel}>Batal</Button>
        <Button onClick={handleSubmit} disabled={isLoading || !selectedResident}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Simpan Data
        </Button>
      </div>
    </div>
  );
};

export default DataEntryForm;