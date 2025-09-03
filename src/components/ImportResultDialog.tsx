
import React from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, AlertTriangle, FileSpreadsheet, TableIcon } from 'lucide-react';
import { ImportError } from '@/utils/importValidation';

interface ImportResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: {
    success: boolean;
    successCount: number;
    errorCount: number;
    totalProcessed: number;
    errors?: ImportError[];
    message: string;
  } | null;
}

const ImportResultDialog = ({ open, onOpenChange, result }: ImportResultDialogProps) => {
  if (!result) return null;

  const isSuccess = result.success && result.errorCount === 0;
  const hasPartialSuccess = result.successCount > 0 && result.errorCount > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {isSuccess ? (
              <>
                <CheckCircle className="h-6 w-6 text-green-600" />
                <span className="text-green-700">Import Berhasil!</span>
              </>
            ) : hasPartialSuccess ? (
              <>
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
                <span className="text-yellow-700">Import Sebagian Berhasil</span>
              </>
            ) : (
              <>
                <XCircle className="h-6 w-6 text-red-600" />
                <span className="text-red-700">Import Gagal</span>
              </>
            )}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-left space-y-4">
              {/* Summary Statistics */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Ringkasan Import Data
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-card rounded p-3 border-l-4 border-primary">
                    <div className="text-muted-foreground">Total Diproses</div>
                    <div className="text-xl font-bold text-primary">{result.totalProcessed}</div>
                  </div>
                  <div className="bg-card rounded p-3 border-l-4 border-green-500">
                    <div className="text-muted-foreground">Berhasil</div>
                    <div className="text-xl font-bold text-green-600 dark:text-green-400">{result.successCount}</div>
                  </div>
                  <div className="bg-card rounded p-3 border-l-4 border-destructive">
                    <div className="text-muted-foreground">Gagal</div>
                    <div className="text-xl font-bold text-destructive">{result.errorCount}</div>
                  </div>
                </div>
              </div>

              {/* Success Message */}
              {isSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Semua data berhasil diimport!</span>
                  </div>
                  <p className="text-green-700 text-sm mt-2">
                    {result.successCount} data penduduk telah berhasil ditambahkan ke database.
                  </p>
                </div>
              )}

              {/* Partial Success Message */}
              {hasPartialSuccess && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-medium">Import sebagian berhasil</span>
                  </div>
                  <p className="text-yellow-700 text-sm mt-2">
                    {result.successCount} data berhasil diimport, namun {result.errorCount} data gagal karena ada kesalahan validasi.
                  </p>
                </div>
              )}

              {/* Error Message */}
              {result.errorCount > 0 && !hasPartialSuccess && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-800">
                    <XCircle className="h-5 w-5" />
                    <span className="font-medium">Import gagal</span>
                  </div>
                  <p className="text-red-700 text-sm mt-2">
                    Semua data gagal diimport karena terdapat kesalahan validasi.
                  </p>
                </div>
              )}

              {/* Error Details Table */}
              {result.errors && result.errors.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                    <TableIcon className="h-4 w-4" />
                    Detail Error yang Perlu Diperbaiki:
                  </h5>
                  <div className="border rounded-lg bg-card max-h-64 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-20">Baris</TableHead>
                          <TableHead className="w-32">Nama</TableHead>
                          <TableHead className="w-24">Kolom</TableHead>
                          <TableHead className="w-32">Nilai Error</TableHead>
                          <TableHead>Keterangan Error</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.errors.map((error, index) => (
                          <TableRow key={index} className="hover:bg-red-50">
                            <TableCell className="font-medium text-red-600">
                              {error.row}
                            </TableCell>
                            <TableCell className="font-medium">
                              {error.nama || 'Tidak diketahui'}
                            </TableCell>
                            <TableCell>
                              <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-mono">
                                {error.column}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-mono">
                                "{error.value}"
                              </span>
                            </TableCell>
                            <TableCell className="text-sm text-red-600">
                              {error.error}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {result.errors.length > 10 && (
                    <div className="text-sm text-gray-500 text-center mt-2">
                      Menampilkan semua {result.errors.length} error
                    </div>
                  )}
                </div>
              )}

              {/* Next Steps */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 className="font-medium text-blue-800 mb-2">💡 Langkah Selanjutnya:</h5>
                <ul className="text-sm text-blue-700 space-y-1">
                  {isSuccess ? (
                    <li>✅ Data telah berhasil diimport dan siap digunakan</li>
                  ) : (
                    <>
                      <li>📝 Buka file Excel dan perbaiki data sesuai tabel error di atas</li>
                      <li>🔍 Periksa format NIK (16 digit), RT/RW (max 2 karakter)</li>
                      <li>📤 Import ulang file yang sudah diperbaiki</li>
                      <li>📋 Gunakan tabel di atas sebagai panduan untuk mencari baris dan kolom yang error</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogAction 
            onClick={() => onOpenChange(false)}
            className={isSuccess ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}
          >
            {isSuccess ? 'Selesai' : 'Tutup & Perbaiki Data'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ImportResultDialog;
