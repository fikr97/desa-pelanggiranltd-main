import React, { useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, Download, Upload, PlusCircle, Pencil, Trash2, ArrowLeft, ArrowUpDown, Grid3X3, List, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter, Check } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';

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

  // Apply date format transformation first
  if ((field.tipe_field === 'date' || field.sumber_data === 'penduduk.tanggal_lahir') && value && value !== 'N/A' && field.format_tanggal) {
    try {
      let formatString = field.format_tanggal;
      if (formatString === 'd MMMM yyyy') {
        formatString = 'dd MMMM yyyy';
      } else if (formatString === 'EEEE, d MMMM yyyy') {
        formatString = 'EEEE, dd MMMM yyyy';
      }
      value = format(new Date(value), formatString, { locale: id });
    } catch (e) {
      console.error("Invalid date or format:", e);
      // Fallback to the raw value if date formatting fails
    }
  }

  // Apply text format transformation last
  if (field.text_format && typeof value === 'string') {
    switch (field.text_format) {
      case 'uppercase':
        value = value.toUpperCase();
        break;
      case 'lowercase':
        value = value.toLowerCase();
        break;
      case 'capitalize':
        value = value.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
        break;
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
  const [viewMode, setViewMode] = useState<'table' | 'deck'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFields, setSearchFields] = useState<string[]>([]); // Array to store selected field names to search in
  const [groupByField, setGroupByField] = useState<string | null>('none');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { data, isLoading, error } = useQuery({
    queryKey: ['form_data_and_def', formId],
    queryFn: async () => {
      const formQuery = supabase.from('form_tugas').select('*').eq('id', formId).single();
      const fieldsQuery = supabase.from('form_tugas_fields').select('*').eq('form_tugas_id', formId).order('urutan');
      const entriesQuery = supabase.from('form_tugas_data').select('*, penduduk(*)').eq('form_tugas_id', formId).order('created_at');
      
      // Execute all queries except residentsQuery first
      const [formResult, fieldsResult, entriesResult] = await Promise.all([
        formQuery, 
        fieldsQuery, 
        entriesQuery
      ]);

      if (formResult.error && formResult.error.code !== 'PGRST116') throw formResult.error;
      if (fieldsResult.error) throw fieldsResult.error;
      if (entriesResult.error) throw entriesResult.error;

      // Initialize deck visibility for fields if they don't exist (handles missing columns in DB)
      const initializedFields = fieldsResult.data?.map(field => ({
        ...field,
        deck_visible: field.deck_visible !== undefined ? field.deck_visible : false,
        deck_display_order: field.deck_display_order !== undefined ? field.deck_display_order : 0,
        deck_display_format: field.deck_display_format !== undefined ? field.deck_display_format : 'default',
        deck_is_header: field.deck_is_header !== undefined ? field.deck_is_header : false,
      })) || [];

      // Initialize button visibility settings if they don't exist (handles missing columns in DB)
      const formDef = {
        ...formResult.data,
        show_add_button: formResult.data?.show_add_button !== undefined ? formResult.data.show_add_button : true,
        show_edit_button: formResult.data?.show_edit_button !== undefined ? formResult.data.show_edit_button : true,
        show_delete_button: formResult.data?.show_delete_button !== undefined ? formResult.data.show_delete_button : true,
        fields: initializedFields,
      };

      // Now fetch residents separately to avoid timeout issues with large datasets
      const residentsResult = await (async () => {
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

      if (residentsResult.error) throw residentsResult.error;

      return {
        formDef: formDef,
        entries: entriesResult.data || [],
        residents: residentsResult.data || [],
      };
    },
    enabled: !!formId,
  });

  // Filter entries based on search term and selected fields
  const filteredEntries = useMemo(() => {
    if (!data?.entries || !searchTerm) return data?.entries || [];
    
    if (searchFields.length === 0) {
      // If no specific fields are selected, search in all fields
      return data.entries.filter(entry => {
        return data.formDef.fields.some(field => {
          const fieldValue = getFieldValue(entry, field);
          return fieldValue && String(fieldValue).toLowerCase().includes(searchTerm.toLowerCase());
        });
      });
    } else {
      // If specific fields are selected, only search in those fields
      return data.entries.filter(entry => {
        return data.formDef.fields.some(field => {
          // Only consider fields that are in the selected searchFields array
          if (!searchFields.includes(field.nama_field)) {
            return false;
          }
          const fieldValue = getFieldValue(entry, field);
          return fieldValue && String(fieldValue).toLowerCase().includes(searchTerm.toLowerCase());
        });
      });
    }
  }, [data?.entries, data?.formDef.fields, searchTerm, searchFields]);

  // Group entries by selected field
  const groupedEntries = useMemo(() => {
    if (!groupByField || groupByField === 'none' || !filteredEntries) return null;
    
    const groupMap: Record<string, any[]> = {};
    filteredEntries.forEach(entry => {
      const fieldValue = getFieldValue(entry, data?.formDef.fields.find(f => f.nama_field === groupByField));
      const groupKey = fieldValue ? String(fieldValue) : 'Belum Diisi';
      
      if (!groupMap[groupKey]) {
        groupMap[groupKey] = [];
      }
      groupMap[groupKey].push(entry);
    });
    
    return groupMap;
  }, [filteredEntries, groupByField, data?.formDef.fields]);

  const sortedEntries = useMemo(() => {
    if (!filteredEntries) return [];
    const sortableEntries = [...filteredEntries];
    sortableEntries.sort((a, b) => {
      let aValue, bValue;

      if (sortConfig.key === 'created_at') {
        aValue = new Date(a.created_at);
        bValue = new Date(b.created_at);
      } else {
        const field = data?.formDef.fields.find(f => f.nama_field === sortConfig.key);
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
  }, [filteredEntries, sortConfig, data?.formDef.fields]);

  // Pagination logic
  const paginatedEntries = useMemo(() => {
    if (!sortedEntries) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedEntries.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedEntries, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedEntries.length / itemsPerPage);

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

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  };

  // Pagination functions
  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const firstPage = () => {
    goToPage(1);
  };

  const lastPage = () => {
    goToPage(totalPages);
  };

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (error) return <div className="p-6 text-destructive">Error: {error.message}</div>;
  if (!data || !data.formDef) return <div className="p-6"><p>Form tidak ditemukan.</p></div>;

  const { formDef, entries, residents } = data;
  
  // Determine view mode based on form settings and user preference
  const actualViewMode = formDef.display_type === 'deck' ? viewMode : 'table';
  
  // Render table view with pagination
  const renderTableView = () => {
    if (groupByField && groupByField !== 'none' && groupedEntries) {
      // Grouped table view - only show group headers first
      return Object.entries(groupedEntries).map(([groupKey, groupEntries]) => (
        <div key={groupKey} className="mb-4">
          <div 
            className="flex justify-between items-center p-3 bg-muted rounded cursor-pointer hover:bg-muted/80"
            onClick={() => toggleGroup(groupKey)}
          >
            <h3 className="text-lg font-semibold">Grup: {groupKey} ({groupEntries.length})</h3>
            <Button variant="ghost" size="sm">
              {expandedGroups.has(groupKey) ? 'Tutup' : 'Buka'}
            </Button>
          </div>
          {expandedGroups.has(groupKey) && (
            <div className="overflow-x-auto relative mt-2">
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
                  {groupEntries.map((entry, index) => (
                    <TableRow key={entry.id}>
                      <TableCell>{index + 1}</TableCell>
                      {formDef.fields.map(field => (
                        <TableCell key={field.id}>{getFieldValue(entry, field)}</TableCell>
                      ))}
                      <TableCell className="flex gap-2 justify-end sticky right-0 bg-background z-10 border-l border-border min-w-[100px]">
                        {formDef.show_edit_button && (
                          <Button variant="secondary" size="sm" onClick={() => handleEdit(entry)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {formDef.show_delete_button && (
                          <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(entry)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      ));
    } else {
      // Non-grouped table view with pagination
      return (
        <div>
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
                {paginatedEntries.map((entry, index) => (
                  <TableRow key={entry.id}>
                    <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                    {formDef.fields.map(field => (
                      <TableCell key={field.id}>{getFieldValue(entry, field)}</TableCell>
                    ))}
                    <TableCell className="flex gap-2 justify-end sticky right-0 bg-background z-10 border-l border-border min-w-[100px]">
                      {formDef.show_edit_button && (
                        <Button variant="secondary" size="sm" onClick={() => handleEdit(entry)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {formDef.show_delete_button && (
                        <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(entry)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">
                Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, sortedEntries.length)} dari {sortedEntries.length} data
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={firstPage}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center space-x-1">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(pageNum)}
                        className="w-10 h-10"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={lastPage}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Baris per halaman:</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(Number(value));
                    setCurrentPage(1); // Reset to first page when changing items per page
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      );
    }
  };
  
  // Render deck view
  const renderDeckView = () => {
    if (groupByField && groupByField !== 'none' && groupedEntries) {
      // Grouped deck view - only show group headers first
      return Object.entries(groupedEntries).map(([groupKey, groupEntries]) => {
        const isExpanded = expandedGroups.has(groupKey);
        
        return (
          <div key={groupKey} className="mb-4">
            <div 
              className="flex justify-between items-center p-3 bg-muted rounded cursor-pointer hover:bg-muted/80"
              onClick={() => toggleGroup(groupKey)}
            >
              <h3 className="text-lg font-semibold">Grup: {groupKey} ({groupEntries.length})</h3>
              <Button variant="ghost" size="sm">
                {isExpanded ? 'Tutup' : 'Buka'}
              </Button>
            </div>
            
            {isExpanded && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                {groupEntries.map((entry, index) => {
                  // Use deck display fields from the form fields if they exist and are visible
                  // Filter out fields that have missing deck columns (to prevent errors if columns don't exist in DB yet)
                  const visibleDeckFields = formDef.fields
                    .filter(field => field.deck_visible)
                    .sort((a, b) => (a.deck_display_order || 0) - (b.deck_display_order || 0));
                  
                  // Find the header field if any
                  const headerField = visibleDeckFields.find(f => f.deck_is_header);
                  const headerFieldValue = headerField ? getFieldValue(entry, headerField) : null;
                  
                  // Get non-header fields to display in body
                  const bodyFields = visibleDeckFields.filter(f => !f.deck_is_header);
                  
                  return (
                    <Card key={entry.id} className="overflow-hidden flex flex-col">
                      {headerFieldValue && (
                        <CardHeader className={headerField.deck_display_format === 'header' ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
                          <CardTitle className="text-lg break-words">{headerFieldValue}</CardTitle>
                        </CardHeader>
                      )}
                      <CardContent className="p-4 flex-grow">
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
                        
                        <div className="flex gap-2 mt-4 justify-end">
                          {formDef.show_edit_button && (
                            <Button variant="secondary" size="sm" onClick={() => handleEdit(entry)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {formDef.show_delete_button && (
                            <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(entry)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        );
      });
    } else {
      // Non-grouped deck view with pagination
      // Use deck display fields from the form fields if they exist and are visible
      // Filter out fields that have missing deck columns (to prevent errors if columns don't exist in DB yet)
      const visibleDeckFields = formDef.fields
        .filter(field => field.deck_visible)
        .sort((a, b) => (a.deck_display_order || 0) - (b.deck_display_order || 0));
      
      return (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedEntries.map((entry, index) => {
              // Find the header field if any
              const headerField = visibleDeckFields.find(f => f.deck_is_header);
              const headerFieldValue = headerField ? getFieldValue(entry, headerField) : null;
              
              // Get non-header fields to display in body
              const bodyFields = visibleDeckFields.filter(f => !f.deck_is_header);
              
              return (
                <Card key={entry.id} className="overflow-hidden flex flex-col">
                  {headerFieldValue && (
                    <CardHeader className={headerField.deck_display_format === 'header' ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
                      <CardTitle className="text-lg break-words">{headerFieldValue}</CardTitle>
                    </CardHeader>
                  )}
                  <CardContent className="p-4 flex-grow">
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
                    
                    <div className="flex gap-2 mt-4 justify-end">
                      {formDef.show_edit_button && (
                        <Button variant="secondary" size="sm" onClick={() => handleEdit(entry)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {formDef.show_delete_button && (
                        <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(entry)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          {/* Pagination Controls for Deck View */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">
                Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, sortedEntries.length)} dari {sortedEntries.length} data
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={firstPage}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center space-x-1">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(pageNum)}
                        className="w-10 h-10"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={lastPage}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Baris per halaman:</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(Number(value));
                    setCurrentPage(1); // Reset to first page when changing items per page
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      );
    }
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
            {formDef.show_add_button && (
              <Button 
                onClick={handleAddNew} 
                className="flex-1 py-2 px-3 sm:py-3 sm:px-4 text-sm min-w-[100px]"
              >
                <PlusCircle className="h-4 w-4 mr-1 sm:mr-2" />
                <span>Tambah</span>
              </Button>
            )}
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
        {/* Search box, field selector, group by selector and view toggles */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="flex flex-col md:flex-row gap-2 w-full">
            <div className="relative w-full md:w-1/2 mb-2 md:mb-0">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Cari data..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full"
              />
            </div>
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-1/2">
              {/* Field Selection Dropdown */}
              <div className="w-full md:w-auto mb-2 md:mb-0">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between text-sm bg-background hover:bg-background"
                    >
                      <span className="flex items-center">
                        <Filter className="mr-2 h-4 w-4" />
                        {searchFields.length === 0
                          ? "Pilih field untuk pencarian"
                          : searchFields.length === 1
                          ? `1 field dipilih`
                          : `${searchFields.length} field dipilih`}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-4" align="start">
                    <div className="mb-2">
                      <h4 className="font-medium">Pilih Field Pencarian</h4>
                      <p className="text-xs text-muted-foreground">
                        Pilih field yang akan dicari
                      </p>
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {formDef.fields.map((field) => (
                        <div key={field.nama_field} className="flex items-center space-x-2">
                          <Checkbox
                            id={`field-${field.nama_field}`}
                            checked={searchFields.includes(field.nama_field)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSearchFields(prev => [...prev, field.nama_field]);
                              } else {
                                setSearchFields(prev => prev.filter(f => f !== field.nama_field));
                              }
                            }}
                          />
                          <Label 
                            htmlFor={`field-${field.nama_field}`} 
                            className="text-sm font-normal cursor-pointer"
                          >
                            {field.label_field}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {searchFields.length > 0 && (
                      <div className="mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSearchFields([])}
                          className="text-sm"
                        >
                          Hapus Semua Pilihan
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
              <div className="w-full md:w-auto">
                <Select value={groupByField || 'none'} onValueChange={(value) => setGroupByField(value === 'none' ? null : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Grup berdasarkan..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tidak Ada Grup</SelectItem>
                    {formDef.fields.map(field => (
                      <SelectItem key={field.nama_field} value={field.nama_field}>
                        {field.label_field}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          {(formDef.display_type === 'deck') && (
            <div className="flex items-center space-x-2">
              <List className={`h-4 w-4 ${actualViewMode === 'table' ? 'text-primary' : 'text-muted-foreground'}`} />
              <Switch
                checked={actualViewMode === 'deck'}
                onCheckedChange={(checked) => setViewMode(checked ? 'deck' : 'table')}
              />
              <Grid3X3 className={`h-4 w-4 ${actualViewMode === 'deck' ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
          )}
        </div>

        <div className="bg-card p-4 sm:p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Daftar Data Terisi</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Menampilkan {sortedEntries.length} dari {entries.length} data
            {groupByField && groupByField !== 'none' && groupedEntries ? ` dalam ${Object.keys(groupedEntries).length} grup` : ''}
          </p>
          {entries.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Belum ada data yang diisi.</p>
          ) : (
            actualViewMode === 'table' ? renderTableView() : renderDeckView()
          )}
        </div>
      </div>

      {/* Fixed Add button for mobile */}
      {formDef.show_add_button && (
        <Button 
          onClick={handleAddNew} 
          className="fixed bottom-6 right-6 rounded-full w-14 h-14 p-0 shadow-lg md:hidden z-50"
          aria-label="Tambah Data Baru"
        >
          <PlusCircle className="h-6 w-6" />
        </Button>
      )}

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