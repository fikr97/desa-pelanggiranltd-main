import React, { useCallback, useRef, useState } from 'react';
import { Upload, X, FileText, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { UploadedFile } from './types';
import { MAX_FILE_SIZE } from './config';

interface FileDropzoneProps {
  files: UploadedFile[];
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  accept: string;
  multiple?: boolean;
  label?: string;
  disabled?: boolean;
}

function validateFile(file: File, accept: string): string | null {
  const exts = accept.split(',').map(e => e.trim().toLowerCase());
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!exts.includes(ext)) return 'Format file tidak didukung. Gunakan JPG, PNG, atau PDF';
  if (file.size > MAX_FILE_SIZE) return 'Ukuran file melebihi 10MB';
  return null;
}

const FileDropzone: React.FC<FileDropzoneProps> = ({ files, onAdd, onRemove, accept, multiple = false, label, disabled }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    const dropped = Array.from(e.dataTransfer.files);
    onAdd(multiple ? dropped : dropped.slice(0, 1));
  }, [onAdd, multiple, disabled]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    onAdd(multiple ? selected : selected.slice(0, 1));
    e.target.value = '';
  };

  const handlePreview = (f: UploadedFile) => {
    if (f.type === 'application/pdf') {
      // PDF: open in new tab
      const url = f.preview || URL.createObjectURL(f.file);
      window.open(url, '_blank');
    } else if (f.preview) {
      // Image: show lightbox
      setPreviewUrl(f.preview);
    }
  };

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium">{label}</p>}
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}`}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        <Upload className="mx-auto h-6 w-6 text-muted-foreground mb-1" />
        <p className="text-sm text-muted-foreground">Drag & drop atau <span className="text-primary font-medium">pilih file</span></p>
        <p className="text-xs text-muted-foreground mt-1">Maks 10MB · {accept.replace(/\./g, '').toUpperCase()}</p>
        <input ref={inputRef} type="file" accept={accept} multiple={multiple} onChange={handleChange} className="hidden" disabled={disabled} />
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
          {files.map(f => (
            <div key={f.id} className="relative border rounded-md p-2 group">
              {f.error ? (
                <div className="text-xs text-destructive">{f.error}</div>
              ) : f.type.startsWith('image/') && f.preview ? (
                <img src={f.preview} alt={f.name} className="h-16 w-full object-cover rounded" />
              ) : (
                <div className="flex items-center gap-1 h-16 justify-center">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs truncate max-w-[80px]">{f.name}</span>
                </div>
              )}
              {f.progress < 100 && !f.error && <Progress value={f.progress} className="h-1 mt-1" />}
              {/* Action buttons */}
              <div className="absolute -top-2 -right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {!f.error && (
                  <Button variant="secondary" size="icon" className="h-5 w-5" onClick={e => { e.stopPropagation(); handlePreview(f); }}>
                    <Eye className="h-3 w-3" />
                  </Button>
                )}
                {!disabled && (
                  <Button variant="destructive" size="icon" className="h-5 w-5" onClick={e => { e.stopPropagation(); onRemove(f.id); }}>
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Lightbox */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-3xl p-2">
          {previewUrl && <img src={previewUrl} alt="Preview" className="w-full h-auto max-h-[80vh] object-contain rounded" />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export { FileDropzone, validateFile };
