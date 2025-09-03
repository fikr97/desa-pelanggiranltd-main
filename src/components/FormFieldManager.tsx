import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

const PREDEFINED_FIELDS = [
  { value: 'nik', label: 'NIK' },
  { value: 'nama', label: 'Nama Lengkap' },
  { value: 'no_kk', label: 'No. Kartu Keluarga' },
  { value: 'jenis_kelamin', label: 'Jenis Kelamin' },
  { value: 'tempat_lahir', label: 'Tempat Lahir' },
  { value: 'tanggal_lahir', label: 'Tanggal Lahir' },
  { value: 'golongan_darah', label: 'Golongan Darah' },
  { value: 'agama', label: 'Agama' },
  { value: 'status_kawin', label: 'Status Perkawinan' },
  { value: 'status_hubungan', label: 'Status Hubungan' },
  { value: 'pendidikan', label: 'Pendidikan' },
  { value: 'pekerjaan', label: 'Pekerjaan' },
  { value: 'nama_ibu', label: 'Nama Ibu' },
  { value: 'nama_ayah', label: 'Nama Ayah' },
  { value: 'alamat_lengkap', label: 'Alamat Lengkap' },
  { value: 'rt', label: 'RT' },
  { value: 'rw', label: 'RW' },
  { value: 'dusun', label: 'Dusun' },
];

// This is a placeholder for the props. It will be updated later.
interface FormFieldManagerProps {
  fields: any[];
  onFieldsChange: (fields: any[]) => void;
}

const PredefinedFieldDialog = ({ onSave, existingFields }) => {
  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  const availableFields = PREDEFINED_FIELDS.filter(
    (field) => !existingFields.some((ef) => ef.sumber_data === `penduduk.${field.value}`)
  );

  const handleToggle = (fieldValue: string) => {
    setSelectedFields((prev) =>
      prev.includes(fieldValue)
        ? prev.filter((v) => v !== fieldValue)
        : [...prev, fieldValue]
    );
  };

  const handleSave = () => {
    const newFields = selectedFields.map((value) => {
      const field = PREDEFINED_FIELDS.find((f) => f.value === value);
      return {
        label_field: field.label,
        nama_field: field.value,
        tipe_field: 'predefined',
        sumber_data: `penduduk.${field.value}`,
      };
    });
    onSave(newFields);
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Tambah Field dari Data Penduduk</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
        {availableFields.map((field) => (
          <div key={field.value} className="flex items-center space-x-2">
            <Checkbox
              id={field.value}
              checked={selectedFields.includes(field.value)}
              onCheckedChange={() => handleToggle(field.value)}
            />
            <Label htmlFor={field.value} className="font-normal">
              {field.label}
            </Label>
          </div>
        ))}
      </div>
      <DialogFooter>
        <Button onClick={handleSave}>Tambah Terpilih</Button>
      </DialogFooter>
    </DialogContent>
  );
};

// This is a placeholder for the props. It will be updated later.
interface FormFieldManagerProps {
  fields: any[];
  onFieldsChange: (fields: any[]) => void;
}

const CustomFieldDialog = ({ onSave }) => {
  const [label, setLabel] = useState('');
  const [type, setType] = useState('text');

  const handleSave = () => {
    const name = label.toLowerCase().replace(/\s+/g, '_');
    onSave({ label_field: label, nama_field: name, tipe_field: type });
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Tambah Field Custom</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div>
          <Label htmlFor="field-label">Label Field</Label>
          <Input id="field-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Contoh: Status Ekonomi" />
          <p className="text-xs text-muted-foreground mt-1">Ini adalah judul yang akan tampil di form.</p>
        </div>
        <div>
          <Label htmlFor="field-type">Tipe Field</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger id="field-type">
              <SelectValue placeholder="Pilih tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Teks Singkat</SelectItem>
              <SelectItem value="textarea">Teks Panjang</SelectItem>
              <SelectItem value="number">Angka</SelectItem>
              <SelectItem value="date">Tanggal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={handleSave}>Simpan Field</Button>
      </DialogFooter>
    </DialogContent>
  );
}

const FormFieldManager = ({ fields, onFieldsChange }: FormFieldManagerProps) => {
  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false);
  const [isPredefinedDialogOpen, setIsPredefinedDialogOpen] = useState(false);

  const handleSavePredefinedFields = (newFields) => {
    onFieldsChange([...fields, ...newFields]);
    setIsPredefinedDialogOpen(false);
  };

  const handleSaveCustomField = (newField) => {
    onFieldsChange([...fields, { ...newField, sumber_data: null }]);
    setIsCustomDialogOpen(false);
  };

  const removeField = (index: number) => {
    const newFields = [...fields];
    newFields.splice(index, 1);
    onFieldsChange(newFields);
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...fields];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newFields.length) return;
    
    const [movedField] = newFields.splice(index, 1);
    newFields.splice(newIndex, 0, movedField);
    onFieldsChange(newFields);
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <CardTitle>Desain Form</CardTitle>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Dialog open={isPredefinedDialogOpen} onOpenChange={setIsPredefinedDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Field Penduduk
              </Button>
            </DialogTrigger>
            <PredefinedFieldDialog onSave={handleSavePredefinedFields} existingFields={fields} />
          </Dialog>
          <Dialog open={isCustomDialogOpen} onOpenChange={setIsCustomDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Field Custom
              </Button>
            </DialogTrigger>
            <CustomFieldDialog onSave={handleSaveCustomField} />
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {fields.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Belum ada field yang ditambahkan.</p>
          ) : (
            fields.map((field, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                <div>
                  <p className="font-medium">{field.label_field}</p>
                  <p className="text-sm text-muted-foreground">Tipe: {field.tipe_field} ({field.nama_field})</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="ghost" onClick={() => moveField(index, 'up')} disabled={index === 0}>
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => moveField(index, 'down')} disabled={index === fields.length - 1}>
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="destructive-outline" onClick={() => removeField(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FormFieldManager;
