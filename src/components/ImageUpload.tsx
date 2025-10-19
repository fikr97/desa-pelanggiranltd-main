import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Upload, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ImageUploadProps {
  value?: string | string[]; // Can be a single image URL or array of URLs
  onChange: (value: string | string[]) => void;
  label?: string;
  placeholder?: string;
  multiple?: boolean; // Whether multiple images can be uploaded
  maxSize?: number; // Maximum file size in MB
  maxFiles?: number; // Maximum number of files for multiple mode
  formId?: string; // Form ID to organize images in storage
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  label = 'Upload Gambar',
  placeholder = 'Pilih gambar untuk diunggah',
  multiple = false,
  maxSize = 5, // 5MB default
  maxFiles = 10, // 10 files default for multiple
  formId = 'general' // Default general form ID
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showImage, setShowImage] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Initialize preview URLs based on the current value
  useEffect(() => {
    if (value) {
      const urls = Array.isArray(value) ? value : [value];
      setPreviewUrls(urls);
    } else {
      setPreviewUrls([]);
    }
  }, [value]);

  const uploadFileToStorage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      if (!fileExt || !['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt)) {
        toast({
          title: 'Gagal',
          description: 'Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WebP.',
          variant: 'destructive'
        });
        return null;
      }

      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
      const safeFormId = formId ? formId.toString().replace(/[^a-zA-Z0-9-_]/g, '_') : 'general';
      const filePath = `form-images/${safeFormId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('content-images') // Use the existing content-images bucket that's already configured
        .upload(filePath, file, { 
          upsert: true // Replace if exists
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('content-images') // Use the same bucket for getting the URL
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Gagal',
        description: 'Gagal mengunggah gambar. Silakan coba lagi.',
        variant: 'destructive'
      });
      return null;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    
    // Validate file types and sizes
    for (const file of newFiles) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Format tidak didukung',
          description: 'Hanya file gambar yang diperbolehkan',
          variant: 'destructive'
        });
        return;
      }

      if (file.size > maxSize * 1024 * 1024) {
        toast({
          title: 'Ukuran file terlalu besar',
          description: `Maksimal ${maxSize}MB per file.`,
          variant: 'destructive'
        });
        return;
      }
    }

    // Check if multiple files exceed the limit
    if (multiple) {
      const currentCount = Array.isArray(value) ? value.length : value ? 1 : 0;
      if (currentCount + newFiles.length > maxFiles) {
        toast({
          title: 'Terlalu banyak file',
          description: `Maksimal ${maxFiles} file dapat diunggah`,
          variant: 'destructive'
        });
        return;
      }
    } else if ((Array.isArray(value) ? value.length : value ? 1 : 0) + newFiles.length > 1) {
      toast({
        title: 'Terlalu banyak file',
        description: 'Hanya 1 file yang dapat diunggah',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);
    setError(null);
    
    try {
      const uploadedUrls: string[] = [];
      
      for (let i = 0; i < newFiles.length; i++) {
        setUploadProgress(Math.round(((i + 1) / newFiles.length) * 100));
        
        const uploadedUrl = await uploadFileToStorage(newFiles[i]);
        if (uploadedUrl) {
          uploadedUrls.push(uploadedUrl);
        }
      }

      if (uploadedUrls.length > 0) {
        let newPreviewUrls: string[];
        if (multiple && Array.isArray(value)) {
          newPreviewUrls = [...value, ...uploadedUrls];
        } else if (multiple) {
          newPreviewUrls = [...uploadedUrls];
        } else {
          // For single image, replace current value with new one
          newPreviewUrls = [uploadedUrls[0]];
        }
        
        setPreviewUrls(newPreviewUrls);
        onChange(multiple ? newPreviewUrls : newPreviewUrls[0]);
        
        toast({
          title: 'Berhasil',
          description: `Gambar ${multiple && uploadedUrls.length > 1 ? 'berhasil diunggah' : 'berhasil diunggah'}`
        });
      }
    } catch (error) {
      console.error('Error during upload:', error);
      toast({
        title: 'Gagal',
        description: 'Gagal mengunggah gambar. Silakan coba lagi.',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
      setUploadProgress(null);
      // Reset the file input to allow re-upload of same files
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = async (index: number, imageUrl: string) => {
    try {
      // Extract file path from the public URL
      // The URL structure is typically: https://[project-ref].supabase.co/storage/v1/object/public/content-images/form-images/[formId]/[filename]
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split('/'); // This will be ['storage', 'v1', 'object', 'public', 'content-images', ...]
      
      // Find the bucket name and construct the file path
      const bucketIndex = pathParts.indexOf('content-images');
      if (bucketIndex !== -1) {
        // Reconstruct the path from the bucket onwards
        const filePath = pathParts.slice(bucketIndex + 1).join('/');
        
        // Delete from Supabase storage
        const { error: deleteError } = await supabase.storage
          .from('content-images') // Use the same bucket as upload
          .remove([filePath]);
          
        if (deleteError) {
          console.error('Error deleting file:', deleteError);
          // Still proceed with UI update even if deletion fails
        }
      } else {
        // If we can't parse the path, just update UI and log warning
        console.warn('Could not parse file path from URL, only removing from UI', imageUrl);
      }
      
      if (multiple && Array.isArray(value)) {
        const updatedValue = [...value];
        updatedValue.splice(index, 1);
        onChange(updatedValue);
        
        // Also update the local state
        const updatedPreviews = [...previewUrls];
        updatedPreviews.splice(index, 1);
        setPreviewUrls(updatedPreviews);
      } else {
        // For single image
        onChange('');
        setPreviewUrls([]);
      }
      
      toast({
        title: 'Berhasil',
        description: 'Gambar berhasil dihapus'
      });
    } catch (error) {
      console.error('Error removing image:', error);
      toast({
        title: 'Gagal',
        description: 'Gagal menghapus gambar.',
        variant: 'destructive'
      });
    }
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    // Create a synthetic event to trigger file upload
    const dataTransfer = new DataTransfer();
    for (let i = 0; i < files.length; i++) {
      dataTransfer.items.add(files[i]);
    }

    const event = { target: { files: dataTransfer.files } } as unknown as React.ChangeEvent<HTMLInputElement>;
    handleFileChange(event);
  };

  return (
    <div className="space-y-4">
      <Label>{label}</Label>
      <div 
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={triggerFileSelect}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">{placeholder}</p>
        <p className="text-xs text-gray-500 mt-1">JPG, PNG, GIF hingga {maxSize}MB</p>
        
        {uploading && (
          <div className="mt-2">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Mengunggah...</span>
            </div>
            {uploadProgress !== null && (
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}
          </div>
        )}
        
        <Input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          multiple={multiple}
          accept="image/*"
        />
      </div>
      
      {error && (
        <div className="text-sm text-destructive">{error}</div>
      )}
      
      {previewUrls.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Pratinjau Gambar</h4>
          <div className={`grid ${multiple ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'} gap-4`}>
            {previewUrls.map((url, index) => (
              <div key={index} className="relative group">
                <div className="border rounded-lg overflow-hidden bg-gray-100">
                  {showImage ? (
                    <img 
                      src={url} 
                      alt={`Preview ${index + 1}`} 
                      className="w-full h-40 object-cover"
                    />
                  ) : (
                    <div className="w-full h-40 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500">Gambar Tersembunyi</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(index, url);
                      }}
                      className="mr-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowImage(!showImage);
                      }}
                    >
                      {showImage ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-center mt-1 text-muted-foreground">
                  Gambar {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {previewUrls.length > 0 && !multiple && (
        <div className="text-xs text-muted-foreground">
          Klik pada area pratinjau untuk melihat opsi (hapus, sembunyikan)
        </div>
      )}
    </div>
  );
};

export default ImageUpload;