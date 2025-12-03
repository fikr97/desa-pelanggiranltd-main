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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';

const FormTugas = () => {
  const [isDesignerOpen, setIsDesignerOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [formToDelete, setFormToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile } = useAuth();
  const { hasPermission } = usePermissions();

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

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateNew = () => {
    setSelectedForm(null);
    setIsDesignerOpen(true);
    setIsCreateModalOpen(false);
  };

  const handleDuplicateForm = (form) => {
    // Create a copy of the form data with a flag to indicate duplication
    const formForDuplication = {
      ...form,
      nama_tugas: `${form.nama_tugas} (Copy)`, // Prepend "Copy" to the name
    };
    setSelectedForm(formForDuplication);
    setIsDesignerOpen(true);
    setIsCreateModalOpen(false);
  };

  const handleModalClose = () => {
    setIsCreateModalOpen(false);
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

  const canCreate = hasPermission('form_tugas:create');
  const canFill = hasPermission('form_tugas:fill');
  const canEdit = hasPermission('form_tugas:edit');
  const canDelete = hasPermission('form_tugas:delete');

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gradient">Manajemen Form Tugas</h1>
            <p className="text-muted-foreground mt-2">
              Kelola form tugas yang digunakan untuk pengumpulan data
            </p>
          </div>
          {(profile?.role === 'admin' || canCreate) && (
            <div className="w-full md:w-auto mt-2 md:mt-0">
              <Button onClick={handleOpenCreateModal} className="w-full">
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
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{form.nama_tugas}</h3>
                      {!form.is_active && (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                          Tidak Aktif
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm">{form.deskripsi}</p>
                  </div>
                  <div className="flex items-center flex-wrap gap-2">
                    {(profile?.role === 'admin' || canFill) && (
                      <Button variant={form.is_active ? "outline" : "outline"} size="sm" asChild disabled={!form.is_active}>
                        <Link to={form.is_active ? `/form-tugas/${form.id}/data` : "#"} onClick={(e) => {
                          if (!form.is_active) {
                            e.preventDefault();
                            alert("Form ini tidak aktif dan tidak dapat diisi.");
                          }
                        }}>
                          <FileText className="h-4 w-4 mr-2" />
                          Isi Data {form.is_active ? "" : " (Non Aktif)"}
                        </Link>
                      </Button>
                    )}
                    {(profile?.role === 'admin' || canEdit) && (
                      <Button variant="secondary" size="sm" onClick={() => handleEdit(form)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    )}
                    {(profile?.role === 'admin' || canDelete) && (
                      <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(form)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Hapus
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fixed Add button for mobile */}
      {(profile?.role === 'admin' || canCreate) && (
        <Button 
          onClick={handleOpenCreateModal} 
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

      {/* Dual-choice modal for creating new form */}
      <Dialog open={isCreateModalOpen} onOpenChange={handleModalClose}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-center">
              Pilih Opsi Pembuatan Form
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <Button 
              onClick={handleCreateNew} 
              className="w-full flex items-center justify-center"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Buat Form Baru
            </Button>
            
            <div className="flex items-center my-1">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="mx-4 text-sm text-gray-500 flex-shrink-0">atau</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                Pilih form yang akan di-duplicate:
              </p>
              {formTugasList && formTugasList.length > 0 ? (
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {formTugasList.map((form) => (
                    <Button
                      key={form.id}
                      variant="outline"
                      className="w-full text-left justify-start h-auto py-3"
                      onClick={() => handleDuplicateForm(form)}
                    >
                      <span className="whitespace-normal break-words" title={form.nama_tugas}>{form.nama_tugas}</span>
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-3">
                  Belum ada form yang tersedia untuk di-duplicate.
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FormTugas;

// Path: src/pages/FormTugas.tsx
