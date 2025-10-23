import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Settings, ListPlus } from 'lucide-react';
import FormFieldManager from './FormFieldManager';
import { useAuth } from '@/contexts/AuthContext';
import { Switch } from '@/components/ui/switch';

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
  });
  const [fields, setFields] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'settings' | 'fields'>('settings');
  const [isLoading, setIsLoading] = useState(false);
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
      setFormData({
        nama_tugas: formTugas.nama_tugas || '',
        deskripsi: formTugas.deskripsi || '',
        display_type: formTugas.display_type || 'table',
        show_add_button: formTugas.show_add_button !== undefined ? formTugas.show_add_button : true,
        show_edit_button: formTugas.show_edit_button !== undefined ? formTugas.show_edit_button : true,
        show_delete_button: formTugas.show_delete_button !== undefined ? formTugas.show_delete_button : true,
      });
      loadFields(formTugas.id);
    } else {
      // Reset fields when creating a new form
      setFormData({
        nama_tugas: '',
        deskripsi: '',
        display_type: 'table',
        show_add_button: true,
        show_edit_button: true,
        show_delete_button: true,
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
      let formId = formTugas?.id;

      // 1. Save the main form data (form_tugas table)
      if (formId) {
        // Update existing form
        const { error } = await supabase
          .from('form_tugas')
          .update({ 
            nama_tugas: formData.nama_tugas,
            deskripsi: formData.deskripsi,
            display_type: formData.display_type,
            show_add_button: formData.show_add_button,
            show_edit_button: formData.show_edit_button,
            show_delete_button: formData.show_delete_button,
            updated_at: new Date().toISOString() 
          })
          .eq('id', formId);
        if (error) throw error;
      } else {
        // Create new form
        const { data, error } = await supabase
          .from('form_tugas')
          .insert([{ 
            ...formData, 
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
        description: 'Form tugas telah berhasil disimpan.',
      });

      // Notify kadus
      const message = formId
        ? `Form tugas "${formData.nama_tugas}" telah diperbarui.`
        : `Form tugas baru "${formData.nama_tugas}" telah dibuat.`;
      const link = formId ? `/form-tugas/${formId}/data` : '/form-tugas';

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
                </div>
              </div>
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
