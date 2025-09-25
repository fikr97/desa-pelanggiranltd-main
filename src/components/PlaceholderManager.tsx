
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Edit, X, FolderPlus, ArrowUp, ArrowDown } from 'lucide-react';

interface PlaceholderManagerProps {
  placeholders: any[];
  onPlaceholdersChange: (placeholders: any[]) => void;
}

const PlaceholderManager = ({ placeholders, onPlaceholdersChange }: PlaceholderManagerProps) => {
  const [newSection, setNewSection] = useState({
    section_name: '',
    section_description: ''
  });
  
  const [newPlaceholder, setNewPlaceholder] = useState({
    field_name: '',
    field_type: 'penduduk',
    field_source: '',
    field_format: 'normal',
    section_name: '',
    urutan: 1,
    default_value: '',
    is_required: false,
    custom_field_options: {
      indeks_nomor: '470',
      kode_surat: 'UMUM',
      kode_desa: 'DSA'
    }
  });
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showSectionForm, setShowSectionForm] = useState(false);

  const fieldTypes = [
    { value: 'penduduk', label: 'Data Penduduk' },
    { value: 'alamat', label: 'Data Alamat' },
    { value: 'dusun', label: 'Data Dusun' },
    { value: 'sistem', label: 'Data Sistem' },
    { value: 'tanggal', label: 'Tanggal' },
    { value: 'angka', label: 'Konversi Angka' },
    { value: 'custom_input', label: 'Custom Input' },
    { value: 'custom_textarea', label: 'Custom Textarea' }
  ];

  const fieldFormats = [
    { value: 'normal', label: 'Normal' },
    { value: 'uppercase', label: 'HURUF BESAR' },
    { value: 'lowercase', label: 'huruf kecil' },
    { value: 'capitalize', label: 'Title Case' }
  ];

  const pendudukFields = [
    { value: 'nama', label: 'Nama Lengkap' },
    { value: 'nik', label: 'NIK' },
    { value: 'no_kk', label: 'Nomor KK' },
    { value: 'jenis_kelamin', label: 'Jenis Kelamin' },
    { value: 'tempat_lahir', label: 'Tempat Lahir' },
    { value: 'tanggal_lahir', label: 'Tanggal Lahir' },
    { value: 'agama', label: 'Agama' },
    { value: 'status_kawin', label: 'Status Kawin' },
    { value: 'pekerjaan', label: 'Pekerjaan' },
    { value: 'pendidikan', label: 'Pendidikan' },
    { value: 'nama_ayah', label: 'Nama Ayah' },
    { value: 'nama_ibu', label: 'Nama Ibu' }
  ];

  const alamatFields = [
    { value: 'alamat_lengkap', label: 'Alamat Lengkap' },
    { value: 'rt', label: 'RT' },
    { value: 'rw', label: 'RW' },
    { value: 'dusun', label: 'Dusun' },
    { value: 'nama_kel', label: 'Kelurahan/Desa' },
    { value: 'nama_kec', label: 'Kecamatan' },
    { value: 'nama_kab', label: 'Kabupaten' },
    { value: 'nama_prop', label: 'Provinsi' }
  ];

  const dusunFields = [
    { value: 'dropdown_dusun', label: 'Pilihan Dusun (Dropdown)' }
  ];

  const angkaFields = [
    { value: 'angka_rupiah', label: 'Angka ke Teks Rupiah' },
    { value: 'angka_biasa', label: 'Angka ke Teks Biasa' }
  ];

  const sistemFields = [
    { value: 'nomor_surat', label: 'Nomor Surat (Otomatis)' },
    { value: 'nomor_surat_kustom', label: 'Nomor Surat Kustom (Input Manual)' },
    { value: 'tanggal_surat', label: 'Tanggal Surat' },
    { value: 'nama_kepala_desa', label: 'Nama Kepala Desa' },
    { value: 'nama_desa', label: 'Nama Desa' },
    { value: 'nama_desa_kel', label: 'Nama Desa/Kelurahan' },
    { value: 'nama_kecamatan', label: 'Nama Kecamatan' },
    { value: 'nama_kabupaten', label: 'Nama Kabupaten' },
    { value: 'nama_kab_kota', label: 'Nama Kabupaten/Kota' },
    { value: 'sebutan_desa', label: 'Sebutan Desa/Kelurahan' },
    { value: 'sebutan_kecamatan', label: 'Sebutan Kecamatan' },
    { value: 'sebutan_kabupaten', label: 'Sebutan Kabupaten/Kota' }
  ];

  const getFieldOptions = () => {
    switch (newPlaceholder.field_type) {
      case 'penduduk':
        return pendudukFields;
      case 'alamat':
        return alamatFields;
      case 'dusun':
        return dusunFields;
      case 'sistem':
        return sistemFields;
      case 'tanggal':
        return [
          { value: 'tanggal_surat', label: 'Tanggal Surat' },
          { value: 'tanggal_custom', label: 'Tanggal Custom' }
        ];
      case 'angka':
        return angkaFields;
      default:
        return [];
    }
  };

  // Get unique sections from existing placeholders
  const getExistingSections = () => {
    const sections = [...new Set(placeholders.map(p => p.section_name).filter(Boolean))];
    return sections;
  };

  const addSection = () => {
    if (!newSection.section_name) return;
    
    // Add section placeholder to track sections
    const sectionPlaceholder = {
      id: `section_${Date.now()}`,
      field_name: `__SECTION__${newSection.section_name}`,
      field_type: 'section',
      section_name: newSection.section_name,
      section_description: newSection.section_description,
      urutan: placeholders.length + 1
    };

    onPlaceholdersChange([...placeholders, sectionPlaceholder]);
    setNewSection({ section_name: '', section_description: '' });
    setShowSectionForm(false);
  };

  const addPlaceholder = () => {
    if (!newPlaceholder.field_name) return;

    const placeholder = {
      id: Date.now().toString(),
      field_name: newPlaceholder.field_name,
      field_type: newPlaceholder.field_type,
      field_source: newPlaceholder.field_source,
      field_format: newPlaceholder.field_format,
      section_name: newPlaceholder.section_name === 'tanpa_section' ? '' : newPlaceholder.section_name,
      is_multiple: false,
      multiple_count: null,
      urutan: placeholders.length + 1,
      default_value: newPlaceholder.default_value,
      is_required: newPlaceholder.is_required,
      custom_field_options: newPlaceholder.field_source === 'nomor_surat_kustom' ? newPlaceholder.custom_field_options : null,
    };

    onPlaceholdersChange([...placeholders, placeholder]);
    setNewPlaceholder({
      field_name: '',
      field_type: 'penduduk',
      field_source: '',
      field_format: 'normal',
      section_name: newPlaceholder.section_name, // Keep same section
      urutan: 1,
      default_value: '',
      is_required: false,
      custom_field_options: {
        indeks_nomor: '470',
        kode_surat: 'UMUM',
        kode_desa: 'DSA'
      }
    });
  };

  const removePlaceholder = (id: string) => {
    onPlaceholdersChange(placeholders.filter(p => p.id !== id));
  };

  const updatePlaceholder = (id: string, updates: any) => {
    onPlaceholdersChange(
      placeholders.map(p => p.id === id ? { ...p, ...updates } : p)
    );
    setEditingId(null);
  };

  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    const allItems = [...placeholders];
    
    // 1. Get all section markers in their current order
    const sectionMarkers = allItems.filter(p => p.field_type === 'section');
    
    // 2. Find the index of the section to move
    const currentSectionMarkerIndex = sectionMarkers.findIndex(s => s.id === sectionId);
    if (currentSectionMarkerIndex === -1) return;

    // 3. Determine the target index for the swap
    let targetSectionMarkerIndex;
    if (direction === 'up') {
      if (currentSectionMarkerIndex === 0) return;
      targetSectionMarkerIndex = currentSectionMarkerIndex - 1;
    } else {
      if (currentSectionMarkerIndex === sectionMarkers.length - 1) return;
      targetSectionMarkerIndex = currentSectionMarkerIndex + 1;
    }

    // 4. Swap the section markers
    const movedSection = sectionMarkers[currentSectionMarkerIndex];
    sectionMarkers.splice(currentSectionMarkerIndex, 1);
    sectionMarkers.splice(targetSectionMarkerIndex, 0, movedSection);

    // 5. Group all placeholders by their section name
    const itemsBySection = new Map<string, any[]>();
    const itemsWithoutSection: any[] = [];
    allItems.forEach(p => {
      if (p.field_type === 'section') return;
      if (p.section_name) {
        if (!itemsBySection.has(p.section_name)) {
          itemsBySection.set(p.section_name, []);
        }
        const sectionItems = itemsBySection.get(p.section_name);
        if (sectionItems) {
          sectionItems.push(p);
        }
      } else {
        itemsWithoutSection.push(p);
      }
    });

    // 6. Rebuild the entire array based on the new section order
    const newPlaceholders: any[] = [];
    sectionMarkers.forEach(s => {
      newPlaceholders.push(s);
      if (s.section_name) {
        const children = itemsBySection.get(s.section_name) || [];
        newPlaceholders.push(...children);
      }
    });
    newPlaceholders.push(...itemsWithoutSection);

    // 7. Update urutan and call the state update
    newPlaceholders.forEach((p, i) => p.urutan = i + 1);
    onPlaceholdersChange(newPlaceholders);
  };

  const handlePlaceholderOptionChange = (id: string, option: string, value: any) => {
    onPlaceholdersChange(
      placeholders.map(p => {
        if (p.id === id) {
          const newOptions = { ...(p.custom_field_options || {}), [option]: value };
          return { ...p, custom_field_options: newOptions };
        }
        return p;
      })
    );
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newPlaceholders = [...placeholders];
    const item = newPlaceholders[index];
    const prevItem = newPlaceholders[index - 1];

    if (item.field_type === 'section') {
      moveSection(item.id, 'up');
    } else if (item.section_name === prevItem.section_name) { // Only move if in the same section
      [newPlaceholders[index], newPlaceholders[index - 1]] = [prevItem, item];
      newPlaceholders.forEach((p, i) => p.urutan = i + 1);
      onPlaceholdersChange(newPlaceholders);
    }
  };

  const moveDown = (index: number) => {
    if (index >= placeholders.length - 1) return;
    const newPlaceholders = [...placeholders];
    const item = newPlaceholders[index];
    const nextItem = newPlaceholders[index + 1];

    if (item.field_type === 'section') {
      moveSection(item.id, 'down');
    } else if (item.section_name === nextItem.section_name) { // Only move if in the same section
      [newPlaceholders[index], newPlaceholders[index + 1]] = [nextItem, item];
      newPlaceholders.forEach((p, i) => p.urutan = i + 1);
      onPlaceholdersChange(newPlaceholders);
    }
  };

  // Group placeholders by section
  const groupedPlaceholders = () => {
    const grouped: { [key: string]: any[] } = {};
    const withoutSection: any[] = [];
    
    placeholders.forEach(p => {
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

  const isCustomField = newPlaceholder.field_type === 'custom_input' || newPlaceholder.field_type === 'custom_textarea';

  return (
    <div className="space-y-6">
      {/* Welcome message when no placeholders exist */}
      {placeholders.length === 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-blue-600">
                <FolderPlus className="h-12 w-12 mx-auto mb-2" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900">Mulai Membuat Placeholder</h3>
                <p className="text-blue-700 mt-2">
                  Belum ada placeholder yang dibuat. Mulai dengan membuat section dan placeholder untuk template surat Anda.
                </p>
              </div>
              <div className="text-sm text-blue-600 bg-blue-100 p-3 rounded-lg">
                <p><strong>Tips:</strong></p>
                <ul className="text-left mt-1 space-y-1">
                  <li>• Buat section terlebih dahulu (misal: "Form Ayah", "Form Anak")</li>
                  <li>• Tambahkan placeholder dalam setiap section</li>
                  <li>• Gunakan berbagai tipe data: Penduduk, Alamat, Sistem, atau Custom</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add New Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Kelola Section Placeholder</CardTitle>
            <Button 
              variant="outline" 
              onClick={() => setShowSectionForm(!showSectionForm)}
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              Tambah Section Baru
            </Button>
          </div>
        </CardHeader>
        {showSectionForm && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="section_name">Nama Section</Label>
                <Input
                  id="section_name"
                  value={newSection.section_name}
                  onChange={(e) => setNewSection(prev => ({ ...prev, section_name: e.target.value }))}
                  placeholder="Contoh: Form Ayah, Form Anak, Keterangan Surat"
                />
              </div>
              <div>
                <Label htmlFor="section_description">Deskripsi Section</Label>
                <Input
                  id="section_description"
                  value={newSection.section_description}
                  onChange={(e) => setNewSection(prev => ({ ...prev, section_description: e.target.value }))}
                  placeholder="Deskripsi section..."
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={addSection} disabled={!newSection.section_name}>
                <Plus className="h-4 w-4 mr-2" />
                Buat Section
              </Button>
              <Button variant="outline" onClick={() => setShowSectionForm(false)}>
                Batal
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Add New Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Tambah Placeholder Baru</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="section_select">Pilih Section</Label>
              <Select
                value={newPlaceholder.section_name}
                onValueChange={(value) => setNewPlaceholder(prev => ({ ...prev, section_name: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih section untuk placeholder ini" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tanpa_section">Tanpa Section</SelectItem>
                  {getExistingSections().map(section => (
                    <SelectItem key={section} value={section}>
                      {section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="field_name">Nama Field</Label>
              <Input
                id="field_name"
                value={newPlaceholder.field_name}
                onChange={(e) => setNewPlaceholder(prev => ({ ...prev, field_name: e.target.value }))}
                placeholder="Nama Ayah, NIK Ayah, Penghasilan Ayah, dll"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="field_type">Tipe Field</Label>
              <Select
                value={newPlaceholder.field_type}
                onValueChange={(value) => setNewPlaceholder(prev => ({ ...prev, field_type: value, field_source: '' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fieldTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="field_source">Sumber Data</Label>
              <Select
                value={newPlaceholder.field_source}
                onValueChange={(value) => setNewPlaceholder(prev => ({ ...prev, field_source: value }))}
                disabled={isCustomField}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isCustomField ? "Tidak perlu sumber data" : "Pilih sumber data"} />
                </SelectTrigger>
                <SelectContent>
                  {getFieldOptions().map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {newPlaceholder.field_source === 'nomor_surat_kustom' && (
            <div className="p-4 border rounded-lg space-y-3 bg-muted/50">
              <Label className="font-semibold">Konfigurasi Nomor Surat Kustom</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="custom_indeks_nomor">Indeks Nomor</Label>
                  <Input
                    id="custom_indeks_nomor"
                    type="text"
                    value={newPlaceholder.custom_field_options.indeks_nomor}
                    onChange={(e) => setNewPlaceholder(prev => ({ ...prev, custom_field_options: { ...prev.custom_field_options, indeks_nomor: e.target.value } }))}
                  />
                </div>
                <div>
                  <Label htmlFor="custom_kode_surat">Kode Surat</Label>
                  <Input
                    id="custom_kode_surat"
                    value={newPlaceholder.custom_field_options.kode_surat}
                    onChange={(e) => setNewPlaceholder(prev => ({ ...prev, custom_field_options: { ...prev.custom_field_options, kode_surat: e.target.value } }))}
                  />
                </div>
                <div>
                  <Label htmlFor="custom_kode_desa">Kode Desa</Label>
                  <Input
                    id="custom_kode_desa"
                    value={newPlaceholder.custom_field_options.kode_desa}
                    onChange={(e) => setNewPlaceholder(prev => ({ ...prev, custom_field_options: { ...prev.custom_field_options, kode_desa: e.target.value } }))}
                  />
                </div>
              </div>
            </div>
          )}

          {isCustomField && (
            <div>
              <Label htmlFor="default_value">Nilai Isian Form (Default Value)</Label>
              <Input
                id="default_value"
                value={newPlaceholder.default_value}
                onChange={(e) => setNewPlaceholder(prev => ({ ...prev, default_value: e.target.value }))}
                placeholder="Masukkan nilai default untuk field ini (opsional)"
              />
            </div>
          )}

          <div>
            <Label htmlFor="field_format">Format Teks</Label>
            <Select
              value={newPlaceholder.field_format}
              onValueChange={(value) => setNewPlaceholder(prev => ({ ...prev, field_format: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fieldFormats.map(format => (
                  <SelectItem key={format.value} value={format.value}>
                    {format.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_required"
              checked={newPlaceholder.is_required}
              onCheckedChange={(checked) => setNewPlaceholder(prev => ({ ...prev, is_required: checked }))}
            />
            <Label htmlFor="is_required">Wajib Diisi (Required)</Label>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Preview Placeholder:</strong> {'{' + newPlaceholder.field_name.toLowerCase().replace(/\s+/g, '_') + '}'}
            </p>
          </div>

          <Button onClick={addPlaceholder} disabled={!newPlaceholder.field_name}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Placeholder
          </Button>
        </CardContent>
      </Card>

      {/* Existing Placeholders List */}
      {placeholders.length > 0 && (() => {
        const { grouped, withoutSection } = groupedPlaceholders();
        const orderedSections = placeholders.filter(p => p.field_type === 'section');

        return (
          <Card>
            <CardHeader>
              <CardTitle>Daftar Placeholder ({placeholders.filter(p => p.field_type !== 'section').length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderedSections.map(section => {
                  const sectionIndex = placeholders.findIndex(p => p.id === section.id);
                  return (
                    <div key={section.id}>
                      <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-100 dark:bg-gray-800">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 dark:text-gray-200">{section.section_name}</h3>
                          {section.section_description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">{section.section_description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => moveUp(sectionIndex)} disabled={sectionIndex === 0}>
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => moveDown(sectionIndex)} disabled={sectionIndex === placeholders.length - 1}>
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => removePlaceholder(section.id)}>
                            <Trash2 className="h-4 w-4 mr-1" /> Hapus Section
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2 pt-2 pl-6 border-l-2 ml-3">
                        {grouped[section.section_name]?.map((placeholder) => {
                          const placeholderIndex = placeholders.findIndex(p => p.id === placeholder.id);
                          return (
                            <div key={placeholder.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                                    {'{' + placeholder.field_name.toLowerCase().replace(/\s+/g, '_') + '}'}
                                  </code>
                                  <Badge variant="outline">{placeholder.field_type}</Badge>
                                  <Badge variant="secondary">{placeholder.field_format}</Badge>
                                  {placeholder.is_required && (
                                    <Badge variant="default" className="bg-red-500">Wajib</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Sumber: {placeholder.field_source || 'Custom field'}
                                </p>
                                {placeholder.field_source === 'tanggal_lahir' && (
                                  <div className="flex items-center space-x-2 mt-2">
                                    <Switch
                                      id={`show-age-${placeholder.id}`}
                                      checked={!!placeholder.custom_field_options?.show_age}
                                      onCheckedChange={(checked) => handlePlaceholderOptionChange(placeholder.id, 'show_age', checked)}
                                    />
                                    <Label htmlFor={`show-age-${placeholder.id}`}>Tampilkan Usia</Label>
                                  </div>
                                )}
                                {placeholder.field_source === 'nomor_surat_kustom' && placeholder.custom_field_options && (
                                  <div className="text-xs text-muted-foreground mt-1 space-x-2">
                                    <span>Indeks: {placeholder.custom_field_options.indeks_nomor}</span>
                                    <span>Kode: {placeholder.custom_field_options.kode_surat}</span>
                                    <span>Desa: {placeholder.custom_field_options.kode_desa}</span>
                                  </div>
                                )}
                                {(placeholder.field_type === 'custom_input' || placeholder.field_type === 'custom_textarea') && placeholder.default_value && (
                                  <p className="text-xs text-blue-600 mt-1">
                                    Default: "{placeholder.default_value}"
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" onClick={() => moveUp(placeholderIndex)} disabled={placeholderIndex === 0}>
                                  <ArrowUp className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => moveDown(placeholderIndex)} disabled={placeholderIndex === placeholders.length - 1}>
                                  <ArrowDown className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => removePlaceholder(placeholder.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                        {(!grouped[section.section_name] || grouped[section.section_name].length === 0) && (
                            <p className="text-sm text-muted-foreground pl-4 pt-2">Belum ada placeholder di section ini.</p>
                        )}
                      </div>
                    </div>
                  );
                })}

                {withoutSection.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2 border-b pb-2 mt-6">Tanpa Section</h3>
                    <div className="space-y-2 pt-2">
                      {withoutSection.map((placeholder) => {
                        const placeholderIndex = placeholders.findIndex(p => p.id === placeholder.id);
                        return (
                          <div key={placeholder.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                                  {'{' + placeholder.field_name.toLowerCase().replace(/\s+/g, '_') + '}'}
                                </code>
                                <Badge variant="outline">{placeholder.field_type}</Badge>
                                <Badge variant="secondary">{placeholder.field_format}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Sumber: {placeholder.field_source || 'Custom field'}
                              </p>
                              {(placeholder.field_type === 'custom_input' || placeholder.field_type === 'custom_textarea') && placeholder.default_value && (
                                <p className="text-xs text-blue-600 mt-1">
                                  Default: "{placeholder.default_value}"
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon" onClick={() => moveUp(placeholderIndex)} disabled={placeholderIndex === 0}>
                                <ArrowUp className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => moveDown(placeholderIndex)} disabled={placeholderIndex === placeholders.length - 1}>
                                <ArrowDown className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => removePlaceholder(placeholder.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
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
        )
      })()}
    </div>
  );
};

export default PlaceholderManager;