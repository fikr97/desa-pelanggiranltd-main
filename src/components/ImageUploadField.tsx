import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { uploadImage, deleteImage } from '@/integrations/supabase/client';

interface ImageUploadFieldProps {
  value?: string;
  onChange: (value: string | null) => void;
  label: string;
  isRequired?: boolean;
  disabled?: boolean;
  formId?: string; // Used for creating folder structure
}

const ImageUploadField: React.FC<ImageUploadFieldProps> = ({ 
  value, 
  onChange, 
  label, 
  isRequired = false,
  disabled = false,
  formId
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update previewUrl when value changes from outside (e.g. when editing existing form)
  useEffect(() => {
    setPreviewUrl(value || null);
  }, [value]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || disabled) return;

    setUploading(true);
    setUploadProgress(0);
    setFileName(file.name);

    try {
      // Use formId if available to create a folder structure, otherwise use 'general'
      const folder = formId ? `form_${formId}` : 'general';
      const imageUrl = await uploadImage(file, folder);
      
      if (imageUrl) {
        setPreviewUrl(imageUrl);
        onChange(imageUrl);
        setUploadProgress(100);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(`Gagal mengunggah gambar: ${(error as Error).message}`);
      onChange(null);
      setPreviewUrl(null);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemove = async () => {
    if (previewUrl) {
      // Try to delete the image from Supabase storage if it's a public URL
      if (previewUrl.includes('supabase.co')) {
        await deleteImage(previewUrl);
      }
    }
    
    setPreviewUrl(null);
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <Label>
        {label} {isRequired && <span className="text-red-500">*</span>}
      </Label>
      <div className="flex flex-col gap-3">
        {previewUrl ? (
          <Card className="w-full max-w-md">
            <CardHeader className="p-3">
              <CardTitle className="text-sm font-medium flex justify-between items-center">
                <span>Pratinjau Gambar</span>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleRemove}
                  disabled={disabled || uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="flex flex-col items-center">
                <img 
                  src={previewUrl} 
                  alt="Pratinjau" 
                  className="max-h-48 object-contain rounded-md border"
                  onError={(e) => {
                    // If the image fails to load (e.g. has been deleted), clear the preview
                    setPreviewUrl(null);
                    onChange(null);
                  }}
                />
                {fileName && (
                  <p className="text-xs text-muted-foreground mt-2 truncate max-w-full">
                    {fileName}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center">
            <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-2">Klik untuk mengunggah gambar</p>
            <p className="text-xs text-gray-500 mb-3">Format: JPG, PNG, Max 5MB</p>
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              ref={fileInputRef}
              disabled={disabled || uploading}
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span>Uploading {uploadProgress}%</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Pilih Gambar
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploadField;