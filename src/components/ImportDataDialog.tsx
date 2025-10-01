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
import { Loader2 } from 'lucide-react';

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
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ processed: 0, total: 0, success: 0, error: 0 });
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
        description: `Field berikut wajib diisi tetapi belum dipetap: ${unmappedRequiredFields.map((f: any) => f.label_field).join(', ')}`,
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsImporting(true);
      setImportProgress({ processed: 0, total: parsedData.length, success: 0, error: 0 });
      
      // Define batch size for processing
      const batchSize = 100; // Process in batches of 100
      let successCount = 0;
      let errorCount = 0;
      
      // Process data in batches to avoid overwhelming the database
      for (let i = 0; i < parsedData.length; i += batchSize) {
        const batch = parsedData.slice(i, i + batchSize);
        let batchSuccessCount = 0;
        let batchErrorCount = 0;
        
        // Process each item individually to handle errors gracefully
        for (let j = 0; j < batch.length; j++) {
          const row = batch[j];
          try {
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

            // Insert individual record
            const { error: insertError } = await supabase
              .from('form_tugas_data')
              .insert([payload]);

            if (insertError) {
              console.error('Individual import error:', insertError);
              batchErrorCount++;
            } else {
              batchSuccessCount++;
            }
          } catch (individualError) {
            console.error('Individual import exception:', individualError);
            batchErrorCount++;
          }
          
          // Update progress
          const processedCount = i + j + 1;
          const totalSuccess = successCount + batchSuccessCount;
          const totalError = errorCount + batchErrorCount;
          setImportProgress({
            processed: processedCount,
            total: parsedData.length,
            success: totalSuccess,
            error: totalError
          });
        }
        
        successCount += batchSuccessCount;
        errorCount += batchErrorCount;
      }

      // Final result notification
      if (errorCount > 0) {
        toast({
          title: 'Proses import selesai dengan beberapa kesalahan',
          description: `Berhasil mengimpor ${successCount} data, ${errorCount} gagal dari total ${parsedData.length} data.`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Berhasil',
          description: `Berhasil mengimpor ${successCount} data.`,
        });
      }

      setIsImporting(false);
      onClose();
    } catch (error: any) {
      setIsImporting(false);
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
              disabled={isImporting}
            />
            {fileName && <p className="text-xs text-muted-foreground mt-1">File dipilih: {fileName}</p>}
          </div>

          {isImporting && (
            <div className="space-y-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Mengimpor Data...</h3>
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
              <div className="space-y-2">
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${(importProgress.processed / importProgress.total) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{importProgress.processed} dari {importProgress.total} diproses</span>
                  <span>{Math.round((importProgress.processed / importProgress.total) * 100)}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-green-600">Berhasil: {importProgress.success}</span>
                  <span className="text-red-600">Gagal: {importProgress.error}</span>
                </div>
              </div>
            </div>
          )}

          {parsedData.length > 0 && !isImporting && (
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
                            disabled={isImporting}
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
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="w-full sm:w-auto text-sm"
            disabled={isImporting}
          >
            Batal
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={!parsedData.length || isImporting}
            className="w-full sm:w-auto text-sm"
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Mengimpor...
              </>
            ) : (
              `Impor Data (${parsedData.length})`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportDataDialog;