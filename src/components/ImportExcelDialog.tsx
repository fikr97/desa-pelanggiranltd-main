
import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { parseExcelFile } from '@/utils/excelParser';
import { validatePendudukData, ImportError } from '@/utils/importValidation';
import { supabase } from '@/integrations/supabase/client';
import ImportResultDialog from './ImportResultDialog';

interface ImportExcelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

interface ImportResult {
  success: boolean;
  successCount: number;
  errorCount: number;
  totalProcessed: number;
  errors?: ImportError[];
  message: string;
}

const ImportExcelDialog = ({ open, onOpenChange, onImportComplete }: ImportExcelDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [validationResults, setValidationResults] = useState<any>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile) return;

    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls'].includes(fileExtension || '')) {
      toast({
        title: 'Format file tidak didukung',
        description: 'Silakan pilih file Excel (.xlsx atau .xls)',
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);

    try {
      console.log('Parsing Excel file...');
      const parseResult = await parseExcelFile(selectedFile);
      const parsedData = parseResult.data;
      console.log(`Parsed ${parsedData.length} rows from Excel`);

      setPreviewData(parsedData.slice(0, 10)); // Show first 10 rows for preview

      console.log('Validating data...');
      const validation = validatePendudukData(parsedData);
      setValidationResults(validation);
      console.log(`Validation complete: ${validation.validCount} valid, ${validation.invalidCount} invalid`);

    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: 'Gagal memproses file',
        description: 'Terjadi kesalahan saat membaca file Excel',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!file || !validationResults) return;

    setIsProcessing(true);
    const result: ImportResult = {
      success: false,
      successCount: 0,
      errorCount: 0,
      totalProcessed: validationResults.totalProcessed,
      errors: [],
      message: ''
    };

    try {
      console.log('Starting import process...');
      const { validData } = validationResults;

      // Batch insert for better performance
      const batchSize = 100;
      for (let i = 0; i < validData.length; i += batchSize) {
        const batch = validData.slice(i, i + batchSize);
        
        console.log(`Importing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(validData.length / batchSize)}`);
        
        const { data, error } = await supabase
          .from('penduduk')
          .insert(batch)
          .select();

        if (error) {
          console.error('Batch import error:', error);
          result.errorCount += batch.length;
        } else {
          result.successCount += data?.length || 0;
          console.log(`Successfully imported ${data?.length} records in this batch`);
        }
      }

      result.success = result.successCount > 0;
      result.errorCount = validationResults.totalProcessed - result.successCount;
      result.message = result.success ? 
        `Berhasil mengimport ${result.successCount} data penduduk` : 
        'Gagal mengimport data';

      setImportResult(result);
      setShowResultDialog(true);

      if (result.successCount > 0) {
        toast({
          title: 'Import berhasil',
          description: `Berhasil mengimport ${result.successCount} data penduduk`,
        });
        onImportComplete();
      }

    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Gagal mengimport data',
        description: 'Terjadi kesalahan saat menyimpan data ke database',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetDialog = () => {
    setFile(null);
    setPreviewData([]);
    setValidationResults(null);
    setImportResult(null);
    setShowResultDialog(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDialogClose = () => {
    resetDialog();
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Import Data Penduduk dari Excel
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* File Upload */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="text-center">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                      className="hidden"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="h-32 w-full border-dashed"
                      disabled={isProcessing}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <span>Pilih file Excel (.xlsx, .xls)</span>
                        <span className="text-sm text-muted-foreground">
                          Atau drag & drop file di sini
                        </span>
                      </div>
                    </Button>
                  </div>

                  {file && (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <FileSpreadsheet className="h-4 w-4" />
                      <span className="text-sm">{file.name}</span>
                      <Badge variant="secondary">{(file.size / 1024 / 1024).toFixed(2)} MB</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Processing Indicator */}
            {isProcessing && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Memproses file Excel...</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Validation Results */}
            {validationResults && (
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-semibold">Hasil Validasi</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">
                        Data Valid: <strong>{validationResults.validCount}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm">
                        Data Tidak Valid: <strong>{validationResults.invalidCount}</strong>
                      </span>
                    </div>
                  </div>

                  {validationResults.errors?.length > 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-1">
                          <p><strong>Kesalahan ditemukan:</strong></p>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {validationResults.errors.slice(0, 5).map((error: string, index: number) => (
                              <li key={index}>{error}</li>
                            ))}
                            {validationResults.errors.length > 5 && (
                              <li>... dan {validationResults.errors.length - 5} kesalahan lainnya</li>
                            )}
                          </ul>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Preview Data */}
            {previewData.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Preview Data (10 baris pertama)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse border border-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-200 p-2 text-left">NIK</th>
                          <th className="border border-gray-200 p-2 text-left">Nama</th>
                          <th className="border border-gray-200 p-2 text-left">L/P</th>
                          <th className="border border-gray-200 p-2 text-left">Tempat Lahir</th>
                          <th className="border border-gray-200 p-2 text-left">Agama</th>
                          <th className="border border-gray-200 p-2 text-left">RT</th>
                          <th className="border border-gray-200 p-2 text-left">RW</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="border border-gray-200 p-2">{row.nik}</td>
                            <td className="border border-gray-200 p-2">{row.nama}</td>
                            <td className="border border-gray-200 p-2">{row.jenis_kelamin}</td>
                            <td className="border border-gray-200 p-2">{row.tempat_lahir}</td>
                            <td className="border border-gray-200 p-2">{row.agama}</td>
                            <td className="border border-gray-200 p-2">{row.rt}</td>
                            <td className="border border-gray-200 p-2">{row.rw}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleDialogClose}>
                Batal
              </Button>
              {validationResults && validationResults.validCount > 0 && (
                <Button 
                  onClick={handleImport} 
                  disabled={isProcessing}
                  className="flex items-center gap-2"
                >
                  {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
                  Import {validationResults.validCount} Data Valid
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Result Dialog */}
      <ImportResultDialog
        open={showResultDialog}
        onOpenChange={setShowResultDialog}
        result={importResult}
      />
    </>
  );
};

export default ImportExcelDialog;
