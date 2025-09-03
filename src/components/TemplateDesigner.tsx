
import React, { useState, useEffect } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, Eye, Settings, FileText } from 'lucide-react';
import PlaceholderManager from '@/components/PlaceholderManager';

interface TemplateDesignerProps {
  template?: any;
  onSave: () => void;
  onCancel: () => void;
}

const TemplateDesigner = ({ template, onSave, onCancel }: TemplateDesignerProps) => {
  const [formData, setFormData] = useState({
    nama_template: '',
    deskripsi: '',
    konten_template: '', // Akan berisi nama file DOCX
    format_nomor_surat: '[indeks_no]/[no]/[kode]/[kode_desa]/[bulan_romawi]/[tahun]',
    indeks_nomor: 470,
    kode_surat: 'UMUM',
    kode_desa: 'DSA',
    status: 'Aktif'
  });
  
  const [placeholders, setPlaceholders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'design' | 'placeholders' | 'template'>('design');
  const [isLoading, setIsLoading] = useState(false);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [templateUrl, setTemplateUrl] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (template) {
      setFormData({
        nama_template: template.nama_template || '',
        deskripsi: template.deskripsi || '',
        konten_template: template.konten_template || '',
        format_nomor_surat: template.format_nomor_surat || '[indeks_no]/[no]/[kode]/[kode_desa]/[bulan_romawi]/[tahun]',
        indeks_nomor: template.indeks_nomor || 470,
        kode_surat: template.kode_surat || 'UMUM',
        kode_desa: template.kode_desa || 'DSA',
        status: template.status || 'Aktif'
      });
      setTemplateUrl(template.konten_template || '');
      loadPlaceholders(template.id);
    }
  }, [template]);

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.docx')) {
      toast({
        title: 'Error',
        description: 'Hanya file DOCX yang diizinkan',
        variant: 'destructive',
      });
      return;
    }

    setTemplateFile(file);
    setIsLoading(true);

    try {
      // Upload file to Supabase storage
      const fileName = `template_${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from('surat-docx')
        .upload(`templates/${fileName}`, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('surat-docx')
        .getPublicUrl(`templates/${fileName}`);

      setTemplateUrl(publicUrl);
      setFormData(prev => ({ ...prev, konten_template: publicUrl }));

      toast({
        title: 'Berhasil',
        description: 'Template DOCX berhasil diupload',
      });
    } catch (error) {
      console.error('Error uploading template:', error);
      toast({
        title: 'Gagal',
        description: 'Gagal mengupload template DOCX',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.konten_template) {
      toast({
        title: 'Error',
        description: 'Silakan upload template DOCX terlebih dahulu',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      let templateId = template?.id;

      if (template) {
        // Update existing template
        const { error } = await supabase
          .from('surat_template')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', template.id);
        
        if (error) throw error;
      } else {
        // Create new template
        const { data, error } = await supabase
          .from('surat_template')
          .insert([formData])
          .select()
          .single();
        
        if (error) throw error;
        templateId = data.id;
      }

      // Save placeholders using the new atomic RPC function
      if (templateId) {
        // The function handles both cases: new placeholders and empty placeholders.
        const { error: rpcError } = await supabase.rpc('update_surat_field_mapping', {
          template_id_param: templateId,
          placeholders_data: placeholders
        });

        if (rpcError) throw rpcError;
      }

      onSave();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: 'Gagal',
        description: 'Terjadi kesalahan saat menyimpan template',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = () => {
    if (templateUrl) {
      window.open(templateUrl, '_blank');
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="flex border-b mb-4">
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'design' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('design')}
        >
          <Settings className="h-4 w-4 inline mr-2" />
          Pengaturan Template
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'template' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('template')}
        >
          <FileText className="h-4 w-4 inline mr-2" />
          Template DOCX
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'placeholders' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('placeholders')}
        >
          <Upload className="h-4 w-4 inline mr-2" />
          Placeholder
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {activeTab === 'design' && (
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Template</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="nama_template">Nama Template</Label>
                <Input
                  id="nama_template"
                  value={formData.nama_template}
                  onChange={(e) => setFormData(prev => ({ ...prev, nama_template: e.target.value }))}
                  placeholder="Contoh: Surat Keterangan Domisili"
                />
              </div>

              <div>
                <Label htmlFor="deskripsi">Deskripsi</Label>
                <Input
                  id="deskripsi"
                  value={formData.deskripsi}
                  onChange={(e) => setFormData(prev => ({ ...prev, deskripsi: e.target.value }))}
                  placeholder="Deskripsi template surat..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="kode_surat">Kode Surat</Label>
                  <Input
                    id="kode_surat"
                    value={formData.kode_surat}
                    onChange={(e) => setFormData(prev => ({ ...prev, kode_surat: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="kode_desa">Kode Desa</Label>
                  <Input
                    id="kode_desa"
                    value={formData.kode_desa}
                    onChange={(e) => setFormData(prev => ({ ...prev, kode_desa: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="indeks_nomor">Indeks Nomor</Label>
                  <Input
                    id="indeks_nomor"
                    type="number"
                    value={formData.indeks_nomor}
                    onChange={(e) => setFormData(prev => ({ ...prev, indeks_nomor: parseInt(e.target.value) || 470 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Aktif">Aktif</SelectItem>
                      <SelectItem value="Tidak Aktif">Tidak Aktif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="format_nomor_surat">Format Nomor Surat</Label>
                <Input
                  id="format_nomor_surat"
                  value={formData.format_nomor_surat}
                  onChange={(e) => setFormData(prev => ({ ...prev, format_nomor_surat: e.target.value }))}
                  placeholder="[indeks_no]/[no]/[kode]/[kode_desa]/[bulan_romawi]/[tahun]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Gunakan: [indeks_no], [no], [kode], [kode_desa], [bulan_romawi], [tahun]
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'template' && (
          <Card>
            <CardHeader>
              <CardTitle>Template DOCX</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="template_file">Upload Template DOCX</Label>
                <Input
                  id="template_file"
                  type="file"
                  accept=".docx"
                  onChange={handleFileUpload}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Upload file template DOCX dengan placeholder seperti: {'{nama}'}, {'{nik}'}, {'{alamat}'}
                </p>
              </div>

              {templateUrl && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Template Tersimpan</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadTemplate}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Template
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    File template: {templateUrl.split('/').pop()}
                  </p>
                </div>
              )}

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Cara Membuat Template DOCX:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>1. Buat dokumen Word dengan konten surat</li>
                  <li>2. Gunakan placeholder dengan format: {'{nama_field}'}</li>
                  <li>3. Contoh: {'{nama}'}, {'{nik}'}, {'{alamat_lengkap}'}, {'{tanggal_surat}'}</li>
                  <li>4. Untuk multiple data gunakan: {'{nama_1}'}, {'{nama_2}'}</li>
                  <li>5. Simpan sebagai file .docx</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'placeholders' && (
          <PlaceholderManager
            placeholders={placeholders}
            onPlaceholdersChange={setPlaceholders}
          />
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? 'Menyimpan...' : 'Simpan Template'}
        </Button>
      </div>
    </div>
  );
};

export default TemplateDesigner;