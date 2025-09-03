
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Building2, Save } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type InfoDesa = {
  id?: string;
  nama_desa?: string | null;
  logo_desa?: string | null;
  alamat_kantor?: string | null;
  email?: string | null;
  telepon?: string | null;
  website?: string | null;
  nama_kepala_desa?: string | null;
};

const PengaturanInfoDesa = () => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState<InfoDesa>({});
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const { data: infoDesa, isLoading } = useQuery({
        queryKey: ['info-desa'],
        queryFn: async () => {
            const { data, error } = await supabase.from('info_desa').select('*').single();
            if (error && error.code !== 'PGRST116') throw error;
            return data;
        },
    });

    useEffect(() => {
        if (infoDesa) {
            setFormData(infoDesa);
            setPreviewUrl(infoDesa.logo_desa);
        }
    }, [infoDesa]);
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const mutation = useMutation({
        mutationFn: async (currentFormData: InfoDesa) => {
            let logoUrl = currentFormData.logo_desa;

            if (selectedFile) {
                const filePath = `public/${Date.now()}-${selectedFile.name}`;
                const { error: uploadError } = await supabase.storage
                    .from('logo-desa')
                    .upload(filePath, selectedFile, { upsert: true });
                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage.from('logo-desa').getPublicUrl(filePath);
                logoUrl = urlData.publicUrl;
            }

            const dataToUpsert = {
                ...currentFormData,
                nama_desa: currentFormData.nama_desa || '', // Ensure nama_desa is a string
                logo_desa: logoUrl,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase.from('info_desa').upsert(dataToUpsert, { onConflict: 'id' });
            if (error) throw error;
        },
        onSuccess: () => {
            toast({ title: "Sukses!", description: "Informasi desa berhasil diperbarui." });
            queryClient.invalidateQueries({ queryKey: ['info-desa'] });
            queryClient.invalidateQueries({ queryKey: ['info-desa-logo'] });
            queryClient.invalidateQueries({ queryKey: ['info-desa-header'] });
            setSelectedFile(null);
        },
        onError: (error: any) => {
            toast({ variant: 'destructive', title: "Gagal!", description: `Terjadi kesalahan: ${error.message}` });
        },
    });

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const dataToSubmit = { ...formData };
        if (infoDesa?.id) {
          dataToSubmit.id = infoDesa.id;
        }
        mutation.mutate(dataToSubmit);
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = event.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-4">
                        <Skeleton className="h-24 w-24 rounded-lg" />
                        <div className="space-y-2">
                           <Skeleton className="h-6 w-48" />
                           <Skeleton className="h-10 w-32" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                     <div className="flex justify-end">
                        <Skeleton className="h-10 w-32" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Informasi Desa</CardTitle>
                <CardDescription>Ubah informasi umum dan logo desa Anda di sini.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label>Logo Desa</Label>
                        <div className="flex items-center space-x-4">
                             <div className="w-24 h-24 rounded-lg border border-dashed flex items-center justify-center bg-muted/40">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" className="h-full w-full object-contain rounded-lg"/>
                                ) : (
                                    <Building2 className="h-10 w-10 text-muted-foreground"/>
                                )}
                             </div>
                             <Input id="logo-upload" type="file" accept="image/*" onChange={handleFileChange} className="max-w-xs"/>
                        </div>
                         <p className="text-sm text-muted-foreground">Unggah file gambar (PNG, JPG, SVG) maks 2MB.</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="nama_desa">Nama Desa</Label>
                        <Input id="nama_desa" value={formData.nama_desa || ''} onChange={handleInputChange} placeholder="Contoh: Desa Sejahtera"/>
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="nama_kepala_desa">Nama Kepala Desa</Label>
                        <Input id="nama_kepala_desa" value={formData.nama_kepala_desa || ''} onChange={handleInputChange} placeholder="Contoh: John Doe"/>
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="alamat_kantor">Alamat Kantor</Label>
                        <Input id="alamat_kantor" value={formData.alamat_kantor || ''} onChange={handleInputChange} placeholder="Contoh: Jl. Raya Desa No. 1"/>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Desa</Label>
                            <Input id="email" type="email" value={formData.email || ''} onChange={handleInputChange} placeholder="Contoh: kontak@desasejahtera.id"/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="telepon">Telepon Desa</Label>
                            <Input id="telepon" value={formData.telepon || ''} onChange={handleInputChange} placeholder="Contoh: 021-1234567"/>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
                            {!mutation.isPending && <Save className="h-4 w-4 ml-2"/>}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};
export default PengaturanInfoDesa;
