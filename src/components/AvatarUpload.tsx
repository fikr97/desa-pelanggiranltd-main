import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Upload, Loader2, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { uploadProfileAvatar, deleteImage, updateProfileAvatar } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AvatarUploadProps {
  currentAvatar?: string | null;
  userId: string;
  onAvatarChange: (avatarUrl: string | null) => void;
  label?: string;
  maxSize?: number; // in MB
  className?: string;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatar,
  userId,
  onAvatarChange,
  label = 'Foto Profil',
  maxSize = 2,
  className = ''
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { refreshProfile } = useAuth();

  // Initialize preview URL when currentAvatar changes
  useEffect(() => {
    setPreviewUrl(currentAvatar || null);
  }, [currentAvatar]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setError(null);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Hanya file gambar yang diperbolehkan');
      toast({
        title: 'Format tidak didukung',
        description: 'Hanya file gambar yang diperbolehkan',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`Ukuran file maksimal ${maxSize}MB`);
      toast({
        title: 'Ukuran file terlalu besar',
        description: `Ukuran file maksimal ${maxSize}MB`,
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Create preview immediately for better UX
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      // Upload to Supabase storage
      const uploadedUrl = await uploadProfileAvatar(file);
      
      if (uploadedUrl) {
        // Update the user's profile with the new avatar URL
        const success = await updateProfileAvatar(userId, uploadedUrl);
        
        if (success) {
          onAvatarChange(uploadedUrl);
          // Refresh the profile to update the avatar immediately
          await refreshProfile();
          toast({
            title: 'Berhasil',
            description: 'Foto profil berhasil diperbarui'
          });
        } else {
          setError('Gagal memperbarui profil');
          toast({
            title: 'Gagal',
            description: 'Gagal memperbarui profil',
            variant: 'destructive'
          });
        }
      } else {
        setError('Gagal mengunggah gambar');
        toast({
          title: 'Gagal',
          description: 'Gagal mengunggah gambar',
          variant: 'destructive'
        });
      }
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError('Terjadi kesalahan saat mengunggah');
      toast({
        title: 'Gagal',
        description: 'Terjadi kesalahan saat mengunggah gambar',
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

  const removeAvatar = async () => {
    try {
      if (currentAvatar) {
        // Delete the old avatar from storage
        await deleteImage(currentAvatar);
      }

      // Update the user's profile to remove the avatar URL
      const success = await updateProfileAvatar(userId, null);
      
      if (success) {
        setPreviewUrl(null);
        onAvatarChange(null);
        // Refresh the profile to update the avatar immediately
        await refreshProfile();
        toast({
          title: 'Berhasil',
          description: 'Foto profil berhasil dihapus'
        });
      } else {
        toast({
          title: 'Gagal',
          description: 'Gagal menghapus foto profil',
          variant: 'destructive'
        });
      }
    } catch (err) {
      console.error('Error removing avatar:', err);
      toast({
        title: 'Gagal',
        description: 'Terjadi kesalahan saat menghapus foto profil',
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
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
        {previewUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={removeAvatar}
            disabled={uploading}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Hapus
          </Button>
        )}
      </div>

      <div 
        className="border-2 border-dashed border-gray-300 rounded-full w-32 h-32 mx-auto flex items-center justify-center cursor-pointer hover:border-primary transition-colors relative overflow-hidden"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={triggerFileSelect}
      >
        {uploading ? (
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="mt-2 text-sm">Mengunggah...</span>
            {uploadProgress !== null && (
              <div className="mt-1 text-xs">{uploadProgress}%</div>
            )}
          </div>
        ) : previewUrl ? (
          <img 
            src={previewUrl} 
            alt="Preview avatar" 
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400">
            <Camera className="h-8 w-8" />
            <span className="text-xs mt-1">Klik atau seret file</span>
          </div>
        )}

        {/* Upload overlay */}
        {!uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <Upload className="h-6 w-6 text-white" />
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          accept="image/*"
        />
      </div>

      {error && (
        <div className="text-sm text-destructive text-center">{error}</div>
      )}

      <div className="text-xs text-muted-foreground text-center">
        Format: JPG, PNG, GIF. Maksimal {maxSize}MB. Seret & lepas untuk mengganti.
      </div>
    </div>
  );
};

export default AvatarUpload;