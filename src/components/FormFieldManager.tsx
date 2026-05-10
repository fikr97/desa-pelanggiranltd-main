import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Plus, Trash2, ArrowUp, ArrowDown, GripVertical, FolderOpen, Folder,
  Edit2, Move, Link2, ChevronDown, ChevronUp, Layers, Sparkles, Info
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

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
      onChange('');
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

/* =========================================================================
   Dialog: Tambah Field dari Data Penduduk
   ========================================================================= */
const PredefinedFieldDialog = ({ onSave, existingFields, targetSection }) => {
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const availableFields = PREDEFINED_FIELDS.filter(
    (field) => !existingFields.some((ef) => ef.sumber_data === `penduduk.${field.value}`)
  );

  const handleToggle = (fieldValue: string) => {
    setSelectedFields((prev) =>
      prev.includes(fieldValue) ? prev.filter((v) => v !== fieldValue) : [...prev, fieldValue]
    );
  };

  const handleSave = () => {
    const newFields = selectedFields.map((value) => {
      const field = PREDEFINED_FIELDS.find((f) => f.value === value)!;
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
    setSelectedFields([]);
  };

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Tambah Field dari Data Penduduk
        </DialogTitle>
        <DialogDescription>
          {targetSection
            ? <>Field akan ditambahkan ke seksi <b>{targetSection}</b></>
            : 'Field akan ditambahkan ke seksi default'}
        </DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 py-2 max-h-96 overflow-y-auto">
        {availableFields.length === 0 && (
          <p className="col-span-2 text-sm text-muted-foreground text-center py-8">
            Semua field penduduk sudah ditambahkan.
          </p>
        )}
        {availableFields.map((field) => (
          <label
            key={field.value}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
              selectedFields.includes(field.value)
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40 hover:bg-muted/30"
            )}
          >
            <Checkbox
              id={field.value}
              checked={selectedFields.includes(field.value)}
              onCheckedChange={() => handleToggle(field.value)}
            />
            <span className="text-sm font-medium">{field.label}</span>
          </label>
        ))}
      </div>
      <DialogFooter>
        <Button onClick={handleSave} disabled={selectedFields.length === 0}>
          Tambah {selectedFields.length > 0 ? `(${selectedFields.length})` : ''}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

/* =========================================================================
   Dialog: Tambah Field Custom
   ========================================================================= */
const CustomFieldDialog = ({ onSave, targetSection }) => {
  const [label, setLabel] = useState('');
  const [type, setType] = useState('text');
  const [options, setOptions] = useState('');

  const handleSave = () => {
    if (!label.trim()) return;
    const name = label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    onSave({
      label_field: label,
      nama_field: name,
      tipe_field: type,
      opsi_pilihan: (type === 'dropdown' || type === 'checkbox')
        ? options.split('\n').filter(o => o.trim() !== '')
        : null
    });
    setLabel('');
    setType('text');
    setOptions('');
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Edit2 className="h-5 w-5 text-primary" />
          Tambah Field Custom
        </DialogTitle>
        <DialogDescription>
          {targetSection
            ? <>Field akan ditambahkan ke seksi <b>{targetSection}</b></>
            : 'Field akan ditambahkan ke seksi default'}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div>
          <Label htmlFor="field-label">Label Field</Label>
          <Input id="field-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Contoh: Status Ekonomi" />
          <p className="text-xs text-muted-foreground mt-1">Judul yang akan tampil di form.</p>
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
              <SelectItem value="checkbox">Checkbox (Pilihan Ganda)</SelectItem>
              <SelectItem value="coordinate">Koordinat/Geo-tagging</SelectItem>
              <SelectItem value="image">Unggah Gambar</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {(type === 'dropdown' || type === 'checkbox') && (
          <div>
            <Label htmlFor="field-options">Pilihan (satu per baris)</Label>
            <Textarea id="field-options" value={options} onChange={(e) => setOptions(e.target.value)}
              placeholder={"Contoh:\nYa\nTidak\nMungkin"} rows={4} />
          </div>
        )}
      </div>
      <DialogFooter>
        <Button onClick={handleSave} disabled={!label.trim()}>Simpan Field</Button>
      </DialogFooter>
    </DialogContent>
  );
};

/* =========================================================================
   Dialog: Kelola Seksi (Tambah / Rename)
   ========================================================================= */
const SectionNameDialog = ({ open, onOpenChange, onSave, initialValue = '', existingNames = [], mode = 'create' }) => {
  const [name, setName] = useState(initialValue);
  const [error, setError] = useState('');

  useEffect(() => { setName(initialValue); setError(''); }, [initialValue, open]);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) { setError('Nama seksi tidak boleh kosong.'); return; }
    if (trimmed !== initialValue && existingNames.includes(trimmed)) {
      setError('Nama seksi sudah ada.'); return;
    }
    onSave(trimmed);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-primary" />
            {mode === 'create' ? 'Tambah Seksi Baru' : 'Ubah Nama Seksi'}
          </DialogTitle>
          <DialogDescription>
            Seksi digunakan untuk mengelompokkan field. Setiap field dapat dipindah antar seksi.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="section-name">Nama Seksi</Label>
          <Input id="section-name" value={name} autoFocus
            onChange={(e) => { setName(e.target.value); if (error) setError(''); }}
            placeholder="Contoh: Informasi Pribadi" />
          {error && <p className="text-sm text-destructive mt-1">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={handleSave}>{mode === 'create' ? 'Tambah' : 'Simpan'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* =========================================================================
   Dialog: Field Dependency (Conditional Visibility)
   ========================================================================= */
const DependencyDialog = ({ open, onOpenChange, currentField, allFields, onSave }) => {
  const [depField, setDepField] = useState<string>('');
  const [operator, setOperator] = useState<string>('equals');
  const [depValue, setDepValue] = useState<string>('');

  useEffect(() => {
    const dep = currentField?.dependency;
    if (dep) {
      setDepField(dep.field || '');
      setOperator(dep.operator || 'equals');
      setDepValue(Array.isArray(dep.value) ? dep.value.join('\n') : String(dep.value ?? ''));
    } else {
      setDepField(''); setOperator('equals'); setDepValue('');
    }
  }, [currentField, open]);

  // Candidate source fields = all fields except the current one; prefer dropdown/checkbox/predefined
  const sourceFields = useMemo(
    () => allFields.filter(f => f.nama_field !== currentField?.nama_field),
    [allFields, currentField]
  );

  const selectedSource = sourceFields.find(f => f.nama_field === depField);
  const hasOptions =
    selectedSource &&
    (selectedSource.tipe_field === 'dropdown' || selectedSource.tipe_field === 'checkbox') &&
    Array.isArray(selectedSource.opsi_pilihan);
  const isMulti = operator === 'in' || operator === 'not_in';

  const handleSave = () => {
    if (!depField) {
      onSave(null);
      onOpenChange(false);
      return;
    }
    let value: any = depValue;
    if (isMulti) {
      value = depValue.split('\n').map(v => v.trim()).filter(Boolean);
    }
    onSave({ field: depField, operator, value });
    onOpenChange(false);
  };

  const clearDependency = () => {
    setDepField(''); setOperator('equals'); setDepValue('');
    onSave(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            Atur Dependensi Field
          </DialogTitle>
          <DialogDescription>
            Field ini hanya akan tampil jika kondisi di bawah terpenuhi.
            Field target: <b>{currentField?.label_field}</b>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label>Field Pemicu</Label>
            <Select value={depField} onValueChange={setDepField}>
              <SelectTrigger><SelectValue placeholder="Pilih field yang memicu..." /></SelectTrigger>
              <SelectContent>
                {sourceFields.map(f => (
                  <SelectItem key={f.nama_field} value={f.nama_field}>
                    {f.label_field} <span className="text-muted-foreground">({f.tipe_field})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Operator</Label>
            <Select value={operator} onValueChange={setOperator}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="equals">Sama dengan (=)</SelectItem>
                <SelectItem value="not_equals">Tidak sama dengan (≠)</SelectItem>
                <SelectItem value="in">Termasuk salah satu (in)</SelectItem>
                <SelectItem value="not_in">Tidak termasuk (not in)</SelectItem>
                <SelectItem value="is_filled">Terisi (ada nilai)</SelectItem>
                <SelectItem value="is_empty">Kosong (tidak ada nilai)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {operator !== 'is_filled' && operator !== 'is_empty' && (
            <div>
              <Label>Nilai{isMulti ? ' (satu per baris)' : ''}</Label>
              {hasOptions && !isMulti ? (
                <Select value={depValue} onValueChange={setDepValue}>
                  <SelectTrigger><SelectValue placeholder="Pilih nilai..." /></SelectTrigger>
                  <SelectContent>
                    {(selectedSource!.opsi_pilihan as string[]).map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : isMulti ? (
                <Textarea value={depValue} onChange={e => setDepValue(e.target.value)} rows={3}
                  placeholder={"Nilai 1\nNilai 2"} />
              ) : (
                <Input value={depValue} onChange={e => setDepValue(e.target.value)} placeholder="Nilai..." />
              )}
            </div>
          )}

          <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground flex gap-2">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
            <span>
              Field dependensi memungkinkan form lebih cerdas. Field hanya tampil saat kondisi terpenuhi
              (mis. tampilkan "Nama Pasangan" jika "Status Kawin" = "Menikah").
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {currentField?.dependency && (
            <Button variant="ghost" onClick={clearDependency} className="mr-auto text-destructive hover:text-destructive">
              Hapus Dependensi
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={handleSave}>Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* =========================================================================
   Helpers
   ========================================================================= */
const isFormattableField = (field) => {
  if (['date', 'number', 'coordinate', 'checkbox'].includes(field.tipe_field)) return false;
  if (field.sumber_data === 'penduduk.tanggal_lahir') return false;
  return true;
};

const describeDependency = (dep, fieldsMap) => {
  if (!dep) return null;
  const src = fieldsMap[dep.field];
  const label = src ? src.label_field : dep.field;
  const opMap: Record<string, string> = {
    equals: '=', not_equals: '≠', in: 'termasuk', not_in: 'bukan',
    is_filled: 'terisi', is_empty: 'kosong'
  };
  const valPart = (dep.operator === 'is_filled' || dep.operator === 'is_empty')
    ? ''
    : Array.isArray(dep.value) ? ` [${dep.value.join(', ')}]` : ` "${dep.value}"`;
  return `${label} ${opMap[dep.operator] ?? dep.operator}${valPart}`;
};

const DeckDisplayOptions = ({ fieldIndex, field, updateField }) => {
  const deckField = {
    visible: field.deck_visible ?? false,
    display_order: field.deck_display_order ?? 0,
    display_format: field.deck_display_format ?? 'default',
    is_header: field.deck_is_header ?? false,
  };

  const handleUpdate = (key, value) => {
    const keyMap = {
      visible: 'deck_visible',
      display_order: 'deck_display_order',
      display_format: 'deck_display_format',
      is_header: 'deck_is_header',
    };
    updateField(fieldIndex, { [keyMap[key]]: value });
  };

  return (
    <div className="mt-3 pl-4 border-l-2 border-border/70 space-y-2">
      <div className="flex items-center gap-2">
        <Switch checked={deckField.visible} onCheckedChange={(c) => handleUpdate('visible', c)} />
        <Label className="text-xs">Tampilkan di kartu (deck)</Label>
      </div>
      {deckField.visible && (
        <>
          <div className="flex items-center gap-2">
            <Label className="text-xs">Format:</Label>
            <Select value={deckField.display_format} onValueChange={(v) => handleUpdate('display_format', v)}>
              <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="header">Header</SelectItem>
                <SelectItem value="full-width">Full Width</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {deckField.display_format === 'header' && (
            <div className="flex items-center gap-2">
              <Switch checked={deckField.is_header} onCheckedChange={(c) => handleUpdate('is_header', c)} />
              <Label className="text-xs">Gunakan sebagai judul kartu</Label>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Label className="text-xs">Urutan:</Label>
            <Input type="number" min="1" value={deckField.display_order}
              onChange={(e) => handleUpdate('display_order', parseInt(e.target.value) || 0)}
              className="h-7 w-16 text-xs" />
          </div>
        </>
      )}
    </div>
  );
};

/* =========================================================================
   Main Component
   ========================================================================= */
const FormFieldManager = ({ fields, onFieldsChange }: FormFieldManagerProps) => {
  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false);
  const [isPredefinedDialogOpen, setIsPredefinedDialogOpen] = useState(false);
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false);
  const [renameDialog, setRenameDialog] = useState<{ open: boolean; oldName: string }>({ open: false, oldName: '' });
  const [dependencyDialog, setDependencyDialog] = useState<{ open: boolean; fieldIndex: number | null }>({ open: false, fieldIndex: null });
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  // Build ordered list of section names based on first occurrence in fields
  const orderedSections = useMemo(() => {
    const names: string[] = [];
    fields.forEach(f => {
      const name = (f.section_name && f.section_name.trim()) ? f.section_name : 'Umum';
      if (!names.includes(name)) names.push(name);
    });
    return names;
  }, [fields]);

  const allSectionNames = orderedSections;

  useEffect(() => {
    if (!activeSection && allSectionNames.length > 0) {
      setActiveSection(allSectionNames[0]);
    }
  }, [allSectionNames, activeSection]);

  const fieldsMap = useMemo(() => {
    const m: Record<string, any> = {};
    fields.forEach(f => { m[f.nama_field] = f; });
    return m;
  }, [fields]);

  /* ------------- Add / Edit handlers ---------------- */
  const handleSavePredefinedFields = (newFields) => {
    const target = activeSection || 'Umum';
    const fieldsWithDefaults = newFields.map(field => ({
      ...field,
      deck_visible: field.deck_visible ?? false,
      deck_display_order: field.deck_display_order ?? 0,
      deck_display_format: field.deck_display_format ?? 'default',
      deck_is_header: field.deck_is_header ?? false,
      section_name: target,
    }));
    onFieldsChange([...fields, ...fieldsWithDefaults]);
    setIsPredefinedDialogOpen(false);
  };

  const handleSaveCustomField = (newField) => {
    const target = activeSection || 'Umum';
    onFieldsChange([...fields, {
      ...newField,
      sumber_data: null,
      deck_visible: false,
      deck_display_order: 0,
      deck_display_format: 'default',
      deck_is_header: false,
      section_name: target,
    }]);
    setIsCustomDialogOpen(false);
  };

  const removeField = (index: number) => {
    if (!window.confirm('Hapus field ini?')) return;
    const newFields = [...fields];
    newFields.splice(index, 1);
    onFieldsChange(newFields);
  };

  const updateField = (index: number, newProps: any) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...newProps };
    onFieldsChange(newFields);
  };

  /* ------------- Section operations ---------------- */
  const handleAddSection = (newSectionName: string) => {
    // Add a placeholder so the section appears — no actual field needed.
    // We add the section to orderedSections via activeSection.
    setActiveSection(newSectionName);
    setIsSectionDialogOpen(false);
    // Create a virtual section by appending a dummy invisible field? We prefer storing section names derived from fields.
    // Strategy: push an empty "section" via allSectionNames state -> but sections are derived from fields.
    // Workaround: record in a local state; we need to persist via fields. Approach: require user to add fields next.
    // We'll track "empty sections" in extraSections state so section renders even with 0 fields.
    setExtraSections(prev => prev.includes(newSectionName) ? prev : [...prev, newSectionName]);
  };

  const handleRenameSection = (newName: string) => {
    const oldName = renameDialog.oldName;
    if (oldName === newName) { setRenameDialog({ open: false, oldName: '' }); return; }
    const updated = fields.map(f => {
      const sec = (f.section_name && f.section_name.trim()) ? f.section_name : 'Umum';
      return sec === oldName ? { ...f, section_name: newName } : f;
    });
    onFieldsChange(updated);
    setExtraSections(prev => prev.map(s => s === oldName ? newName : s));
    if (activeSection === oldName) setActiveSection(newName);
    setRenameDialog({ open: false, oldName: '' });
  };

  const handleDeleteSection = (name: string) => {
    const count = fields.filter(f => ((f.section_name && f.section_name.trim()) ? f.section_name : 'Umum') === name).length;
    const msg = count > 0
      ? `Seksi "${name}" berisi ${count} field. Semua field akan dipindah ke seksi "Umum". Lanjutkan?`
      : `Hapus seksi "${name}"?`;
    if (!window.confirm(msg)) return;
    const updated = fields.map(f => {
      const sec = (f.section_name && f.section_name.trim()) ? f.section_name : 'Umum';
      return sec === name ? { ...f, section_name: 'Umum' } : f;
    });
    onFieldsChange(updated);
    setExtraSections(prev => prev.filter(s => s !== name));
  };

  const handleMoveSection = (name: string, direction: 'up' | 'down') => {
    const cur = orderedSections.indexOf(name);
    if (cur === -1) return;
    const target = direction === 'up' ? cur - 1 : cur + 1;
    if (target < 0 || target >= orderedSections.length) return;

    // Rebuild fields based on new section order: gather fields per section in their current order
    const newOrder = [...orderedSections];
    [newOrder[cur], newOrder[target]] = [newOrder[target], newOrder[cur]];

    const grouped: Record<string, any[]> = {};
    orderedSections.forEach(s => { grouped[s] = []; });
    fields.forEach(f => {
      const sec = (f.section_name && f.section_name.trim()) ? f.section_name : 'Umum';
      if (!grouped[sec]) grouped[sec] = [];
      grouped[sec].push(f);
    });

    const rebuilt: any[] = [];
    newOrder.forEach(s => { rebuilt.push(...(grouped[s] || [])); });
    onFieldsChange(rebuilt);
  };

  /* ------------- Field move operations ---------------- */
  const moveFieldInSection = (field: any, direction: 'up' | 'down') => {
    const sec = (field.section_name && field.section_name.trim()) ? field.section_name : 'Umum';
    // find within section
    const sectionIndices = fields
      .map((f, i) => ({ f, i }))
      .filter(({ f }) => ((f.section_name && f.section_name.trim()) ? f.section_name : 'Umum') === sec);
    const localIdx = sectionIndices.findIndex(({ f }) => f === field);
    const targetLocal = direction === 'up' ? localIdx - 1 : localIdx + 1;
    if (targetLocal < 0 || targetLocal >= sectionIndices.length) return;

    const globalFrom = sectionIndices[localIdx].i;
    const globalTo = sectionIndices[targetLocal].i;
    const newFields = [...fields];
    [newFields[globalFrom], newFields[globalTo]] = [newFields[globalTo], newFields[globalFrom]];
    onFieldsChange(newFields);
  };

  const moveFieldToSection = (fieldIndex: number, targetSection: string) => {
    // Change section_name and move to the end of the target section
    const newFields = [...fields];
    const [moved] = newFields.splice(fieldIndex, 1);
    const updated = { ...moved, section_name: targetSection };

    // Find last index of target section in newFields, insert after it
    let insertAt = newFields.length;
    for (let i = newFields.length - 1; i >= 0; i--) {
      const sec = (newFields[i].section_name && newFields[i].section_name.trim()) ? newFields[i].section_name : 'Umum';
      if (sec === targetSection) { insertAt = i + 1; break; }
      if (i === 0) insertAt = 0; // if not found, put at start? no—keep default at end
    }
    // If target section doesn't exist yet in fields, put at end
    const targetExists = newFields.some(f => ((f.section_name && f.section_name.trim()) ? f.section_name : 'Umum') === targetSection);
    if (!targetExists) insertAt = newFields.length;

    newFields.splice(insertAt, 0, updated);
    onFieldsChange(newFields);
  };

  const toggleSectionCollapse = (name: string) => {
    const next = new Set(collapsedSections);
    next.has(name) ? next.delete(name) : next.add(name);
    setCollapsedSections(next);
  };

  /* ------------- Virtual empty sections ---------------- */
  const [extraSections, setExtraSections] = useState<string[]>([]);
  const allDisplaySections = useMemo(() => {
    const fromFields = orderedSections;
    const extras = extraSections.filter(s => !fromFields.includes(s));
    return [...fromFields, ...extras];
  }, [orderedSections, extraSections]);

  /* ------------- Render ---------------- */
  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <Card className="border-0 shadow-none bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Desain Form
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Kelola seksi & field form. Field dapat dipindah antar seksi dan memiliki aturan dependensi.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsSectionDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" /> Tambah Seksi
              </Button>
              <Button variant="outline" onClick={() => setIsPredefinedDialogOpen(true)} className="gap-2"
                disabled={allDisplaySections.length === 0}>
                <Plus className="h-4 w-4" /> Field Penduduk
              </Button>
              <Button onClick={() => setIsCustomDialogOpen(true)} className="gap-2"
                disabled={allDisplaySections.length === 0}>
                <Plus className="h-4 w-4" /> Field Custom
              </Button>
            </div>
          </div>

          {/* Active section selector */}
          {allDisplaySections.length > 0 && (
            <div className="mt-3 flex items-center gap-2 text-xs flex-wrap">
              <span className="text-muted-foreground">Menambah ke seksi:</span>
              <Select value={activeSection ?? ''} onValueChange={setActiveSection}>
                <SelectTrigger className="h-8 w-56"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {allDisplaySections.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Empty state */}
      {allDisplaySections.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="inline-flex p-4 rounded-2xl bg-muted mb-4">
              <FolderOpen className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h3 className="font-semibold text-lg mb-1">Belum ada seksi</h3>
            <p className="text-sm text-muted-foreground mb-4">Mulai dengan menambahkan seksi pertama untuk mengelompokkan field.</p>
            <Button onClick={() => setIsSectionDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Tambah Seksi Pertama
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Sections */}
      {allDisplaySections.map((sectionName, secIdx) => {
        const sectionFields = fields.filter(f =>
          ((f.section_name && f.section_name.trim()) ? f.section_name : 'Umum') === sectionName
        );
        const collapsed = collapsedSections.has(sectionName);

        return (
          <Card key={sectionName} className="overflow-hidden border-border/70">
            {/* Section Header */}
            <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border/70 py-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleSectionCollapse(sectionName)}
                  className="flex items-center gap-2 flex-1 min-w-0 text-left hover:bg-muted/40 -my-1 py-1 px-1 rounded-md"
                >
                  {collapsed
                    ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    : <ChevronUp className="h-4 w-4 text-muted-foreground" />}
                  <Folder className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="font-display font-bold text-base truncate">{sectionName}</span>
                  <Badge variant="secondary" className="rounded-full text-[11px]">
                    {sectionFields.length} field
                  </Badge>
                </button>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button size="icon" variant="ghost" className="h-8 w-8"
                    onClick={() => handleMoveSection(sectionName, 'up')}
                    disabled={secIdx === 0} title="Pindah atas">
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8"
                    onClick={() => handleMoveSection(sectionName, 'down')}
                    disabled={secIdx === allDisplaySections.length - 1} title="Pindah bawah">
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8"
                    onClick={() => setRenameDialog({ open: true, oldName: sectionName })}
                    title="Ubah nama">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteSection(sectionName)}
                    title="Hapus seksi">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {!collapsed && (
              <CardContent className="p-4 space-y-3">
                {sectionFields.length === 0 ? (
                  <div className="text-center py-6 text-sm text-muted-foreground border-2 border-dashed rounded-xl">
                    Belum ada field. Gunakan tombol di atas (pastikan seksi aktif: <b>{sectionName}</b>).
                  </div>
                ) : (
                  sectionFields.map((field) => {
                    const originalIndex = fields.findIndex(f => f === field);
                    const depText = describeDependency(field.dependency, fieldsMap);
                    const otherSections = allDisplaySections.filter(s => s !== sectionName);

                    return (
                      <div key={originalIndex}
                        className="flex items-start justify-between gap-3 p-4 border border-border/70 rounded-xl bg-background hover:border-primary/40 hover:shadow-sm transition-all">
                        <GripVertical className="h-5 w-5 text-muted-foreground/40 mt-1 flex-shrink-0" />

                        <div className="flex-1 space-y-2 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-sm">{field.label_field}</p>
                            <Badge variant="outline" className="text-[10px] font-normal uppercase tracking-wider">
                              {field.tipe_field}
                            </Badge>
                            {field.is_required && (
                              <Badge className="text-[10px] bg-rose-100 text-rose-700 hover:bg-rose-100 border-rose-200">Wajib</Badge>
                            )}
                            {field.is_editable === false && (
                              <Badge variant="outline" className="text-[10px]">Read-only</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground font-mono">{field.nama_field}</p>

                          {/* Dependency badge */}
                          {depText && (
                            <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900 text-violet-700 dark:text-violet-300 w-fit">
                              <Link2 className="h-3 w-3" />
                              <span>Tampil jika: {depText}</span>
                            </div>
                          )}

                          {field.tipe_field === 'dropdown' && Array.isArray(field.opsi_pilihan) && field.opsi_pilihan.length > 0 && (
                            <p className="text-xs text-muted-foreground">Pilihan: {field.opsi_pilihan.join(', ')}</p>
                          )}
                          {(field.tipe_field === 'date' || field.sumber_data === 'penduduk.tanggal_lahir') && (
                            <DateFormatEditor
                              value={field.format_tanggal}
                              onChange={(v) => updateField(originalIndex, { format_tanggal: v })} />
                          )}
                          {isFormattableField(field) && (
                            <TextFormatSelector
                              value={field.text_format}
                              onChange={(v) => updateField(originalIndex, { text_format: v })} />
                          )}
                          <DeckDisplayOptions fieldIndex={originalIndex} field={field} updateField={updateField} />
                        </div>

                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <div className="flex items-center gap-2">
                            <Label className="text-xs font-normal">Wajib</Label>
                            <Switch checked={field.is_required || false}
                              onCheckedChange={(c) => updateField(originalIndex, { is_required: c })} />
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs font-normal">Editable</Label>
                            <Switch checked={field.is_editable !== false}
                              onCheckedChange={(c) => updateField(originalIndex, { is_editable: c })} />
                          </div>

                          <div className="flex items-center gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8"
                              onClick={() => moveFieldInSection(field, 'up')}
                              title="Naik">
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8"
                              onClick={() => moveFieldInSection(field, 'down')}
                              title="Turun">
                              <ArrowDown className="h-4 w-4" />
                            </Button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-8 w-8" title="Menu">
                                  <Move className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Pindah ke seksi</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {otherSections.length === 0 && (
                                  <DropdownMenuItem disabled>Tidak ada seksi lain</DropdownMenuItem>
                                )}
                                {otherSections.map(s => (
                                  <DropdownMenuItem key={s}
                                    onClick={() => moveFieldToSection(originalIndex, s)}>
                                    <Folder className="h-4 w-4 mr-2" /> {s}
                                  </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setDependencyDialog({ open: true, fieldIndex: originalIndex })}>
                                  <Link2 className="h-4 w-4 mr-2" /> Atur Dependensi…
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>

                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => removeField(originalIndex)}
                              title="Hapus">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            )}
          </Card>
        );
      })}

      {/* Dialogs */}
      <Dialog open={isPredefinedDialogOpen} onOpenChange={setIsPredefinedDialogOpen}>
        <PredefinedFieldDialog onSave={handleSavePredefinedFields} existingFields={fields} targetSection={activeSection} />
      </Dialog>

      <Dialog open={isCustomDialogOpen} onOpenChange={setIsCustomDialogOpen}>
        <CustomFieldDialog onSave={handleSaveCustomField} targetSection={activeSection} />
      </Dialog>

      <SectionNameDialog
        open={isSectionDialogOpen}
        onOpenChange={setIsSectionDialogOpen}
        onSave={handleAddSection}
        existingNames={allDisplaySections}
        mode="create"
      />
      <SectionNameDialog
        open={renameDialog.open}
        onOpenChange={(o) => setRenameDialog({ open: o, oldName: o ? renameDialog.oldName : '' })}
        onSave={handleRenameSection}
        initialValue={renameDialog.oldName}
        existingNames={allDisplaySections.filter(n => n !== renameDialog.oldName)}
        mode="rename"
      />

      <DependencyDialog
        open={dependencyDialog.open}
        onOpenChange={(o) => setDependencyDialog({ open: o, fieldIndex: o ? dependencyDialog.fieldIndex : null })}
        currentField={dependencyDialog.fieldIndex !== null ? fields[dependencyDialog.fieldIndex] : null}
        allFields={fields}
        onSave={(dep) => {
          if (dependencyDialog.fieldIndex !== null) {
            updateField(dependencyDialog.fieldIndex, { dependency: dep });
          }
        }}
      />
    </div>
  );
};

export default FormFieldManager;
