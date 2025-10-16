import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload, X, Save } from 'lucide-react';

interface ContentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'konten' | 'berita' | 'galeri' | 'halaman';
  editData?: any;
}

const ContentForm = ({ open, onOpenChange, type, editData }: ContentFormProps) => {
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(editData?.gambar || editData?.url_media || null);
  const queryClient = useQueryClient();

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
    defaultValues: editData || {}
  });

  // Reset form values when editData changes (when editing an item)
  useEffect(() => {
    if (editData) {
      reset(editData);
      setImagePreview(editData.gambar || editData.url_media || null);
    } else {
      reset({});
      setImagePreview(null);
    }
  }, [editData, reset]);

  const getTableName = () => {
    switch (type) {
      case 'konten': return 'konten_website';
      case 'berita': return 'berita';
      case 'galeri': return 'galeri';
      case 'halaman': return 'halaman_informasi';
      default: return 'konten_website';
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const tableName = getTableName();
      
      if (editData) {
        const { error } = await supabase
          .from(tableName)
          .update(data)
          .eq('id', editData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from(tableName)
          .insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editData ? 'Konten berhasil diperbarui' : 'Konten berhasil ditambahkan');
      queryClient.invalidateQueries({ queryKey: [`admin-${type === 'konten' ? 'konten-website' : type}`] });
      onOpenChange(false);
      reset();
      setImagePreview(null);
    },
    onError: (error) => {
      toast.error('Gagal menyimpan konten: ' + error.message);
    }
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('content-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('content-images')
        .getPublicUrl(filePath);

      setImagePreview(publicUrl);
      setValue(type === 'galeri' ? 'url_media' : 'gambar', publicUrl);
      toast.success('Gambar berhasil diunggah');
    } catch (error) {
      toast.error('Gagal mengunggah gambar');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = (data: any) => {
    // Add type-specific processing
    if (type === 'konten') {
      data.jenis = data.jenis || 'umum';
    } else if (type === 'berita') {
      data.slug = data.slug || data.judul.toLowerCase().replace(/[^a-z0-9]/g, '-');
      data.tanggal_publikasi = data.tanggal_publikasi || new Date().toISOString();
    } else if (type === 'galeri') {
      data.tipe_media = data.tipe_media || 'image';
      data.deskripsi = data.isi;
    } else if (type === 'halaman') {
      data.slug = data.slug || data.judul.toLowerCase().replace(/[^a-z0-9]/g, '-');
    }

    data.status = data.status || 'published';
    mutation.mutate(data);
  };

  const getFormTitle = () => {
    const titles = {
      konten: 'Konten Desa',
      berita: 'Berita',
      galeri: 'Galeri',
      halaman: 'Halaman Informasi'
    };
    return `${editData ? 'Edit' : 'Tambah'} ${titles[type]}`;
  };

  const contentFieldName = "isi";

  const contentLabel = type === "galeri" ? "Deskripsi" : "Konten";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getFormTitle()}</DialogTitle>
          <DialogDescription>
            {editData ? 'Perbarui' : 'Tambahkan'} {type} baru untuk website desa
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="judul">Judul *</Label>
            <Input
              id="judul"
              {...register('judul', { required: 'Judul wajib diisi' })}
              placeholder="Masukkan judul"
            />
            {errors.judul && (
              <p className="text-sm text-destructive mt-1">{String(errors.judul.message)}</p>
            )}
          </div>

          {/* Type-specific fields */}
          {type === 'konten' && (
            <div>
              <Label htmlFor="jenis">Jenis Konten *</Label>
              <Select onValueChange={(value) => setValue('jenis', value)} defaultValue={editData?.jenis}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis konten" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sejarah">Sejarah</SelectItem>
                  <SelectItem value="visi_misi">Visi Misi</SelectItem>
                  <SelectItem value="geografis">Kondisi Geografis</SelectItem>
                  <SelectItem value="tupoksi">Tugas dan Fungsi</SelectItem>
                  <SelectItem value="pengumuman">Pengumuman</SelectItem>
                  <SelectItem value="agenda">Agenda</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {type === 'galeri' && (
            <div>
              <Label htmlFor="tipe_media">Tipe Media *</Label>
              <Select onValueChange={(value) => setValue('tipe_media', value)} defaultValue={editData?.tipe_media || 'image'}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tipe media" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Foto</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Image/Media Upload */}
          <div>
            <Label htmlFor="media">
              {type === 'galeri' ? 'File Media' : 'Gambar'} 
              {type === 'galeri' && ' *'}
            </Label>
            <div className="space-y-2">
              <Input
                id="media"
                type="file"
                accept={type === 'galeri' ? "image/*,video/*" : "image/*"}
                onChange={handleImageUpload}
                disabled={uploading}
              />
              {imagePreview && (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 w-6 h-6"
                    onClick={() => {
                      setImagePreview(null);
                      setValue(type === 'galeri' ? 'url_media' : 'gambar', '');
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Content/Description */}
          <div>
            <Label htmlFor="content">{contentLabel} *</Label>
            <Textarea
              id="content"
              {...register(contentFieldName, {
                required: `${contentLabel} wajib diisi`,
              })}
              placeholder={`Masukkan ${contentLabel.toLowerCase()}`}
              rows={6}
            />
            {errors[contentFieldName] && (
              <p className="text-sm text-destructive mt-1">
                {String(errors[contentFieldName]?.message)}
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <Label htmlFor="status">Status</Label>
            <Select onValueChange={(value) => setValue('status', value)} defaultValue={editData?.status || 'published'}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="published">Dipublikasikan</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Order/Priority */}
          <div>
            <Label htmlFor="urutan">Urutan</Label>
            <Input
              id="urutan"
              type="number"
              {...register('urutan')}
              placeholder="Urutan tampilan (opsional)"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={mutation.isPending} className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              {mutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContentForm;