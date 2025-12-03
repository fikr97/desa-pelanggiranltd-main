import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase, deleteImage } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Settings, ListPlus, Trash2, Loader2 } from 'lucide-react';
import FormFieldManager from './FormFieldManager';
import { useAuth } from '@/contexts/AuthContext';
import { Switch } from '@/components/ui/switch';
import NestedGroupSelector from './NestedGroupSelector';

interface FormTugasDesignerProps {
  formTugas?: any; // Optional: for editing existing forms
  onSave: () => void;
  onCancel: () => void;
}

const FormTugasDesigner = ({ formTugas, onSave, onCancel }: FormTugasDesignerProps) => {
  const [formData, setFormData] = useState({
    nama_tugas: '',
    deskripsi: '',
    display_type: 'table',
    show_add_button: true,
    show_edit_button: true,
    show_delete_button: true,
    is_active: true, // Add is_active field
    default_group_by: '',
    group_by_hierarchy: [],
  });
  const [fields, setFields] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'settings' | 'fields'>('settings');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFieldsToClear, setSelectedFieldsToClear] = useState<string[]>([]);
  const [isClearingFields, setIsClearingFields] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const loadFields = async (formId) => {
      const { data, error } = await supabase
        .from('form_tugas_fields')
        .select('*')
        .eq('form_tugas_id', formId)
        .order('urutan');
      
      if (error) {
        toast({ title: 'Error', description: 'Gagal memuat fields.', variant: 'destructive' });
      } else {
        // Initialize deck display fields if they don't exist (handles missing columns in DB)
        const initializedFields = data.map(field => ({
          ...field,
          deck_visible: field.deck_visible !== undefined ? field.deck_visible : false,
          deck_display_order: field.deck_display_order !== undefined ? field.deck_display_order : 0,
          deck_display_format: field.deck_display_format !== undefined ? field.deck_display_format : 'default',
          deck_is_header: field.deck_is_header !== undefined ? field.deck_is_header : false,
        }));
        setFields(initializedFields);
      }
    };

    if (formTugas) {
      // Check if we're duplicating by seeing if we're passed a form with an ID but with (Copy) in the name
      // This indicates we're not editing the original form but duplicating it
      const isDuplicating = formTugas.id && formTugas.nama_tugas.includes('(Copy)');

      if (formTugas.id && !isDuplicating) {
        // Editing existing form
        setFormData({
          nama_tugas: formTugas.nama_tugas || '',
          deskripsi: formTugas.deskripsi || '',
          display_type: formTugas.display_type || 'table',
          show_add_button: formTugas.show_add_button !== undefined ? formTugas.show_add_button : true,
          show_edit_button: formTugas.show_edit_button !== undefined ? formTugas.show_edit_button : true,
          show_delete_button: formTugas.show_delete_button !== undefined ? formTugas.show_delete_button : true,
          is_active: formTugas.is_active !== undefined ? formTugas.is_active : true,
          default_group_by: formTugas.default_group_by || '',
          group_by_hierarchy: formTugas.group_by_hierarchy || [],
        });
        loadFields(formTugas.id);
      } else {
        // Duplicating form - load fields but keep the new form name/description
        setFormData({
          nama_tugas: formTugas.nama_tugas || '',
          deskripsi: formTugas.deskripsi || '',
          display_type: formTugas.display_type || 'table',
          show_add_button: formTugas.show_add_button !== undefined ? formTugas.show_add_button : true,
          show_edit_button: formTugas.show_edit_button !== undefined ? formTugas.show_edit_button : true,
          show_delete_button: formTugas.show_delete_button !== undefined ? formTugas.show_delete_button : true,
          is_active: formTugas.is_active !== undefined ? formTugas.is_active : true,
          default_group_by: formTugas.default_group_by || '',
          group_by_hierarchy: formTugas.group_by_hierarchy || [],
        });
        loadFields(formTugas.id);
      }
    } else {
      // Creating a completely new form
      setFormData({
        nama_tugas: '',
        deskripsi: '',
        display_type: 'table',
        show_add_button: true,
        show_edit_button: true,
        show_delete_button: true,
        is_active: true,
        default_group_by: '',
        group_by_hierarchy: [],
      });
      setFields([]);
    }
  }, [formTugas, toast]);

  const handleSave = async () => {
    if (!formData.nama_tugas) {
      toast({
        title: 'Error',
        description: 'Nama tugas tidak boleh kosong.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Determine if we're duplicating by checking if the form name contains "(Copy)" and has an ID
      // This indicates we're duplicating an existing form, not editing it
      const isDuplicating = formTugas && formTugas.id && formTugas.nama_tugas.includes('(Copy)');

      let formId;
      if (!isDuplicating && formTugas?.id) {
        // Update existing form (normal edit)
        const { error } = await supabase
          .from('form_tugas')
          .update({
            nama_tugas: formData.nama_tugas,
            deskripsi: formData.deskripsi,
            display_type: formData.display_type,
            show_add_button: formData.show_add_button,
            show_edit_button: formData.show_edit_button,
            show_delete_button: formData.show_delete_button,
            is_active: formData.is_active, // Add is_active to update
            default_group_by: formData.default_group_by,
            group_by_hierarchy: formData.group_by_hierarchy,
            updated_at: new Date().toISOString()
          })
          .eq('id', formTugas.id);
        if (error) throw error;
        formId = formTugas.id;
      } else {
        // Create new form (either completely new or duplicate)
        const { data, error } = await supabase
          .from('form_tugas')
          .insert([{
            nama_tugas: formData.nama_tugas,
            deskripsi: formData.deskripsi,
            display_type: formData.display_type,
            show_add_button: formData.show_add_button,
            show_edit_button: formData.show_edit_button,
            show_delete_button: formData.show_delete_button,
            is_active: formData.is_active, // Add is_active to insert
            default_group_by: formData.default_group_by,
            group_by_hierarchy: formData.group_by_hierarchy,
            created_by: user.id,
          }])
          .select('id')
          .single();
        if (error) throw error;
        formId = data.id;
      }

      // 2. Save the fields (form_tugas_fields table)
      if (formId) {
        // First, delete existing fields for this form to ensure consistency
        const { error: deleteError } = await supabase
          .from('form_tugas_fields')
          .delete()
          .eq('form_tugas_id', formId);
        if (deleteError) throw deleteError;

        // Then, insert the new fields with order
        const fieldsToInsert = fields.map((field, index) => ({
          form_tugas_id: formId,
          nama_field: field.nama_field,
          label_field: field.label_field,
          tipe_field: field.tipe_field,
          sumber_data: field.sumber_data,
          opsi_pilihan: field.opsi_pilihan,
          format_tanggal: field.format_tanggal,
          is_required: field.is_required || false,
          is_editable: field.is_editable !== false,
          text_format: field.text_format || 'normal',
          // Set default values for deck fields if they don't exist
          deck_visible: field.deck_visible !== undefined ? field.deck_visible : false,
          deck_display_order: field.deck_display_order !== undefined ? field.deck_display_order : 0,
          deck_display_format: field.deck_display_format !== undefined ? field.deck_display_format : 'default',
          deck_is_header: field.deck_is_header !== undefined ? field.deck_is_header : false,
          section_name: field.section_name, // Add section name
          urutan: index,
        }));

        if (fieldsToInsert.length > 0) {
          const { error: insertError } = await supabase
            .from('form_tugas_fields')
            .insert(fieldsToInsert);
          if (insertError) throw insertError;
        }
      }

      toast({
        title: 'Berhasil!',
        description: isDuplicating ? 'Form tugas telah berhasil di-duplicate.' : (formTugas ? 'Form tugas telah berhasil diperbarui.' : 'Form tugas telah berhasil dibuat.'),
      });

      // Notify kadus
      const message = isDuplicating || !formTugas
        ? `Form tugas baru "${formData.nama_tugas}" telah dibuat.`
        : `Form tugas "${formData.nama_tugas}" telah diperbarui.`;
      const link = `/form-tugas/${formId}/data`;

      const { error: rpcError } = await supabase.rpc('notify_kadus', {
        p_message: message,
        p_link: link,
        p_actor_id: user.id
      });

      if (rpcError) {
        console.error('Error notifying kadus:', rpcError);
      }

      onSave();

    } catch (error) {
      console.error('Error saving form:', error);
      toast({
        title: 'Gagal',
        description: 'Terjadi kesalahan saat menyimpan form',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Bulk operations for form data
  const handleDeleteAllFormData = async () => {
    if (!formTugas?.id) return;

    try {
      setIsClearingAll(true);

      // First, get all form entries to check for image files that need cleanup
      let allFormData = [];
      let from = 0;
      const limit = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data: formData, error, count } = await supabase
          .from('form_tugas_data')
          .select('id, data_custom', { count: 'exact' })
          .eq('form_tugas_id', formTugas.id)
          .range(from, from + limit - 1);

        if (error) throw error;

        if (formData && formData.length > 0) {
          allFormData = [...allFormData, ...formData];
          if (formData.length < limit) hasMore = false;
          else from += limit;
        } else {
          hasMore = false;
        }
      }

      if (allFormData.length === 0) {
        toast({
          title: 'Tidak Ada Data',
          description: `Form "${formData.nama_tugas}" tidak memiliki data entry untuk dihapus.`
        });
        return;
      }

      // Delete all image files associated with form entries before removing entries
      for (const entry of allFormData) {
        if (entry.data_custom) {
          // Find all image fields in the current form
          const imageFields = fields.filter(field => field.tipe_field === 'image');

          // Delete all images associated with this entry
          for (const field of imageFields) {
            const imageUrl = entry.data_custom[field.nama_field];
            if (imageUrl && typeof imageUrl === 'string' && imageUrl.includes('supabase.co')) {
              try {
                const deleteResult = await deleteImage(imageUrl);
                if (!deleteResult) {
                  console.warn(`Failed to delete image: ${imageUrl}`);
                } else {
                  console.log(`Deleted image: ${imageUrl}`);
                }
              } catch (deleteError) {
                console.error(`Error deleting image ${imageUrl}:`, deleteError);
              }
            }
          }
        }
      }

      // Now delete all form data entries
      const batchSize = 100;
      for (let i = 0; i < allFormData.length; i += batchSize) {
        const batch = allFormData.slice(i, i + batchSize);
        const ids = batch.map(entry => entry.id);

        const { error } = await supabase
          .from('form_tugas_data')
          .delete()
          .in('id', ids);

        if (error) throw error;
      }

      toast({
        title: 'Berhasil',
        description: `Semua ${allFormData.length} data entry untuk form "${formData.nama_tugas}" telah dihapus.`
      });
    } catch (error) {
      console.error('Error deleting form data:', error);
      toast({
        title: 'Gagal',
        description: `Terjadi kesalahan saat menghapus data form: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setIsClearingAll(false);
    }
  };

  const handleClearSpecificFieldData = async (fieldName, fieldLabel) => {
    if (!formTugas?.id || !fieldName) return;

    try {
      setIsClearingFields(true);

      // Get form entries that have the specific field populated
      const { data: formData, error } = await supabase
        .from('form_tugas_data')
        .select('id, data_custom')
        .eq('form_tugas_id', formTugas.id);

      if (error) throw error;

      const entriesWithField = formData.filter(entry => {
        const currentData = entry.data_custom || {};
        return currentData[fieldName] !== undefined && currentData[fieldName] !== null && currentData[fieldName] !== '';
      });

      if (entriesWithField.length === 0) {
        toast({
          title: 'Tidak Ada Data',
          description: `Tidak ditemukan entry dengan field "${fieldLabel}" untuk dikosongkan.`
        });
        return;
      }

      const fieldDef = fields.find(f => f.nama_field === fieldName);
      const isImageField = fieldDef && fieldDef.tipe_field === 'image';

      // Process entries with the field in batches
      const batchSize = 100;
      for (let i = 0; i < entriesWithField.length; i += batchSize) {
        const batch = entriesWithField.slice(i, i + batchSize);

        for (const entry of batch) {
          const currentData = entry.data_custom || {};

          // If it's an image field, delete the image before clearing the field
          if (isImageField) {
            const imageUrl = currentData[fieldName];
            if (imageUrl && typeof imageUrl === 'string' && imageUrl.includes('supabase.co')) {
              try {
                const deleteResult = await deleteImage(imageUrl);
                if (!deleteResult) {
                  console.warn(`Failed to delete image: ${imageUrl}`);
                } else {
                  console.log(`Deleted image: ${imageUrl}`);
                }
              } catch (deleteError) {
                console.error(`Error deleting image ${imageUrl}:`, deleteError);
              }
            }
          }

          // Update the data_custom JSONB column to clear the specific field value
          const updatedData = { ...currentData };
          updatedData[fieldName] = '';

          const { error: updateError } = await supabase
            .from('form_tugas_data')
            .update({ data_custom: updatedData })
            .eq('id', entry.id);

          if (updateError) throw updateError;
        }
      }

      toast({
        title: 'Berhasil',
        description: `Data field "${fieldLabel}" pada ${entriesWithField.length} entry untuk form "${formData.nama_tugas}" telah dikosongkan.`
      });
    } catch (error) {
      console.error('Error clearing specific field data:', error);
      toast({
        title: 'Gagal',
        description: `Terjadi kesalahan saat mengosongkan field: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setIsClearingFields(false);
    }
  };

  // Function to handle clearing multiple field data at once
  const handleClearMultipleFields = async () => {
    if (!formTugas?.id || selectedFieldsToClear.length === 0) return;

    const fieldLabels = selectedFieldsToClear.map(fieldName => {
      const field = fields.find(f => f.nama_field === fieldName);
      return field ? field.label_field : fieldName;
    }).join(', ');

    if (!window.confirm(`Apakah Anda yakin ingin menghapus data untuk field-field berikut pada form "${formData.nama_tugas}"?\n\n${fieldLabels}\n\nTindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    try {
      setIsClearingFields(true);

      // Get all form entries
      const { data: formData, error } = await supabase
        .from('form_tugas_data')
        .select('id, data_custom')
        .eq('form_tugas_id', formTugas.id);

      if (error) throw error;

      // Get fields that are image type for proper cleanup
      const imageFieldNames = fields
        .filter(field => selectedFieldsToClear.includes(field.nama_field) && field.tipe_field === 'image')
        .map(field => field.nama_field);

      // Process entries in batches
      const batchSize = 100;
      for (let i = 0; i < formData.length; i += batchSize) {
        const batch = formData.slice(i, i + batchSize);

        for (const entry of batch) {
          const currentData = entry.data_custom || {};

          // Process each field to clear
          for (const fieldName of selectedFieldsToClear) {
            // If it's an image field, delete the image before clearing the field
            if (imageFieldNames.includes(fieldName)) {
              const imageUrl = currentData[fieldName];
              if (imageUrl && typeof imageUrl === 'string' && imageUrl.includes('supabase.co')) {
                try {
                  const deleteResult = await deleteImage(imageUrl);
                  if (!deleteResult) {
                    console.warn(`Failed to delete image: ${imageUrl}`);
                  } else {
                    console.log(`Deleted image: ${imageUrl}`);
                  }
                } catch (deleteError) {
                  console.error(`Error deleting image ${imageUrl}:`, deleteError);
                }
              }
            }
          }

          // Update the data_custom JSONB column to clear the selected field values
          const updatedData = { ...currentData };
          for (const fieldName of selectedFieldsToClear) {
            updatedData[fieldName] = '';
          }

          const { error: updateError } = await supabase
            .from('form_tugas_data')
            .update({ data_custom: updatedData })
            .eq('id', entry.id);

          if (updateError) throw updateError;
        }
      }

      toast({
        title: 'Berhasil',
        description: `Data untuk ${selectedFieldsToClear.length} field telah dikosongkan pada form "${formData.nama_tugas}".`
      });

      // Reset the selection after successful operation
      setSelectedFieldsToClear([]);
    } catch (error) {
      console.error('Error clearing multiple fields data:', error);
      toast({
        title: 'Gagal',
        description: `Terjadi kesalahan saat mengosongkan field: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setIsClearingFields(false);
    }
  };

  // Filter fields that have deck display settings
  const deckFields = fields.filter(field => field.deck_visible);

  return (
    <div className="h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="flex flex-wrap border-b mb-4">
        <button
          className={`px-4 py-2 font-medium flex items-center ${activeTab === 'settings' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings className="h-4 w-4 mr-2" />
          Pengaturan Form
        </button>
        <button
          className={`px-4 py-2 font-medium flex items-center ${activeTab === 'fields' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('fields')}
        >
          <ListPlus className="h-4 w-4 mr-2" />
          Desain Form
        </button>
      </div>

      <div className="flex-1 overflow-auto p-1">
        {activeTab === 'settings' && (
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Form Tugas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="nama_tugas">Nama Tugas</Label>
                <Input
                  id="nama_tugas"
                  value={formData.nama_tugas}
                  onChange={(e) => setFormData(prev => ({ ...prev, nama_tugas: e.target.value }))}
                  placeholder="Contoh: Pendataan Warga Miskin 2025"
                />
              </div>

              <div>
                <Label htmlFor="deskripsi">Deskripsi</Label>
                <Textarea
                  id="deskripsi"
                  value={formData.deskripsi}
                  onChange={(e) => setFormData(prev => ({ ...prev, deskripsi: e.target.value }))}
                  placeholder="Deskripsi singkat mengenai tujuan dari pendataan ini..."
                />
              </div>

              <div>
                <Label htmlFor="display_type">Tampilan Data</Label>
                <Select 
                  value={formData.display_type} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, display_type: value }))}
                >
                  <SelectTrigger id="display_type">
                    <SelectValue placeholder="Pilih tampilan data" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="table">Tabel</SelectItem>
                    <SelectItem value="deck">Kartu/Deck</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Pilih bagaimana data nantinya akan ditampilkan saat diisi
                </p>
              </div>

              {/* Nested Group Selector - replacing the single-level group selector */}
              <div className="pt-4 border-t">
                <NestedGroupSelector
                  fields={fields}
                  groupByHierarchy={formData.group_by_hierarchy}
                  onChange={(newHierarchy) => setFormData(prev => ({ ...prev, group_by_hierarchy: newHierarchy }))}
                />
              </div>


              
              <div className="pt-4 border-t">
                <h3 className="text-lg font-semibold mb-4">Pengaturan Tombol</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="show_add_button">Tampilkan Tombol Tambah</Label>
                      <p className="text-xs text-muted-foreground">Perlihatkan tombol untuk menambah data</p>
                    </div>
                    <Switch
                      id="show_add_button"
                      checked={formData.show_add_button}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_add_button: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="show_edit_button">Tampilkan Tombol Edit</Label>
                      <p className="text-xs text-muted-foreground">Perlihatkan tombol untuk mengedit data</p>
                    </div>
                    <Switch
                      id="show_edit_button"
                      checked={formData.show_edit_button}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_edit_button: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="show_delete_button">Tampilkan Tombol Hapus</Label>
                      <p className="text-xs text-muted-foreground">Perlihatkan tombol untuk menghapus data</p>
                    </div>
                    <Switch
                      id="show_delete_button"
                      checked={formData.show_delete_button}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_delete_button: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="is_active">Status Form</Label>
                      <p className="text-xs text-muted-foreground">Status aktif/non-aktif form</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs ${formData.is_active ? 'text-green-600' : 'text-red-600'}`}>
                        {formData.is_active ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bulk Operations Section - only show when editing existing form */}
              {formTugas?.id && (
                <div className="pt-6 border-t">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <ListPlus className="h-5 w-5 mr-2 text-blue-500" />
                    Operasi Massal Data
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Lakukan operasi pada seluruh data form ini
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="font-medium">Hapus Semua Data</h4>
                      <p className="text-xs text-muted-foreground">
                        Hapus semua entri data yang telah diisi untuk form ini
                      </p>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (window.confirm(`Apakah Anda yakin ingin menghapus semua data untuk form "${formData.nama_tugas}"? Tindakan ini tidak dapat dibatalkan.`)) {
                            handleDeleteAllFormData();
                          }
                        }}
                        disabled={isClearingAll}
                      >
                        {isClearingAll ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Menghapus...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Hapus Semua Data
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">Kosongkan Field Tertentu</h4>
                      <p className="text-xs text-muted-foreground">
                        Kosongkan nilai field tertentu di semua entri data
                      </p>
                      <div className="space-y-3">
                        <div className="max-h-40 overflow-y-auto p-2 border rounded-md">
                          {fields.length > 0 ? (
                            fields.map((field) => (
                              <div key={field.id} className="flex items-center space-x-2 mb-2">
                                <input
                                  type="checkbox"
                                  id={`field-${field.id}`}
                                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedFieldsToClear(prev => [...prev, field.nama_field]);
                                    } else {
                                      setSelectedFieldsToClear(prev =>
                                        prev.filter(f => f !== field.nama_field)
                                      );
                                    }
                                  }}
                                />
                                <label htmlFor={`field-${field.id}`} className="text-sm text-gray-700">
                                  {field.label_field}
                                </label>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500">Tidak ada field tersedia</p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleClearMultipleFields}
                          disabled={selectedFieldsToClear.length === 0 || isClearingFields}
                        >
                          {isClearingFields ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Mengosongkan...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Kosongkan {selectedFieldsToClear.length} Field Terpilih
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'fields' && (
          <FormFieldManager fields={fields} onFieldsChange={setFields} />
        )}
        

      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 mt-4 border-t">
        <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto">
          Batal
        </Button>
        <Button onClick={handleSave} disabled={isLoading} className="w-full sm:w-auto">
          {isLoading ? 'Menyimpan...' : 'Simpan Form'}
        </Button>
      </div>
    </div>
  );
};

export default FormTugasDesigner;
