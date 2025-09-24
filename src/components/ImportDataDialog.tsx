import React, { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ImportDataDialogProps {
  formDef: any;
  residents: any[];
  isOpen: boolean;
  onClose: () => void;
}

const ImportDataDialog: React.FC<ImportDataDialogProps> = ({ 
  formDef, 
  residents, 
  isOpen, 
  onClose 
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({});
  const [fileName, setFileName] = useState<string>('');
  const { toast } = useToast();
  const { user } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          setParsedData(jsonData);
          
          // Initialize field mappings based on CSV headers
          if (jsonData.length > 0) {
            const csvHeaders = Object.keys(jsonData[0]);
            const initialMappings: Record<string, string> = {};
            csvHeaders.forEach(header => {
              initialMappings[header] = ''; // Initially no mapping
            });
            setFieldMappings(initialMappings);
          }
        } catch (error) {
          toast({
            title: 'Gagal membaca file',
            description: 'Gagal membaca file CSV. Pastikan file valid.',
            variant: 'destructive',
          });
        }
      };
      reader.readAsArrayBuffer(selectedFile);
    }
  };

  const handleFieldMappingChange = (csvHeader: string, formFieldName: string) => {
    setFieldMappings(prev => ({
      ...prev,
      [csvHeader]: formFieldName
    }));
  };

  const getResidentId = (row: any) => {
    // Try to find a matching resident based on common fields
    const nik = row['NIK'] || row['nik'] || row['Nik'];
    if (nik) {
      const resident = residents.find(r => r.nik === nik);
      return resident?.id || null;
    }
    
    // If NIK is not found, you can add other matching strategies here
    // For example, matching by name and birth date, etc.
    return null;
  };

  const handleImport = async () => {
    if (!parsedData.length) {
      toast({
        title: 'Tidak ada data',
        description: 'Tidak ada data yang ditemukan untuk diimpor.',
        variant: 'destructive',
      });
      return;
    }

    // Validate that all required headers are mapped
    const requiredFields = formDef.fields.filter((f: any) => f.is_required);
    const unmappedRequiredFields = requiredFields.filter((field: any) => {
      return !Object.values(fieldMappings).includes(field.nama_field);
    });

    if (unmappedRequiredFields.length > 0) {
      toast({
        title: 'Field wajib belum dipetakan',
        description: `Field berikut wajib diisi tetapi belum dipetakan: ${unmappedRequiredFields.map((f: any) => f.label_field).join(', ')}`,
        variant: 'destructive',
      });
      return;
    }

    try {
      const importPromises = parsedData.map(async (row) => {
        // Get resident ID if available
        const residentId = getResidentId(row);
        
        // Create data_custom object based on field mappings
        const data_custom: Record<string, any> = {};
        Object.entries(fieldMappings).forEach(([csvHeader, formFieldName]) => {
          if (formFieldName && formFieldName !== 'ignore') {
            data_custom[formFieldName] = row[csvHeader];
          }
        });

        // Prepare payload for insertion
        const payload = {
          form_tugas_id: formDef.id,
          penduduk_id: residentId, // Will be null if no matching resident found
          data_custom,
          user_id: user?.id, // Use the authenticated user's ID
        };

        return supabase.from('form_tugas_data').insert(payload);
      });

      // Execute all insertions
      const results = await Promise.allSettled(importPromises);
      
      // Count successful imports
      const successCount = results.filter(result => result.status === 'fulfilled').length;
      const errorCount = results.filter(result => result.status === 'rejected').length;

      if (errorCount > 0) {
        toast({
          title: 'Sebagian data telah diimpor',
          description: `Berhasil mengimpor ${successCount} data, ${errorCount} gagal.`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Berhasil',
          description: `Berhasil mengimpor ${successCount} data.`,
        });
      }

      onClose();
    } catch (error: any) {
      toast({
        title: 'Gagal mengimpor data',
        description: error.message || 'Terjadi kesalahan saat mengimpor data.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-4xl max-h-[80vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Impor Data untuk {formDef.nama_tugas}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 max-h-[50vh] overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="csv-upload" className="text-sm">Pilih File CSV</Label>
            <Input
              id="csv-upload"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="text-sm"
            />
            {fileName && <p className="text-xs text-muted-foreground mt-1">File dipilih: {fileName}</p>}
          </div>

          {parsedData.length > 0 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <Label className="text-sm">Mapping Field</Label>
                <p className="text-xs text-muted-foreground">
                  Petakan kolom CSV ke field formulir. Pilih "Abaikan" jika kolom tidak perlu diimpor.
                </p>
              </div>
              
              <div className="border rounded-md p-2 max-h-[120px] overflow-y-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-xs">
                      <th className="text-left p-1">Kolom CSV</th>
                      <th className="text-left p-1">Mapping ke Field Form</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(fieldMappings).map((header, index) => (
                      <tr key={index} className="border-b text-xs">
                        <td className="p-1 font-mono">{header}</td>
                        <td className="p-1">
                          <Select
                            value={fieldMappings[header] || ''}
                            onValueChange={(value) => handleFieldMappingChange(header, value)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Pilih..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ignore">Abaikan</SelectItem>
                              {formDef.fields.map((field: any) => (
                                <SelectItem key={field.id} value={field.nama_field}>
                                  {field.label_field}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="space-y-1">
                <Label className="text-sm">Pratinjau Data</Label>
                <div className="border rounded-md overflow-auto max-h-[120px]">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-xs">
                        {Object.keys(fieldMappings).map((header, index) => (
                          <th key={index} className="text-left p-1">
                            {header}
                            {fieldMappings[header] && fieldMappings[header] !== 'ignore' && (
                              <span className="text-xs text-muted-foreground block">
                                → {formDef.fields.find((f: any) => f.nama_field === fieldMappings[header])?.label_field}
                              </span>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.slice(0, 3).map((row, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50 text-xs">
                          {Object.keys(fieldMappings).map((header, cellIndex) => (
                            <td key={cellIndex} className="p-1 max-w-[100px] truncate">
                              {row[header] || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                      {parsedData.length > 3 && (
                        <tr>
                          <td colSpan={Object.keys(fieldMappings).length} className="p-1 text-center text-xs text-muted-foreground">
                            ... dan {parsedData.length - 3} baris lainnya
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto text-sm">
            Batal
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={!parsedData.length}
            className="w-full sm:w-auto text-sm"
          >
            Impor Data ({parsedData.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportDataDialog;