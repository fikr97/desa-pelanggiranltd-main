import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Pencil, Trash2, FileText, Loader2, Search } from 'lucide-react';
import FormTugasDesigner from '@/components/FormTugasDesigner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const FormTugas = () => {
  const [isDesignerOpen, setIsDesignerOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [formToDelete, setFormToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile } = useAuth();

  const { data: formTugasList, isLoading } = useQuery({
    queryKey: ['form_tugas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('form_tugas').select('*').order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
  });

  // Filter forms based on search term
  const filteredForms = useMemo(() => {
    if (!formTugasList || !searchTerm) return formTugasList || [];
    
    return formTugasList.filter(form => {
      return (
        form.nama_tugas.toLowerCase().includes(searchTerm.toLowerCase()) ||
        form.deskripsi.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [formTugasList, searchTerm]);

  const handleCreateNew = () => {
    setSelectedForm(null);
    setIsDesignerOpen(true);
  };

  const handleEdit = (form) => {
    setSelectedForm(form);
    setIsDesignerOpen(true);
  };

  const handleSave = () => {
    queryClient.invalidateQueries({ queryKey: ['form_tugas'] });
    setIsDesignerOpen(false);
  };

  const handleCancel = () => {
    setIsDesignerOpen(false);
  };

  const openDeleteDialog = (form) => {
    setFormToDelete(form);
    setIsAlertOpen(true);
  };

  const handleDelete = async () => {
    if (!formToDelete) return;

    try {
      const { error } = await supabase.from('form_tugas').delete().eq('id', formToDelete.id);
      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: `Form "${formToDelete.nama_tugas}" telah dihapus.`,
      });
      queryClient.invalidateQueries({ queryKey: ['form_tugas'] });
    } catch (error) {
      toast({
        title: 'Gagal',
        description: 'Terjadi kesalahan saat menghapus form.',
        variant: 'destructive',
      });
    } finally {
      setIsAlertOpen(false);
      setFormToDelete(null);
    }
  };

  if (isDesignerOpen) {
    return <FormTugasDesigner formTugas={selectedForm} onSave={handleSave} onCancel={handleCancel} />;
  }

  return (
    <>
      <div className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold">Manajemen Form Tugas</h1>
          {profile?.role === 'admin' && (
            <div className="w-full md:w-auto mt-2 md:mt-0">
              <Button onClick={handleCreateNew} className="w-full">
                <PlusCircle className="h-4 w-4 mr-2" />
                Buat Form Baru
              </Button>
            </div>
          )}
        </div>

        {/* Search box for forms */}
        <div className="mb-6">
          <div className="relative w-full md:w-1/2">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Cari form tugas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Daftar Form</h2>
          <p className="text-sm text-muted-foreground mb-4">Menampilkan {filteredForms.length} dari {formTugasList?.length || 0} form</p>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredForms && filteredForms.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {formTugasList && formTugasList.length > 0 ? 'Tidak ada form yang cocok dengan pencarian.' : 'Belum ada form tugas yang dibuat.'}
            </p>
          ) : (
            <div className="space-y-4">
              {filteredForms?.map((form) => (
                <div key={form.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{form.nama_tugas}</h3>
                    <p className="text-muted-foreground text-sm">{form.deskripsi}</p>
                  </div>
                  <div className="flex items-center flex-wrap gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/form-tugas/${form.id}/data`}>
                        <FileText className="h-4 w-4 mr-2" />
                        Isi Data
                      </Link>
                    </Button>
                    {profile?.role === 'admin' && (
                      <>
                        <Button variant="secondary" size="sm" onClick={() => handleEdit(form)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(form)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Hapus
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fixed Add button for mobile */}
      {profile?.role === 'admin' && (
        <Button 
          onClick={handleCreateNew} 
          className="fixed bottom-6 right-6 rounded-full w-14 h-14 p-0 shadow-lg md:hidden z-50"
          aria-label="Buat Form Baru"
        >
          <PlusCircle className="h-6 w-6" />
        </Button>
      )}

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Ini akan menghapus form tugas secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default FormTugas;
