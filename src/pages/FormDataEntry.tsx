import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, Download, PlusCircle, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import DataEntryForm from '@/components/DataEntryForm';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const FormDataEntry = () => {
  const { formId } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['form_data_and_def', formId],
    queryFn: async () => {
      const formQuery = supabase.from('form_tugas').select('*').eq('id', formId).single();
      const fieldsQuery = supabase.from('form_tugas_fields').select('*').eq('form_tugas_id', formId).order('urutan');
      const entriesQuery = supabase.from('form_tugas_data').select('*, penduduk(*)').eq('form_tugas_id', formId).order('created_at');
      const residentsQuery = (async () => {
        let allData: any[] = [];
        let from = 0;
        const limit = 1000; // Supabase default limit per query
        let hasMore = true;

        while (hasMore) {
          const { data, error } = await supabase
            .from('penduduk')
            .select('*')
            .range(from, from + limit - 1);

          if (error) {
            console.error('Error fetching residents in FormDataEntry:', error);
            // Return a structure that Promise.all can handle
            return { data: null, error }; 
          }

          if (data) {
            allData = [...allData, ...data];
            if (data.length < limit) {
              hasMore = false;
            } else {
              from += limit;
            }
          } else {
            hasMore = false;
          }
        }
        return { data: allData, error: null };
      })();

      const [formResult, fieldsResult, entriesResult, residentsResult] = await Promise.all([formQuery, fieldsQuery, entriesQuery, residentsQuery]);

      if (formResult.error && formResult.error.code !== 'PGRST116') throw formResult.error;
      if (fieldsResult.error) throw fieldsResult.error;
      if (entriesResult.error) throw entriesResult.error;
      if (residentsResult.error) throw residentsResult.error;

      return {
        formDef: { ...formResult.data, fields: fieldsResult.data || [] },
        entries: entriesResult.data || [],
        residents: residentsResult.data || [],
      };
    },
    enabled: !!formId,
  });

  const handleAddNew = () => {
    setEditingEntry(null);
    setIsFormOpen(true);
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setIsFormOpen(true);
  };

  const openDeleteDialog = (entry) => {
    setEntryToDelete(entry);
    setIsAlertOpen(true);
  };

  const handleDelete = async () => {
    if (!entryToDelete) return;
    try {
      const { error } = await supabase.from('form_tugas_data').delete().eq('id', entryToDelete.id);
      if (error) throw error;
      toast({ title: 'Berhasil', description: 'Data telah dihapus.' });
      queryClient.invalidateQueries({ queryKey: ['form_data_and_def', formId] });
    } catch (err) {
      toast({ title: 'Gagal', description: 'Terjadi kesalahan: ' + err.message, variant: 'destructive' });
    } finally {
      setIsAlertOpen(false);
      setEntryToDelete(null);
    }
  };

  const handleSave = async ({ residentId, data: formData, entryId }) => {
    setIsSaving(true);
    
    const dataToSave = {};
    data.formDef.fields.forEach(field => {
        dataToSave[field.nama_field] = formData[field.nama_field];
    });

    const payload = {
      form_tugas_id: formId,
      penduduk_id: residentId,
      data_custom: dataToSave, // Save everything here
      user_id: user?.id,
    };

    try {
      let error;
      if (entryId) {
        // Update
        const { error: updateError } = await supabase.from('form_tugas_data').update(payload).eq('id', entryId);
        error = updateError;
      } else {
        // Insert
        const { error: insertError } = await supabase.from('form_tugas_data').insert(payload);
        error = insertError;
      }

      if (error) throw error;

      toast({ title: 'Berhasil', description: 'Data berhasil disimpan.' });
      queryClient.invalidateQueries({ queryKey: ['form_data_and_def', formId] });
      setIsFormOpen(false);
      setEditingEntry(null);
    } catch (err) {
      toast({ title: 'Gagal', description: 'Terjadi kesalahan: ' + err.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    const headers = data.formDef.fields.map(f => f.label_field);
    const dataForSheet = data.entries.map(entry => {
      const row = {};
      data.formDef.fields.forEach(field => {
        const customValue = entry.data_custom?.[field.nama_field];
        let value;

        if (customValue !== undefined && customValue !== null && customValue !== '') {
          if (field.tipe_field === 'date' && field.format_tanggal) {
            try {
              let formatString = field.format_tanggal;
              if (formatString === 'd MMMM yyyy') {
                formatString = 'dd MMMM yyyy';
              } else if (formatString === 'EEEE, d MMMM yyyy') {
                formatString = 'EEEE, dd MMMM yyyy';
              }
              value = format(new Date(customValue), formatString, { locale: id });
            } catch (e) {
              console.error("Invalid date or format for export:", e);
              value = customValue;
            }
          } else {
            value = customValue;
          }
        } else if (field.tipe_field === 'predefined') {
            const predefValue = entry.penduduk?.[field.nama_field];
            if (field.nama_field === 'tanggal_lahir' && predefValue && field.format_tanggal) {
                try {
                    let formatString = field.format_tanggal;
                    if (formatString === 'd MMMM yyyy') {
                        formatString = 'dd MMMM yyyy';
                    } else if (formatString === 'EEEE, d MMMM yyyy') {
                        formatString = 'EEEE, dd MMMM yyyy';
                    }
                    value = format(new Date(predefValue), formatString, { locale: id });
                } catch (e) {
                    console.error("Invalid date or format for predefined field in export:", e);
                    value = predefValue;
                }
            } else {
                value = predefValue || '';
            }
        } else {
          value = '';
        }
        row[field.label_field] = value;
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(dataForSheet, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    XLSX.writeFile(workbook, `${data.formDef.nama_tugas.replace(/\s+/g, '_')}.xlsx`);
  };

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (error) return <div className="p-6 text-destructive">Error: {error.message}</div>;
  if (!data || !data.formDef) return <div className="p-6"><p>Form tidak ditemukan.</p></div>;

  const { formDef, entries, residents } = data;

  const getFieldValue = (entry, field) => {
    const customValue = entry.data_custom?.[field.nama_field];
    
    if (customValue !== undefined && customValue !== null && customValue !== '') {
      if (field.tipe_field === 'date' && field.format_tanggal) {
        try {
          let formatString = field.format_tanggal;
          if (formatString === 'd MMMM yyyy') {
            formatString = 'dd MMMM yyyy';
          } else if (formatString === 'EEEE, d MMMM yyyy') {
            formatString = 'EEEE, dd MMMM yyyy';
          }
          return format(new Date(customValue), formatString, { locale: id });
        } catch (e) {
          console.error("Invalid date or format:", e);
          return customValue; // Fallback to original value
        }
      }
      return customValue;
    }

    // Fallback to penduduk data for predefined fields if not in custom_data
    if (field.tipe_field === 'predefined') {
      const predefValue = entry.penduduk?.[field.nama_field];
      if (field.nama_field === 'tanggal_lahir' && predefValue && field.format_tanggal) {
          try {
            let formatString = field.format_tanggal;
            if (formatString === 'd MMMM yyyy') {
              formatString = 'dd MMMM yyyy';
            } else if (formatString === 'EEEE, d MMMM yyyy') {
              formatString = 'EEEE, dd MMMM yyyy';
            }
            return format(new Date(predefValue), formatString, { locale: id });
          } catch (e) {
              console.error("Invalid date or format for predefined field:", e);
              return predefValue;
          }
      }
      return predefValue || 'N/A';
    }

    return 'N/A';
  };

  return (
    <>
      <div className="container mx-auto p-4 md:p-6">
        <div className="mb-4">
          <Link to="/form-tugas">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke Form Tugas
            </Button>
          </Link>
        </div>
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Data: {formDef.nama_tugas}</h1>
            <p className="text-muted-foreground">{formDef.deskripsi}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button onClick={handleAddNew} className="w-full">
              <PlusCircle className="h-4 w-4 mr-2" />
              Tambah Data Baru
            </Button>
            <Button variant="outline" onClick={handleExport} disabled={!entries.length} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Ekspor ke Excel
            </Button>
          </div>
        </div>

        <div className="bg-card p-4 sm:p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Daftar Data Terisi</h2>
          {entries.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Belum ada data yang diisi.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    {formDef.fields.map(field => (
                      <TableHead key={field.id}>{field.label_field}</TableHead>
                    ))}
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry, index) => (
                    <TableRow key={entry.id}>
                      <TableCell>{index + 1}</TableCell>
                      {formDef.fields.map(field => (
                        <TableCell key={field.id}>{getFieldValue(entry, field)}</TableCell>
                      ))}
                      <TableCell className="flex gap-2 justify-end">
                        <Button variant="secondary" size="sm" onClick={() => handleEdit(entry)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(entry)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="w-full max-w-2xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>{editingEntry ? 'Edit Data' : 'Tambah Data Baru'}</DialogTitle>
            <DialogDescription>{formDef.nama_tugas}</DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto p-1">
            <DataEntryForm
              formDef={formDef}
              residents={residents}
              onSave={handleSave}
              onCancel={() => setIsFormOpen(false)}
              initialData={editingEntry}
              isLoading={isSaving}
            />
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Data akan dihapus secara permanen.
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

export default FormDataEntry;