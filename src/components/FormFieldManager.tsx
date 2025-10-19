import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';

const TEXT_FORMAT_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'uppercase', label: 'UPPERCASE' },
  { value: 'lowercase', label: 'lowercase' },
  { value: 'capitalize', label: 'Capitalize' },
];

const TextFormatSelector = ({ value, onChange }) => (
  <div className="mt-2 space-y-2">
    <Label className="text-xs">Format Teks</Label>
    <Select value={value || 'normal'} onValueChange={onChange}>
      <SelectTrigger className="h-8">
        <SelectValue placeholder="Pilih format teks..." />
      </SelectTrigger>
      <SelectContent>
        {TEXT_FORMAT_OPTIONS.map(opt => (
          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

const DATE_FORMAT_OPTIONS = [
  { value: 'dd MMMM yyyy', label: '05 September 2025' },
  { value: 'dd-MM-yyyy', label: '05-09-2025' },
  { value: 'EEEE, dd MMMM yyyy', label: 'Jumat, 05 September 2025' },
  { value: 'd/M/yy', label: '5/9/25' },
  { value: 'custom', label: 'Format Kustom...' },
];

const DateFormatEditor = ({ value, onChange }) => {
  const [isCustomFormat, setIsCustomFormat] = useState(value && !DATE_FORMAT_OPTIONS.some(opt => opt.value === value));

  const handleFormatChange = (newValue) => {
    if (newValue === 'custom') {
      setIsCustomFormat(true);
      onChange(''); // Clear the format when switching to custom
    } else {
      setIsCustomFormat(false);
      onChange(newValue);
    }
  };

  return (
    <div className="mt-2 space-y-2">
      <Label className="text-xs">Format Tanggal</Label>
      <Select value={isCustomFormat ? 'custom' : value || ''} onValueChange={handleFormatChange}>
        <SelectTrigger className="h-8">
          <SelectValue placeholder="Pilih format tanggal..." />
        </SelectTrigger>
        <SelectContent>
          {DATE_FORMAT_OPTIONS.map(opt => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isCustomFormat && (
        <div>
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Contoh: dd-MM-yyyy"
            className="h-8 mt-1"
          />
           <p className="text-xs text-muted-foreground mt-1">
            Lihat <a href="https://date-fns.org/v2/docs/format" target="_blank" rel="noopener noreferrer" className="underline">referensi lengkap</a>.
          </p>
        </div>
      )}
    </div>
  );
};

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
        tipe_field: field.value === 'tanggal_lahir' ? 'date' : 'predefined',
        sumber_data: `penduduk.${field.value}`,
        deck_visible: false,
        deck_display_order: 0,
        deck_display_format: 'default',
        deck_is_header: false,
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

const CustomFieldDialog = ({ onSave }) => {
  const [label, setLabel] = useState('');
  const [type, setType] = useState('text');
  const [options, setOptions] = useState('');

  const handleSave = () => {
    const name = label.toLowerCase().replace(/\s+/g, '_');
    const fieldData = { 
      label_field: label, 
      nama_field: name,
      tipe_field: type,
      opsi_pilihan: type === 'dropdown' ? options.split('\n').filter(o => o.trim() !== '') : null
    };
    onSave(fieldData);
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
              <SelectItem value="dropdown">Dropdown (Pilihan)</SelectItem>
              <SelectItem value="coordinate">Koordinat/Geo-tagging</SelectItem>
              <SelectItem value="image">Unggah Gambar</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {type === 'dropdown' && (
          <div>
            <Label htmlFor="field-options">Pilihan (satu per baris)</Label>
            <Textarea
              id="field-options"
              value={options}
              onChange={(e) => setOptions(e.target.value)}
              placeholder="Contoh:\nYa\nTidak"
            />
          </div>
        )}
      </div>
      <DialogFooter>
        <Button onClick={handleSave}>Simpan Field</Button>
      </DialogFooter>
    </DialogContent>
  );
}

const SectionNameDialog = ({ onSave, onCancel, existingNames }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!name.trim()) {
      setError('Nama seksi tidak boleh kosong.');
      return;
    }
    if (existingNames.includes(name.trim())) {
      setError('Nama seksi sudah ada.');
      return;
    }
    onSave(name.trim());
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Tambah Seksi Baru</DialogTitle>
      </DialogHeader>
      <div className="py-4">
        <Label htmlFor="section-name">Nama Seksi</Label>
        <Input
          id="section-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError('');
          }}
          placeholder="Contoh: Informasi Pribadi"
        />
        {error && <p className="text-sm text-destructive mt-1">{error}</p>}
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onCancel}>Batal</Button>
        <Button onClick={handleSave}>Simpan</Button>
      </DialogFooter>
    </DialogContent>
  );
};

