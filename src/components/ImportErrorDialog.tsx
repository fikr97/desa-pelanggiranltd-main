
import React from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';
import { ImportError } from '@/utils/importValidation';

interface ImportErrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  errors: ImportError[];
  successCount: number;
}

const ImportErrorDialog = ({ open, onOpenChange, errors, successCount }: ImportErrorDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Hasil Import Data Excel
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            <div className="space-y-2">
              <div className="text-green-600 font-medium">
                ✅ Data yang berhasil divalidasi: <strong>{successCount} baris</strong>
              </div>
              <div className="text-red-600 font-medium">
                ❌ Data yang gagal validasi: <strong>{errors.length} baris</strong>
              </div>
              <div className="text-sm text-gray-600 mt-3">
                Silakan perbaiki data yang error di file Excel, lalu import ulang.
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="max-h-96 overflow-y-auto border rounded-md">
          <div className="space-y-3 p-4">
            {errors.map((error, index) => (
              <div key={index} className="border-l-4 border-destructive bg-destructive/10 p-4 rounded-r-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <div className="font-semibold text-sm text-destructive">
                      🚨 Baris {error.row} (di Excel)
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Nama:</span> {error.nama || 'Tidak diketahui'}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Kolom Error:</span> <span className="font-mono bg-red-100 px-2 py-1 rounded text-red-800">{error.column}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Nilai saat ini:</span> 
                      <span className="ml-1 font-mono bg-yellow-100 px-2 py-1 rounded text-yellow-800">"{error.value}"</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-red-700">Masalah:</span> 
                      <span className="ml-1 text-red-600">{error.error}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-4">
          <h4 className="font-semibold text-blue-800 mb-2">💡 Panduan Perbaikan:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li><strong>RT/RW:</strong> Gunakan format maksimal 2 karakter (01, 02, 1, 2)</li>
            <li><strong>NIK:</strong> Harus tepat 16 digit angka tanpa spasi</li>
            <li><strong>NO_KK:</strong> Harus tepat 16 digit angka tanpa spasi</li>
            <li><strong>NAMA:</strong> Wajib diisi, tidak boleh kosong</li>
          </ul>
          <div className="mt-3 text-sm text-blue-700">
            <strong>Langkah selanjutnya:</strong> Buka file Excel, perbaiki data di baris dan kolom yang error, lalu import ulang.
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogAction 
            onClick={() => onOpenChange(false)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Tutup & Perbaiki Data
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ImportErrorDialog;
