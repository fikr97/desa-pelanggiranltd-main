import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Plus, Trash2, Save, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface PerangkatDesa {
  id: string;
  nama: string;
  jabatan: string;
  nip?: string;
  foto?: string;
  bertanggung_jawab_kepada?: string;
}

interface PerangkatDesaFormProps {
  perangkat?: PerangkatDesa;
  perangkatList?: PerangkatDesa[];
  onSave: (data: Partial<PerangkatDesa>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  trigger?: React.ReactNode;
}

const PerangkatDesaForm = ({ perangkat, perangkatList = [], onSave, onDelete, trigger }: PerangkatDesaFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nama: perangkat?.nama || '',
    jabatan: perangkat?.jabatan || '',
    nip: perangkat?.nip || '',
    bertanggung_jawab_kepada: perangkat?.bertanggung_jawab_kepada || ''
  });
  const { toast } = useToast();

  const handleSave = async () => {
    if (!formData.nama.trim() || !formData.jabatan.trim()) {
      toast({
        title: 'Data tidak lengkap',
        description: 'Nama dan jabatan harus diisi',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Convert "none" back to empty string/null for database
      const dataToSave = {
        ...formData,
        bertanggung_jawab_kepada: formData.bertanggung_jawab_kepada === 'none' ? null : formData.bertanggung_jawab_kepada
      };
      await onSave(dataToSave);
      setIsOpen(false);
      toast({
        title: 'Data berhasil disimpan',
        description: 'Data perangkat desa telah diperbarui',
      });
    } catch (error) {
      console.error('Error saving perangkat desa:', error);
      toast({
        title: 'Gagal menyimpan data',
        description: 'Terjadi kesalahan saat menyimpan data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!perangkat?.id || !onDelete) return;
    
    setIsLoading(true);
    try {
      await onDelete(perangkat.id);
      setIsOpen(false);
      toast({
        title: 'Data berhasil dihapus',
        description: 'Data perangkat desa telah dihapus',
      });
    } catch (error) {
      console.error('Error deleting perangkat desa:', error);
      toast({
        title: 'Gagal menghapus data',
        description: 'Terjadi kesalahan saat menghapus data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter out current perangkat from the list to avoid circular reference
  const availablePerangkat = perangkatList.filter(p => p.id !== perangkat?.id);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            {perangkat ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {perangkat ? 'Edit Perangkat Desa' : 'Tambah Perangkat Desa'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="nama">Nama Lengkap</Label>
            <Input
              id="nama"
              value={formData.nama}
              onChange={(e) => setFormData(prev => ({ ...prev, nama: e.target.value }))}
              placeholder="Nama lengkap"
            />
          </div>
          <div>
            <Label htmlFor="jabatan">Jabatan</Label>
            <Input
              id="jabatan"
              value={formData.jabatan}
              onChange={(e) => setFormData(prev => ({ ...prev, jabatan: e.target.value }))}
              placeholder="Jabatan"
            />
          </div>
          <div>
            <Label htmlFor="nip">NIP (Opsional)</Label>
            <Input
              id="nip"
              value={formData.nip}
              onChange={(e) => setFormData(prev => ({ ...prev, nip: e.target.value }))}
              placeholder="Nomor Induk Pegawai"
            />
          </div>
          <div>
            <Label htmlFor="bertanggung_jawab_kepada">Bertanggung Jawab Kepada</Label>
            <Select 
              value={formData.bertanggung_jawab_kepada || 'none'} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, bertanggung_jawab_kepada: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih atasan langsung" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tidak ada (Level tertinggi)</SelectItem>
                {availablePerangkat.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nama} - {p.jabatan}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-between pt-4">
          <div>
            {perangkat && onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={isLoading}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Hapus Perangkat Desa</AlertDialogTitle>
                    <AlertDialogDescription>
                      Apakah Anda yakin ingin menghapus data {perangkat.nama}? Tindakan ini tidak dapat dibatalkan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Hapus</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
              <X className="h-4 w-4 mr-2" />
              Batal
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              Simpan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PerangkatDesaForm;
