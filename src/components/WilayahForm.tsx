
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface WilayahFormProps {
  wilayah?: any;
  onClose: () => void;
}

const WilayahForm = ({ wilayah, onClose }: WilayahFormProps) => {
  const [formData, setFormData] = useState({
    kode: '',
    nama: '',
    jenis: 'Dusun',
    kepala: '',
    status: 'Aktif',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (wilayah) {
      setFormData({
        kode: wilayah.kode || '',
        nama: wilayah.nama || '',
        jenis: wilayah.jenis || 'Dusun',
        kepala: wilayah.kepala || '',
        status: wilayah.status || 'Aktif',
      });
    }
  }, [wilayah]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (wilayah) {
        // Update existing wilayah
        const { error } = await supabase
          .from('wilayah')
          .update({
            kode: formData.kode,
            nama: formData.nama,
            jenis: formData.jenis,
            kepala: formData.kepala,
            status: formData.status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', wilayah.id);

        if (error) throw error;

        toast({
          title: 'Berhasil',
          description: 'Data wilayah berhasil diperbarui',
        });
      } else {
        // Create new wilayah
        const { error } = await supabase
          .from('wilayah')
          .insert([{
            kode: formData.kode,
            nama: formData.nama,
            jenis: formData.jenis,
            kepala: formData.kepala,
            status: formData.status,
            jumlah_kk: 0,
            jumlah_penduduk: 0,
          }]);

        if (error) throw error;

        toast({
          title: 'Berhasil',
          description: 'Data wilayah berhasil ditambahkan',
        });
      }

      onClose();
    } catch (error) {
      console.error('Error saving wilayah:', error);
      toast({
        title: 'Gagal',
        description: 'Terjadi kesalahan saat menyimpan data wilayah',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="kode">Kode Wilayah</Label>
          <Input
            id="kode"
            value={formData.kode}
            onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
            placeholder="Masukkan kode wilayah"
            required
          />
        </div>

        <div>
          <Label htmlFor="nama">Nama Wilayah</Label>
          <Input
            id="nama"
            value={formData.nama}
            onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
            placeholder="Masukkan nama wilayah"
            required
          />
        </div>

        <div>
          <Label htmlFor="jenis">Jenis Wilayah</Label>
          <Select value={formData.jenis} onValueChange={(value) => setFormData({ ...formData, jenis: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih jenis wilayah" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Dusun">Dusun</SelectItem>
              <SelectItem value="RW">RW</SelectItem>
              <SelectItem value="RT">RT</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="kepala">Nama Kepala</Label>
          <Input
            id="kepala"
            value={formData.kepala}
            onChange={(e) => setFormData({ ...formData, kepala: e.target.value })}
            placeholder="Masukkan nama kepala wilayah"
          />
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Aktif">Aktif</SelectItem>
              <SelectItem value="Tidak Aktif">Tidak Aktif</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Batal
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Menyimpan...' : (wilayah ? 'Perbarui' : 'Simpan')}
        </Button>
      </div>
    </form>
  );
};

export default WilayahForm;
