
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TemplatePreviewProps {
  template: any;
  placeholders: any[];
}

const TemplatePreview = ({ template, placeholders }: TemplatePreviewProps) => {
  const downloadTemplate = () => {
    if (template.konten_template) {
      window.open(template.konten_template, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Preview Template DOCX
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {template.konten_template ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                <div>
                  <p className="font-medium text-green-800">Template DOCX Tersedia</p>
                  <p className="text-sm text-green-600">
                    File: {template.konten_template.split('/').pop()}
                  </p>
                </div>
                <Button variant="outline" onClick={downloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Informasi Template:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Nama Template:</span>
                    <p className="font-medium">{template.nama_template}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Format Nomor:</span>
                    <p className="font-mono text-xs">{template.format_nomor_surat}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Kode Surat:</span>
                    <p>{template.kode_surat}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={template.status === 'Aktif' ? 'default' : 'secondary'}>
                      {template.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Belum ada template DOCX yang diupload
              </p>
              <p className="text-sm text-muted-foreground">
                Upload template DOCX pada tab "Template DOCX"
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Placeholder yang Tersedia</CardTitle>
        </CardHeader>
        <CardContent>
          {placeholders.length > 0 ? (
            <div className="space-y-3">
              {placeholders.map((placeholder, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                      {'{' + placeholder.field_name + '}'}
                    </code>
                    <Badge variant="outline">{placeholder.field_type}</Badge>
                    <Badge variant="secondary">{placeholder.field_format}</Badge>
                    {placeholder.is_multiple && (
                      <Badge variant="destructive">Multiple</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                      {placeholder.field_source || 'Custom field'}
                    </p>
                    {(placeholder.field_type === 'custom_input' || placeholder.field_type === 'custom_textarea') && placeholder.default_value && (
                      <p className="text-xs text-blue-600 mt-1">
                        Default: "{placeholder.default_value}"
                      </p>
                    )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Belum ada placeholder yang dibuat. Tambahkan placeholder pada tab "Placeholder".
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contoh Penggunaan Template</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 p-4 rounded-lg space-y-2">
            <h4 className="font-medium text-blue-800">Cara Kerja System:</h4>
            <ul className="text-sm space-y-1 text-blue-700">
              <li>1. Template DOCX akan diproses menggunakan mail merge</li>
              <li>2. Placeholder seperti {'{nama}'} akan diganti dengan data penduduk</li>
              <li>3. Data dapat diedit sebelum generate final DOCX</li>
              <li>4. Mendukung multiple penduduk dengan format {'{nama_1}'}, {'{nama_2}'}</li>
              <li>5. Format teks dapat disesuaikan (UPPER, lower, Capitalize)</li>
              <li>6. File hasil akan disimpan di server dan dapat didownload</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TemplatePreview;