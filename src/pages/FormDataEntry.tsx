import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Download, Upload, PlusCircle, Pencil, Trash2, ArrowLeft, ArrowUpDown, Grid3X3, List } from 'lucide-react';
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
import ImportDataButton from '@/components/ImportDataButton';

const getFieldValue = (entry, field) => {
  let value;
  const customValue = entry.data_custom?.[field.nama_field];

  if (customValue !== undefined && customValue !== null && customValue !== '') {
    value = customValue;
  } else if (field.tipe_field === 'predefined') {
    value = entry.penduduk?.[field.nama_field] || 'N/A';
  } else {
    value = 'N/A';
  }

  // Apply text format transformation first
  if (field.text_format && typeof value === 'string') {
    switch (field.text_format) {
      case 'uppercase':
        value = value.toUpperCase();
        break;
      case 'lowercase':
        value = value.toLowerCase();
        break;
      case 'capitalize':
        value = value.replace(/\b\w/g, char => char.toUpperCase());
        break;
    }
  }

  // Apply date format transformation if applicable
  if ((field.tipe_field === 'date' || field.sumber_data === 'penduduk.tanggal_lahir') && value && value !== 'N/A' && field.format_tanggal) {
    try {
      let formatString = field.format_tanggal;
      if (formatString === 'd MMMM yyyy') {
        formatString = 'dd MMMM yyyy';
      } else if (formatString === 'EEEE, d MMMM yyyy') {
        formatString = 'EEEE, dd MMMM yyyy';
      }
      return format(new Date(value), formatString, { locale: id });
    } catch (e) {
      console.error("Invalid date or format:", e);
      // Fallback to the (potentially text-formatted) value
      return value;
    }
  }

  return value;
};

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
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'descending' });
  const [viewMode, setViewMode] = useState<'table' | 'deck'>('table'); // Default to table view

  const { data, isLoading, error } = useQuery({
    queryKey: ['form_data_and_def', formId],
    queryFn: async () => {
      const formQuery = supabase.from('form_tugas').select('*').eq('id', formId).single();
      const fieldsQuery = supabase.from('form_tugas_fields').select('*').eq('form_tugas_id', formId).order('urutan');
      const entriesQuery = supabase.from('form_tugas_data').select('*, penduduk(*)').eq('form_tugas_id', formId).order('created_at');
      const residentsQuery = (async () => {
        let allData = [];
        let from = 0;
        const limit = 1000;
        let hasMore = true;
        while (hasMore) {
          const { data, error } = await supabase.from('penduduk').select('*').range(from, from + limit - 1);
          if (error) {
            console.error('Error fetching residents in FormDataEntry:', error);
            return { data: null, error }; 
          }
          if (data) {
            allData = [...allData, ...data];
            if (data.length < limit) hasMore = false;
            else from += limit;
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

      // Initialize deck visibility for fields if they don't exist (handles missing columns in DB)
      const initializedFields = fieldsResult.data?.map(field => ({
        ...field,
        deck_visible: field.deck_visible !== undefined ? field.deck_visible : false,
        deck_display_order: field.deck_display_order !== undefined ? field.deck_display_order : 0,
        deck_display_format: field.deck_display_format !== undefined ? field.deck_display_format : 'default',
        deck_is_header: field.deck_is_header !== undefined ? field.deck_is_header : false,
      })) || [];

      return {
        formDef: { ...formResult.data, fields: initializedFields },
        entries: entriesResult.data || [],
        residents: residentsResult.data || [],
      };
    },
    enabled: !!formId,
  });

  const sortedEntries = useMemo(() => {
    if (!data?.entries) return [];
    const sortableEntries = [...data.entries];
    sortableEntries.sort((a, b) => {
      let aValue, bValue;

      if (sortConfig.key === 'created_at') {
        aValue = new Date(a.created_at);
        bValue = new Date(b.created_at);
      } else {
        const field = data.formDef.fields.find(f => f.nama_field === sortConfig.key);
        if (!field) return 0;
        aValue = getFieldValue(a, field);
        bValue = getFieldValue(b, field);
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
    return sortableEntries;
  }, [data?.entries, sortConfig, data?.formDef.fields]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

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
    const requiredFields = data.formDef.fields.filter(field => field.is_required);
    const missingFields = [];
    for (const field of requiredFields) {
      const value = formData[field.nama_field];
      if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
        missingFields.push(field.label_field);
      }
    }
    if (missingFields.length > 0) {
      toast({
        title: 'Validasi Gagal',
        description: `Field berikut wajib diisi: ${missingFields.join(', ')}`,
        variant: 'destructive',
      });
      setIsSaving(false);
      return;
    }
    const dataToSave = {};
    data.formDef.fields.forEach(field => {
        dataToSave[field.nama_field] = formData[field.nama_field];
    });
    const payload = {
      form_tugas_id: formId,
      penduduk_id: residentId,
      data_custom: dataToSave,
      user_id: user?.id,
    };
    try {
      let error;
      if (entryId) {
        const { error: updateError } = await supabase.from('form_tugas_data').update(payload).eq('id', entryId);
        error = updateError;
      } else {
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
    const dataForSheet = sortedEntries.map(entry => {
      const row = {};
      data.formDef.fields.forEach(field => {
        row[field.label_field] = getFieldValue(entry, field);
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
  
  // Determine view mode based on form settings and user preference
  const actualViewMode = formDef.display_type === 'deck' ? viewMode : 'table';
  
  // Render table view
  const renderTableView = () => (
    <div className="overflow-x-auto relative">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">No</TableHead>
            {formDef.fields.map(field => (
              <TableHead key={field.id} onClick={() => requestSort(field.nama_field)} className="cursor-pointer hover:bg-muted">
                <div className="flex items-center gap-2">
                  {field.label_field}
                  {sortConfig.key === field.nama_field && (
                    <ArrowUpDown className="h-4 w-4" />
                  )}
                </div>
              </TableHead>
            ))}
            <TableHead className="text-right sticky right-0 bg-background z-10 border-l border-border min-w-[100px]">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedEntries.map((entry, index) => (
            <TableRow key={entry.id}>
              <TableCell>{index + 1}</TableCell>
              {formDef.fields.map(field => (
                <TableCell key={field.id}>{getFieldValue(entry, field)}</TableCell>
              ))}
              <TableCell className="flex gap-2 justify-end sticky right-0 bg-background z-10 border-l border-border min-w-[100px]">
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
  );
  
  // Render deck view
  const renderDeckView = () => {
    // Use deck display fields from the form fields if they exist and are visible
    // Filter out fields that have missing deck columns (to prevent errors if columns don't exist in DB yet)
    const visibleDeckFields = formDef.fields
      .filter(field => field.deck_visible)
      .sort((a, b) => (a.deck_display_order || 0) - (b.deck_display_order || 0));
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedEntries.map((entry, index) => {
          // Find the header field if any
          const headerField = visibleDeckFields.find(f => f.deck_is_header);
          const headerFieldValue = headerField ? getFieldValue(entry, headerField) : null;
          
          // Get non-header fields to display in body
          const bodyFields = visibleDeckFields.filter(f => !f.deck_is_header);
          
          return (
            <Card key={entry.id} className="overflow-hidden">
              {headerFieldValue && (
                <CardHeader className={headerField.deck_display_format === 'header' ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
                  <CardTitle className="text-lg break-words">{headerFieldValue}</CardTitle>
                </CardHeader>
              )}
              <CardContent className="p-4">
                <div className="space-y-2">
                  {bodyFields.map(field => {
                    const value = getFieldValue(entry, field);
                    return (
                      <div key={field.id} className="flex flex-col">
                        <Label className="text-xs font-medium text-muted-foreground">{field.label_field}</Label>
                        <span className={`text-sm break-words ${field.deck_display_format === 'full-width' ? 'col-span-2' : ''}`}>{value}</span>
                      </div>
                    );
                  })}
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button variant="secondary" size="sm" onClick={() => handleEdit(entry)} className="flex-1">
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(entry)} className="flex-1">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Hapus
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
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
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button 
              onClick={handleAddNew} 
              className="flex-1 py-2 px-3 sm:py-3 sm:px-4 text-sm min-w-[100px]"
            >
              <PlusCircle className="h-4 w-4 mr-1 sm:mr-2" />
              <span>Tambah</span>
            </Button>
            <ImportDataButton 
              formDef={formDef} 
              residents={residents} 
              className="flex-1 py-2 px-3 sm:py-3 sm:px-4 text-sm min-w-[100px]"
            />
            <Button 
              variant="outline" 
              onClick={handleExport} 
              disabled={!entries.length} 
              className="flex-1 py-2 px-3 sm:py-3 sm:px-4 text-sm min-w-[100px]"
            >
              <Download className="h-4 w-4 mr-1 sm:mr-2" />
              <span>Ekspor</span>
            </Button>
          </div>
        </div>

        {/* View mode toggle - only show if form is configured for deck view */}
        {(formDef.display_type === 'deck') && (
          <div className="flex items-center justify-end mb-4">
            <div className="flex items-center space-x-2">
              <List className={`h-4 w-4 ${actualViewMode === 'table' ? 'text-primary' : 'text-muted-foreground'}`} />
              <Switch
                checked={actualViewMode === 'deck'}
                onCheckedChange={(checked) => setViewMode(checked ? 'deck' : 'table')}
              />
              <Grid3X3 className={`h-4 w-4 ${actualViewMode === 'deck' ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
          </div>
        )}

        <div className="bg-card p-4 sm:p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Daftar Data Terisi</h2>
          {entries.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Belum ada data yang diisi.</p>
          ) : (
            actualViewMode === 'table' ? renderTableView() : renderDeckView()
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