const isFormattableField = (field) => {
  if (field.tipe_field === 'date' || field.tipe_field === 'number' || field.tipe_field === 'coordinate') {
    return false;
  }
  if (field.sumber_data === 'penduduk.tanggal_lahir') {
      return false;
  }
  return true;
};

const DeckDisplayOptions = ({ fieldIndex, field, updateField }) => {
  const [deckField, setDeckField] = useState({
    visible: field.deck_visible !== undefined ? field.deck_visible : false,
    display_order: field.deck_display_order !== undefined ? field.deck_display_order : 0,
    display_format: field.deck_display_format !== undefined ? field.deck_display_format : 'default',
    is_header: field.deck_is_header !== undefined ? field.deck_is_header : false,
  });

  const handleUpdate = (key, value) => {
    const newDeckField = { ...deckField, [key]: value };
    setDeckField(newDeckField);

    updateField(fieldIndex, {
      deck_visible: newDeckField.visible,
      deck_display_order: newDeckField.display_order,
      deck_display_format: newDeckField.display_format,
      deck_is_header: newDeckField.is_header,
    });
  };

  return (
    <div className="mt-3 pl-4 border-l-2 border-border space-y-2">
      <div className="flex items-center gap-2">
        <Switch
          checked={deckField.visible}
          onCheckedChange={(checked) => handleUpdate('visible', checked)}
        />
        <Label className="text-xs">Tampilkan di kartu</Label>
      </div>
      {deckField.visible && (
        <>
          <div className="flex items-center gap-2">
            <Label className="text-xs">Format:</Label>
            <Select value={deckField.display_format} onValueChange={(value) => handleUpdate('display_format', value)}>
              <SelectTrigger className="h-6 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="header">Header</SelectItem>
                <SelectItem value="full-width">Full Width</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {deckField.display_format === 'header' && (
            <div className="flex items-center gap-2">
              <Switch
                checked={deckField.is_header}
                onCheckedChange={(checked) => handleUpdate('is_header', checked)}
              />
              <Label className="text-xs">Gunakan sebagai judul kartu</Label>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Label className="text-xs">Urutan:</Label>
            <Input
              type="number"
              min="1"
              value={deckField.display_order}
              onChange={(e) => handleUpdate('display_order', parseInt(e.target.value) || 0)}
              className="h-6 w-16 text-xs"
            />
          </div>
        </>
      )}
    </div>
  );
};

const FormFieldManager = ({ fields, onFieldsChange }: FormFieldManagerProps) => {
  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false);
  const [isPredefinedDialogOpen, setIsPredefinedDialogOpen] = useState(false);
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false);
  const [sectionNames, setSectionNames] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    const existingSections = fields.reduce((acc, field) => {
      if (field.section_name && !acc.includes(field.section_name)) {
        acc.push(field.section_name);
      }
      return acc;
    }, []);
    setSectionNames(existingSections);
  }, [fields]);

  const handleSavePredefinedFields = (newFields) => {
    const fieldsWithDefaults = newFields.map(field => ({
      ...field,
      deck_visible: field.deck_visible !== undefined ? field.deck_visible : false,
      deck_display_order: field.deck_display_order !== undefined ? field.deck_display_order : 0,
      deck_display_format: field.deck_display_format !== undefined ? field.deck_display_format : 'default',
      deck_is_header: field.deck_is_header !== undefined ? field.deck_is_header : false,
      section_name: activeSection,
    }));
    onFieldsChange([...fields, ...fieldsWithDefaults]);
    setIsPredefinedDialogOpen(false);
  };

  const handleSaveCustomField = (newField) => {
    const fieldWithDefaults = {
      ...newField,
      sumber_data: null,
      deck_visible: false,
      deck_display_order: 0,
      deck_display_format: 'default',
      deck_is_header: false,
      section_name: activeSection,
    };
    onFieldsChange([...fields, fieldWithDefaults]);
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

  const updateField = (index: number, newProps: any) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...newProps };
    onFieldsChange(newFields);
  };

  const handleSaveSection = (newSectionName: string) => {
    setSectionNames(prev => [...prev, newSectionName]);
    setActiveSection(newSectionName);
    setIsSectionDialogOpen(false);
  };

  // Separate fields with sections from those without sections
  const fieldsWithSections = fields.filter(field => field.section_name && field.section_name.trim() !== '');
  const fieldsWithoutSections = fields.filter(field => !field.section_name || field.section_name.trim() === '');
  
  const sectionNamesList = [...new Set(fieldsWithSections.map(field => field.section_name))];
  
  // Group fields with sections
  const sectionsWithFields = sectionNamesList.reduce((acc, name) => {
    acc[name] = fieldsWithSections.filter(f => f.section_name === name);
    return acc;
  }, {});
  
  // Get all possible section names for dialog
  const allSectionNames = [...new Set(fields.map(field => field.section_name).filter(name => name && name.trim() !== ''))];

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <CardTitle>Desain Form</CardTitle>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Dialog open={isSectionDialogOpen} onOpenChange={setIsSectionDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Seksi
              </Button>
            </DialogTrigger>
            <SectionNameDialog 
              onSave={handleSaveSection} 
              onCancel={() => setIsSectionDialogOpen(false)}
              existingNames={allSectionNames}
            />
          </Dialog>
          <Dialog open={isPredefinedDialogOpen} onOpenChange={setIsPredefinedDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full" onClick={() => setActiveSection(activeSection || 'Lainnya')}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Field Penduduk
              </Button>
            </DialogTrigger>
            <PredefinedFieldDialog onSave={handleSavePredefinedFields} existingFields={fields} />
          </Dialog>
          <Dialog open={isCustomDialogOpen} onOpenChange={setIsCustomDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full" onClick={() => setActiveSection(activeSection || 'Lainnya')}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Field Custom
              </Button>
            </DialogTrigger>
            <CustomFieldDialog onSave={handleSaveCustomField} />
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Render fields with sections first */}
          {Object.entries(sectionsWithFields).map(([sectionName, sectionFields]) => (
            <div key={sectionName} className="p-4 border rounded-lg">
              <h3 className="text-lg font-semibold mb-4">{sectionName}</h3>
              <div className="space-y-4">
                {(sectionFields as any[]).length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Belum ada field di seksi ini.</p>
                ) : (
                  (sectionFields as any[]).map((field, index) => {
                    const originalIndex = fields.findIndex(f => f === field);
                    return (
                      <div key={originalIndex} className="flex items-start justify-between p-4 border rounded-lg bg-background">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{field.label_field}</p>
                            {field.is_required && <span className="px-2 py-0.5 text-xs font-semibold text-red-800 bg-red-100 rounded-full">Wajib</span>}
                          </div>
                          <p className="text-sm text-muted-foreground">Tipe: {field.tipe_field} ({field.nama_field})</p>
                          {field.tipe_field === 'dropdown' && field.opsi_pilihan && (
                            <p className="text-xs text-muted-foreground">Pilihan: {Array.isArray(field.opsi_pilihan) ? field.opsi_pilihan.join(', ') : ''}</p>
                          )}
                          {(field.tipe_field === 'date' || (field.tipe_field === 'predefined' && field.sumber_data === 'penduduk.tanggal_lahir')) && (
                            <DateFormatEditor 
                              value={field.format_tanggal} 
                              onChange={(newValue) => updateField(originalIndex, { format_tanggal: newValue })} 
                            />
                          )}
                          {field.tipe_field === 'coordinate' && (
                            <p className="text-xs text-muted-foreground mt-1">Tipe field koordinat akan menyimpan data dalam format latitude dan longitude.</p>
                          )}
                          {isFormattableField(field) && (
                            <TextFormatSelector
                              value={field.text_format}
                              onChange={(newValue) => updateField(originalIndex, { text_format: newValue })}
                            />
                          )}
                          <DeckDisplayOptions
                            fieldIndex={originalIndex}
                            field={field}
                            updateField={updateField}
                          />
                        </div>
                        <div className="flex flex-col items-end gap-3 ml-4">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`required-switch-${originalIndex}`} className="text-sm font-normal">Wajib diisi</Label>
                            <Switch
                              id={`required-switch-${originalIndex}`}
                              checked={field.is_required || false}
                              onCheckedChange={(checked) => updateField(originalIndex, { is_required: checked })}
                            />
                          </div>
                          <div className="flex items-center">
                            <Button size="icon" variant="ghost" onClick={() => moveField(originalIndex, 'up')} disabled={originalIndex === 0}>
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => moveField(originalIndex, 'down')} disabled={originalIndex === fields.length - 1}>
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="destructive" onClick={() => removeField(originalIndex)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
          
          {/* Render fields without sections separately, if any */}
          {fieldsWithoutSections.length > 0 && (
            <div key="Lainnya" className="p-4 border rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Lainnya</h3>
              <div className="space-y-4">
                {fieldsWithoutSections.map((field, index) => {
                  const originalIndex = fields.findIndex(f => f === field);
                  return (
                    <div key={originalIndex} className="flex items-start justify-between p-4 border rounded-lg bg-background">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{field.label_field}</p>
                          {field.is_required && <span className="px-2 py-0.5 text-xs font-semibold text-red-800 bg-red-100 rounded-full">Wajib</span>}
                        </div>
                        <p className="text-sm text-muted-foreground">Tipe: {field.tipe_field} ({field.nama_field})</p>
                        {field.tipe_field === 'dropdown' && field.opsi_pilihan && (
                          <p className="text-xs text-muted-foreground">Pilihan: {Array.isArray(field.opsi_pilihan) ? field.opsi_pilihan.join(', ') : ''}</p>
                        )}
                        {(field.tipe_field === 'date' || (field.tipe_field === 'predefined' && field.sumber_data === 'penduduk.tanggal_lahir')) && (
                          <DateFormatEditor 
                            value={field.format_tanggal} 
                            onChange={(newValue) => updateField(originalIndex, { format_tanggal: newValue })} 
                          />
                        )}
                        {field.tipe_field === 'coordinate' && (
                          <p className="text-xs text-muted-foreground mt-1">Tipe field koordinat akan menyimpan data dalam format latitude dan longitude.</p>
                        )}
                        {isFormattableField(field) && (
                          <TextFormatSelector
                            value={field.text_format}
                            onChange={(newValue) => updateField(originalIndex, { text_format: newValue })}
                          />
                        )}
                        <DeckDisplayOptions
                          fieldIndex={originalIndex}
                          field={field}
                          updateField={updateField}
                        />
                      </div>
                      <div className="flex flex-col items-end gap-3 ml-4">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`required-switch-${originalIndex}`} className="text-sm font-normal">Wajib diisi</Label>
                          <Switch
                            id={`required-switch-${originalIndex}`}
                            checked={field.is_required || false}
                            onCheckedChange={(checked) => updateField(originalIndex, { is_required: checked })}
                          />
                        </div>
                        <div className="flex items-center">
                          <Button size="icon" variant="ghost" onClick={() => moveField(originalIndex, 'up')} disabled={originalIndex === 0}>
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => moveField(originalIndex, 'down')} disabled={originalIndex === fields.length - 1}>
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="destructive" onClick={() => removeField(originalIndex)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FormFieldManager;