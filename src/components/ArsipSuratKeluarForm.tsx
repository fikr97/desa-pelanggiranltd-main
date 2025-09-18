import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check, ChevronsUpDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';

interface ArsipSuratKeluarFormProps {
  arsip?: any;
  perangkatList: any[];
  templateList: any[];
  onClose: () => void;
}

const ArsipSuratKeluarForm = ({ arsip, perangkatList, templateList, onClose }: ArsipSuratKeluarFormProps) => {
  const [formData, setFormData] = useState({
    nama_pemohon: '',
    no_surat: '',
    tanggal_surat: '',
    perihal: '',
    penanggung_jawab: '',
    tanggal_pengiriman: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isPerihalOpen, setIsPerihalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDefaultPenanggungJawab = async () => {
      if (!arsip) { // Only for new entries
        try {
          const { data: infoDesa } = await supabase.from('info_desa').select('nama_kepala_desa').single();
          const kades = perangkatList.find(p => p.jabatan.toLowerCase() === 'kepala desa');
          const defaultValue = kades ? `${kades.nama} (${kades.jabatan})` : (infoDesa?.nama_kepala_desa || '');
          setFormData(prev => ({ ...prev, penanggung_jawab: defaultValue }));
        } catch (error) {
          console.error("Error fetching default penanggung jawab:", error);
        }
      }
    };

    fetchDefaultPenanggungJawab();

    if (arsip) {
      setFormData({
        nama_pemohon: arsip.nama_pemohon || '',
        no_surat: arsip.no_surat || '',
        tanggal_surat: arsip.tanggal_surat || '',
        perihal: arsip.perihal || '',
        penanggung_jawab: arsip.penanggung_jawab || '',
        tanggal_pengiriman: arsip.tanggal_pengiriman || '',
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arsip, perangkatList]);

  const handleChange = (id: string, value: any) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    let error = null;
    if (arsip) {
      const { error: updateError } = await supabase.from('arsip_surat_keluar').update(formData).eq('id', arsip.id);
      error = updateError;
    } else {
      const { error: createError } = await supabase.from('arsip_surat_keluar').insert([formData]);
      error = createError;
    }

    setIsLoading(false);

    if (error) {
      toast({ title: 'Gagal', description: `Terjadi kesalahan: ${error.message}`, variant: 'destructive' });
    } else {
      toast({ title: 'Berhasil', description: `Data arsip berhasil ${arsip ? 'diperbarui' : 'ditambahkan'}.` });
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="nama_pemohon">Nama Pemohon</Label>
          <Input id="nama_pemohon" value={formData.nama_pemohon} onChange={(e) => handleChange('nama_pemohon', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="no_surat">No Surat</Label>
          <Input id="no_surat" value={formData.no_surat} onChange={(e) => handleChange('no_surat', e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="tanggal_surat">Tanggal Surat</Label>
          <Input id="tanggal_surat" type="date" value={formData.tanggal_surat} onChange={(e) => handleChange('tanggal_surat', e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="perihal">Perihal</Label>
          <Popover open={isPerihalOpen} onOpenChange={setIsPerihalOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" aria-expanded={isPerihalOpen} className="w-full justify-between font-normal">
                <span className="truncate">{formData.perihal || "Pilih atau ketik perihal..."}</span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput placeholder="Cari perihal atau ketik baru..." onValueChange={(value) => handleChange('perihal', value)} />
                <CommandList>
                  <CommandEmpty>Ketik perihal kustom.</CommandEmpty>
                  <CommandGroup>
                    {templateList.map((template) => (
                      <CommandItem
                        key={template.nama_template}
                        value={template.nama_template}
                        onSelect={(currentValue) => {
                          handleChange('perihal', currentValue === formData.perihal ? '' : currentValue);
                          setIsPerihalOpen(false);
                        }}
                      >
                        <Check className={cn("mr-2 h-4 w-4", formData.perihal === template.nama_template ? "opacity-100" : "opacity-0")} />
                        {template.nama_template}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <Label htmlFor="penanggung_jawab">Penanggung Jawab</Label>
          <Select value={formData.penanggung_jawab} onValueChange={(value) => handleChange('penanggung_jawab', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih penanggung jawab..." />
            </SelectTrigger>
            <SelectContent>
              {perangkatList.map((p) => (
                <SelectItem key={`${p.nama}-${p.jabatan}`} value={`${p.nama} (${p.jabatan})`}>
                  {p.nama} ({p.jabatan})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="tanggal_pengiriman">Tanggal Pengiriman</Label>
          <Input id="tanggal_pengiriman" type="date" value={formData.tanggal_pengiriman} onChange={(e) => handleChange('tanggal_pengiriman', e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {arsip ? 'Simpan Perubahan' : 'Simpan'}
        </Button>
      </div>
    </form>
  );
};

export default ArsipSuratKeluarForm;