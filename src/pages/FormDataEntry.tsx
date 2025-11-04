import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, deleteImage } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, Download, Upload, PlusCircle, Pencil, Trash2, ArrowLeft, ArrowUpDown, Grid3X3, List, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter, Check, FileText } from 'lucide-react';
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
import AdvancedFormFilter from '@/components/AdvancedFormFilter';

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

  // Special handling for image values
  if (field.tipe_field === 'image') {
    if (value && typeof value === 'string' && value.startsWith('http')) {
      // Return a special indicator that this is an image
      return { type: 'image', url: value };
    }
    return value || 'N/A';
  }

  // Special handling for coordinate values
  if (field.tipe_field === 'coordinate') {
    if (value && typeof value === 'string') {
      // If it's already in the correct "lat, lng" format, return as is
      if (value.includes(',')) {
        return value;
      } else {
        try {
          // If it's a JSON string, parse it and convert
          const coordObj = JSON.parse(value);
          if (coordObj.lat !== undefined && coordObj.lng !== undefined) {
            return `${coordObj.lat}, ${coordObj.lng}`;
          }
        } catch (e) {
          console.error("Error parsing coordinate value:", e);
          return 'Koordinat tidak valid';
        }
      }
    } else if (value && typeof value === 'object') {
      // If it's an object, format it as a string
      return `${value.lat}, ${value.lng}`;
    }
    return 'Koordinat tidak valid';
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
  const { user, profile } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'descending' });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFields, setSearchFields] = useState<string[]>([]); // Array to store selected field names to search in
  const [groupByField, setGroupByField] = useState<string | null>('none'); // Keep for backward compatibility
  const [groupByHierarchy, setGroupByHierarchy] = useState<string[]>([]); // New state for nested groups
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'table' | 'deck'>('table');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  // State for hierarchical group navigation
  const [currentGroupPath, setCurrentGroupPath] = useState<string[]>([]);
  // Advanced filter state
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({});

  const { data, isLoading, error } = useQuery({
    queryKey: ['form_data_and_def', formId],
    queryFn: async () => {
      // First, check if user can access the form itself
      const formQuery = supabase.from('form_tugas').select('*').eq('id', formId).single();
      const [formRes] = await Promise.all([formQuery]);
      
      if (formRes.error) {
        console.error('Error fetching form:', formRes.error);
        // Jika error karena permission, lempar error spesifik
        if (formRes.error.code === '42501' || formRes.error.message.includes('permission denied')) {
          throw new Error('permission_denied_form');
        }
        throw formRes.error;
      }

      const fieldsQuery = supabase.from('form_tugas_fields').select('*').eq('form_tugas_id', formId).order('urutan');
      
      // Execute form and fields queries first to determine form mode
      const [formResult, fieldsResult] = await Promise.all([
        formQuery, 
        fieldsQuery
      ]);

      if (formResult.error && formResult.error.code !== 'PGRST116') throw formResult.error;
      if (fieldsResult.error) throw fieldsResult.error;

      // Initialize form definition early to check visibility mode
      const tempFormDef = {
        ...formResult.data,
        show_add_button: formResult.data?.show_add_button !== undefined ? formResult.data.show_add_button : true,
        show_edit_button: formResult.data?.show_edit_button !== undefined ? formResult.data.show_edit_button : true,
        show_delete_button: formResult.data?.show_delete_button !== undefined ? formResult.data.show_delete_button : true,
      };

      // Check if the form is in 'semua_data' mode
      const isAllDataMode = tempFormDef.visibilitas_dusun === 'semua_data';

      // Fetch form entries data using multiple queries to get all data (similar to penduduk approach)
      let allEntriesData: any[] = [];
      let from = 0;
      const limit = 1000; // Supabase default limit per query
      let hasMore = true;

      if (isAllDataMode) {
        // Use RPC function for 'semua_data' mode to get entries with full penduduk data
        while (hasMore) {
          const { data: entriesData, error: entriesError } = await supabase
            .rpc('get_form_data_with_penduduk', { p_form_id: formId })
            .range(from, from + limit - 1);

          if (entriesError) {
            console.error('Error fetching form entries data via RPC:', entriesError);
            // Jika error karena permission, lempar error spesifik
            if (entriesError.code === '42501' || entriesError.message.includes('permission denied')) {
              throw new Error('permission_denied_form_data');
            }
            throw entriesError;
          }

          if (entriesData && entriesData.length > 0) {
            // Transform data from RPC to match expected structure
            const transformedData = entriesData.map(item => ({
              id: item.form_data_id,
              form_tugas_id: item.form_tugas_id,
              penduduk_id: item.penduduk_id,
              data_custom: item.data_custom,
              submitted_by: item.submitted_by,
              created_at: item.created_at,
              updated_at: item.updated_at,
              user_id: item.user_id,
              penduduk: {
                id: item.penduduk_id,
                no_kk: item.penduduk_no_kk,
                nik: item.penduduk_nik,
                nama: item.penduduk_nama,
                jenis_kelamin: item.penduduk_jenis_kelamin,
                tempat_lahir: item.penduduk_tempat_lahir,
                tanggal_lahir: item.penduduk_tanggal_lahir,
                golongan_darah: item.penduduk_golongan_darah,
                agama: item.penduduk_agama,
                status_kawin: item.penduduk_status_kawin,
                status_hubungan: item.penduduk_status_hubungan,
                pendidikan: item.penduduk_pendidikan,
                pekerjaan: item.penduduk_pekerjaan,
                nama_ibu: item.penduduk_nama_ibu,
                nama_ayah: item.penduduk_nama_ayah,
                rt: item.penduduk_rt,
                rw: item.penduduk_rw,
                dusun: item.penduduk_dusun,
                nama_kep_kel: item.penduduk_nama_kep_kel,
                alamat_lengkap: item.penduduk_alamat_lengkap,
                nama_prop: item.penduduk_nama_prop,
                nama_kab: item.penduduk_nama_kab,
                nama_kec: item.penduduk_nama_kec,
                nama_kel: item.penduduk_nama_kel,
              }
            }));
            
            allEntriesData = [...allEntriesData, ...transformedData];
            console.log(`Fetched ${transformedData.length} form entries via RPC, total so far: ${allEntriesData.length}`);
            
            if (transformedData.length < limit) {
              hasMore = false;
            } else {
              from += limit;
            }
          } else {
            hasMore = false;
          }
        }
      } else {
        // For normal modes, use the standard query with RLS
        while (hasMore) {
          const { data: entriesData, error: entriesError, count } = await supabase
            .from('form_tugas_data')
            .select('*, penduduk(*)', { count: 'exact' })
            .eq('form_tugas_id', formId)
            .order('created_at')
            .range(from, from + limit - 1);

          if (entriesError) {
            console.error('Error fetching form entries data:', entriesError);
            // Jika error karena permission, lempar error spesifik
            if (entriesError.code === '42501' || entriesError.message.includes('permission denied')) {
              throw new Error('permission_denied_form_data');
            }
            throw entriesError;
          }

          if (entriesData) {
            allEntriesData = [...allEntriesData, ...entriesData];
            console.log(`Fetched ${entriesData.length} form entries, total so far: ${allEntriesData.length}`);
            
            // If we got less than the limit, we've reached the end
            if (entriesData.length < limit) {
              hasMore = false;
            } else {
              from += limit;
            }
          } else {
            hasMore = false;
          }
        }
      }

      console.log(`Total form entries fetched: ${allEntriesData.length} records from database`);

      if (formResult.error && formResult.error.code !== 'PGRST116') throw formResult.error;
      if (fieldsResult.error) throw fieldsResult.error;

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
        entries: allEntriesData || [],
        residents: residentsResult.data || [],
      };
    },
    enabled: !!formId,
  });

  // Debug: Log residents data to help troubleshoot
  useEffect(() => {
    if (data?.residents) {
      console.log('FormDataEntry - Total residents loaded:', data.residents.length);
      if (data?.formDef?.visibilitas_dusun) {
        console.log('FormDataEntry - Form visibility setting:', data.formDef.visibilitas_dusun);
      }
      if (profile?.dusun) {
        console.log('FormDataEntry - User profile dusun:', profile.dusun);
      }
    }
  }, [data, profile]);

  // Filter entries based on search term, selected fields, and advanced filters
  const filteredEntries = useMemo(() => {
    if (!data?.entries) return data?.entries || [];
    
    let result = data.entries;
    
    // Apply basic search if there's a search term
    if (searchTerm) {
      if (searchFields.length === 0) {
        // If no specific fields are selected, search in all fields
        result = result.filter(entry => {
          return data.formDef.fields.some(field => {
            const fieldValue = getFieldValue(entry, field);
            return fieldValue && String(fieldValue).toLowerCase().includes(searchTerm.toLowerCase());
          });
        });
      } else {
        // If specific fields are selected, only search in those fields
        result = result.filter(entry => {
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
    }
    
    // Apply advanced filters
    if (advancedFilters && Object.keys(advancedFilters).length > 0) {
      result = result.filter(entry => {
        return Object.entries(advancedFilters).every(([fieldName, filterValue]) => {
          if (!filterValue || !filterValue.value) return true;
          
          const fieldValue = entry.data_custom?.[fieldName] || entry.penduduk?.[fieldName] || 'N/A';
          
          if (filterValue.type === 'string') {
            const filterStr = String(filterValue.value).toLowerCase();
            return String(fieldValue).toLowerCase().includes(filterStr);
          } else if (filterValue.type === 'number') {
            const filterNum = Number(filterValue.value);
            const fieldNum = Number(fieldValue);
            return !isNaN(fieldNum) && fieldNum === filterNum;
          } else if (filterValue.type === 'date') {
            return String(fieldValue).split('T')[0] === String(filterValue.value);
          } else if (filterValue.type === 'boolean') {
            return Boolean(fieldValue) === Boolean(filterValue.value);
          } else if (filterValue.type === 'dropdown' && Array.isArray(filterValue.value)) {
            return filterValue.value.includes(String(fieldValue));
          }
          
          return true;
        });
      });
    }
    
    return result;
  }, [data?.entries, data?.formDef.fields, searchTerm, searchFields, advancedFilters]);

  // Get entries for the current group path in hierarchical navigation
  const entriesForCurrentPath = useMemo(() => {
    if (!filteredEntries || currentGroupPath.length === 0) return filteredEntries || [];
    
    // Navigate through the group hierarchy based on the current path
    let currentLevelEntries = filteredEntries;
    for (let i = 0; i < currentGroupPath.length; i++) {
      const fieldName = groupByHierarchy[i];
      const field = data?.formDef.fields.find(f => f.nama_field === fieldName);
      if (!field) break;
      
      // Find the entries that match the current path segment
      currentLevelEntries = currentLevelEntries.filter(entry => {
        const fieldValue = getFieldValue(entry, field);
        return String(fieldValue) === currentGroupPath[i] || (fieldValue === null && currentGroupPath[i] === 'Belum Diisi');
      });
    }
    return currentLevelEntries;
  }, [filteredEntries, currentGroupPath, groupByHierarchy, data?.formDef.fields]);

  // Group entries by hierarchy (primary) with fallback to single-level grouping
  const groupedEntries = useMemo(() => {
    if (!filteredEntries) return null;
    
    // Use nested grouping if hierarchy is defined
    if (groupByHierarchy && groupByHierarchy.length > 0) {
      // Create nested grouping based on hierarchy
      // This will create a nested object structure: {level1: {level2: {level3: [entries...]}}}
      const groupByLevel = (entries, hierarchy, level = 0) => {
        if (level >= hierarchy.length) {
          // We've reached the deepest level, return the entries as-is
          return entries;
        }

        const currentFieldId = hierarchy[level];
        const groupedResult = {};

        entries.forEach(entry => {
          const fieldValue = getFieldValue(entry, data?.formDef.fields.find(f => f.nama_field === currentFieldId));
          const groupKey = fieldValue ? String(fieldValue) : 'Belum Diisi';
          
          if (!groupedResult[groupKey]) {
            groupedResult[groupKey] = [];
          }
          groupedResult[groupKey].push(entry);
        });

        // Recursively apply grouping to each subgroup for the next level
        for (const key in groupedResult) {
          groupedResult[key] = groupByLevel(groupedResult[key], hierarchy, level + 1);
        }

        return groupedResult;
      };

      return groupByLevel(filteredEntries, groupByHierarchy);
    }
    
    return null;
  }, [filteredEntries, groupByHierarchy, data?.formDef.fields]);

  // Get grouped entries for the current navigation level
  const groupedEntriesForCurrentLevel = useMemo(() => {
    if (!groupedEntries || currentGroupPath.length >= groupByHierarchy.length) return null;
    
    // Navigate to the current group level in the hierarchy
    let currentGroup = groupedEntries;
    for (let i = 0; i < currentGroupPath.length; i++) {
      const groupKey = currentGroupPath[i];
      if (currentGroup[groupKey]) {
        currentGroup = currentGroup[groupKey];
      } else {
        // If the group doesn't exist in the hierarchy, return null
        return null;
      }
    }
    
    // If we're at the final level, the currentGroup should be an array of entries
    // If not, it means we're in the middle of the hierarchy and need to return the next level
    if (Array.isArray(currentGroup)) {
      // We're at the leaf level (entries), so return null since there are no more groups to show
      return null;
    } else {
      // We're at an intermediate level with more groups to navigate
      return currentGroup;
    }
  }, [groupedEntries, currentGroupPath, groupByHierarchy]);

  const sortedEntries = useMemo(() => {
    if (!entriesForCurrentPath) return [];
    const sortableEntries = [...entriesForCurrentPath];
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
  }, [entriesForCurrentPath, sortConfig, data?.formDef.fields]);

  // Pagination logic
  const paginatedEntries = useMemo(() => {
    if (!sortedEntries) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedEntries.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedEntries, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedEntries.length / itemsPerPage);

  // Reset to first page when the current group path changes
  useEffect(() => {
    setCurrentPage(1);
  }, [currentGroupPath]);

  // This single useEffect will manage the viewMode and default grouping based on form config and user preference.
  useEffect(() => {
    if (data?.formDef && !isLoading) {
      // Set view mode
      const formDisplayType = data.formDef.display_type || 'table';
      if (formDisplayType === 'table') {
        setViewMode('table');
      } else { // formDisplayType is 'deck'
        const savedViewMode = localStorage.getItem(`form_view_mode_${formId}`);
        if (savedViewMode === 'table' || savedViewMode === 'deck') {
          setViewMode(savedViewMode);
        } else {
          setViewMode('deck');
        }
      }

      // Set group hierarchy if it exists (new feature)
      if (data.formDef.group_by_hierarchy && Array.isArray(data.formDef.group_by_hierarchy) && data.formDef.group_by_hierarchy.length > 0) {
        setGroupByHierarchy(data.formDef.group_by_hierarchy);
      } else if (data.formDef.default_group_by) {
        // Fallback: if there's no hierarchy but there's a default group by, use that as a single-level hierarchy
        setGroupByHierarchy([data.formDef.default_group_by]);
      }
    }
  }, [data?.formDef, isLoading, formId]);

  // This effect is just for saving the user's choice.
  useEffect(() => {
    // Only save the view mode if the form is a deck type.
    // Don't save the preference for table-only forms.
    if (data?.formDef?.display_type === 'deck' && viewMode) {
      localStorage.setItem(`form_view_mode_${formId}`, viewMode);
    }
  }, [viewMode, formId, data?.formDef?.display_type]);

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
      // First, check if the entry has any images to delete
      if (entryToDelete.data_custom) {
        // Find all image fields in the current form
        const imageFields = data.formDef.fields.filter(field => field.tipe_field === 'image');
        
        // Delete all images associated with this entry
        for (const field of imageFields) {
          const imageUrl = entryToDelete.data_custom[field.nama_field];
          if (imageUrl && typeof imageUrl === 'string' && imageUrl.includes('supabase.co')) {
            try {
              const deleteResult = await deleteImage(imageUrl);
              if (!deleteResult) {
                console.warn(`Failed to delete image: ${imageUrl}`);
              } else {
                console.log(`Deleted image: ${imageUrl}`);
              }
            } catch (deleteError) {
              console.error(`Error deleting image ${imageUrl}:`, deleteError);
            }
          }
        }
      }
      
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
      if (field.tipe_field === 'coordinate') {
        // For coordinate fields, check if both lat and lng are provided
        let isEmpty = true;
        if (value) {
          try {
            const coordValue = typeof value === 'string' ? JSON.parse(value) : value;
            if (coordValue && coordValue.lat && coordValue.lng) {
              isEmpty = false;
            }
          } catch (e) {
            // If parsing fails but value exists, check if it's in "lat, lng" format
            if (typeof value === 'string' && value.includes(',')) {
              const [lat, lng] = value.split(',').map(coord => coord.trim());
              if (lat && lng) {
                isEmpty = false;
              }
            } else if (value) {
              isEmpty = false; // If it's a string that doesn't parse as JSON but exists, consider it filled
            }
          }
        }
        if (isEmpty) {
          missingFields.push(field.label_field);
        }
      } else {
        if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
          missingFields.push(field.label_field);
        }
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
    const dataToSave: Record<string, any> = {};
    data.formDef.fields.forEach(field => {
      // Handle coordinate fields specifically
      if (field.tipe_field === 'coordinate') {
        const coordValue = formData[field.nama_field];
        if (typeof coordValue === 'string' && coordValue.includes(',')) {
          // If it's already in the "lat, lng" format, store as is
          dataToSave[field.nama_field] = coordValue;
        } else if (coordValue && typeof coordValue === 'object') {
          // If it's an object, convert to "lat, lng" string format
          dataToSave[field.nama_field] = `${coordValue.lat}, ${coordValue.lng}`;
        } else {
          dataToSave[field.nama_field] = coordValue;
        }
      } else {
        dataToSave[field.nama_field] = formData[field.nama_field];
      }
    });
    
    // Check for duplicate NIK if the form contains a NIK field
    const nikField = data.formDef.fields.find(field => field.nama_field === 'nik');
    if (nikField && dataToSave.nik) {
      // Check if NIK already exists in the same form (excluding current entry if updating)
      // Use a more direct approach to check for NIK in data_custom JSON
      let query = supabase
        .from('form_tugas_data')
        .select('id, data_custom')
        .eq('form_tugas_id', formId);
      
      if (entryId) {
        query = query.not('id', 'eq', entryId); // Exclude current entry if updating
      }
      
      const { data: existingEntries, error: queryError } = await query;
      
      if (queryError) {
        console.error('Error checking for duplicate NIK:', queryError);
        // Continue with the save operation in case of error, but log it
      } else if (existingEntries) {
        const duplicateEntry = existingEntries.find(entry => 
          entry.data_custom && entry.data_custom.nik === dataToSave.nik
        );
        
        if (duplicateEntry) {
          toast({
            title: 'NIK Sudah Ada',
            description: 'NIK yang Anda masukkan sudah terdaftar dalam form ini. Silakan gunakan NIK yang berbeda.',
            variant: 'destructive',
          });
          setIsSaving(false);
          return;
        }
      }
    }
    
    // Check if form is in 'semua_data' mode
    const isAllDataMode = data?.formDef?.visibilitas_dusun === 'semua_data';
    
    if (isAllDataMode) {
      try {
        let result;
        if (entryId) {
          // Check if any image fields have been updated to clean up old images (for all data mode)
          const oldEntry = data.entries.find(entry => entry.id === entryId);
          if (oldEntry) {
            // Find all image fields in the form
            const imageFields = data.formDef.fields.filter(field => field.tipe_field === 'image');
            
            // Compare old and new values for image fields
            for (const field of imageFields) {
              const oldUrl = oldEntry.data_custom?.[field.nama_field];
              const newUrl = dataToSave[field.nama_field];
              
              // If the image has been changed, delete the old one
              if (oldUrl && newUrl && oldUrl !== newUrl) {
                // Check if oldUrl is a Supabase storage URL before attempting to delete
                if (oldUrl.includes('supabase.co')) {
                  try {
                    const deleteResult = await deleteImage(oldUrl);
                    if (!deleteResult) {
                      console.warn(`Failed to delete old image: ${oldUrl}`);
                    } else {
                      console.log(`Deleted old image: ${oldUrl}`);
                    }
                  } catch (deleteError) {
                    console.error(`Error deleting old image ${oldUrl}:`, deleteError);
                  }
                }
              }
            }
          }
          
          console.log('Updating existing entry in all data mode:', { 
            entryId, 
            formId, 
            residentId: residentId || null, 
            dataToSave 
          });
          // Use the new update function for updates in 'semua_data' mode
          result = await supabase.rpc('update_form_data_for_all_dusun', {
            p_form_data_id: entryId,
            p_form_id: formId,
            p_penduduk_id: residentId || null, // Use null if not provided
            p_data_custom: dataToSave
          });
        } else {
          console.log('Inserting new entry in all data mode:', { 
            formId, 
            residentId: residentId || null, 
            dataToSave 
          });
          // For new entries in 'semua_data' mode, use special insert function
          result = await supabase.rpc('insert_form_data_for_all_dusun', {
            p_form_id: formId,
            p_penduduk_id: residentId || null, // Use null if not provided
            p_data_custom: dataToSave
          });
        }
        
        // Check result from the operation
        if (result.error) {
          console.error('Error saving data:', result.error);
          throw result.error;
        }
        
        // Check the success status from the RPC result for inserts/updates
        if (result.data) {
          const rpcResult = result.data?.[0];
          if (rpcResult && rpcResult.success === false) {
            throw new Error(rpcResult.message || 'Gagal menyimpan data');
          }
        }
        
        console.log('Data saved successfully in all data mode');
        toast({ title: 'Berhasil', description: 'Data berhasil disimpan.' });
        queryClient.invalidateQueries({ queryKey: ['form_data_and_def', formId] });
        setIsFormOpen(false);
        setEditingEntry(null);
      } catch (err) {
        console.error('Error in all data mode:', err);
        console.error('Error details:', {
          message: err.message,
          code: err.code,
          hint: err.hint,
          details: err.details
        });
        toast({ 
          title: 'Gagal', 
          description: `Terjadi kesalahan: ${err.message}. ${err.code ? `Kode: ${err.code}.` : ''}`, 
          variant: 'destructive' 
        });
      } finally {
        setIsSaving(false);
      }
    } else {
      // Normal mode - check if we need to use the update function for all dusun (for cases where kadus needs to update across dusun)
      // The approach depends on the user role and form settings
      try {
        // First, check if the user is an admin or kadus, and if we're in a situation where we might need 
        // to use more complex permission handling
        if (entryId) {
          // For updates in normal mode, we'll check if an RPC function exists for updating
          // First, let's try using the update_form_data_with_penduduk_check function if it exists
          try {
            // Check if any image fields have been updated to clean up old images (for RPC function in normal mode)
            const oldEntry = data.entries.find(entry => entry.id === entryId);
            if (oldEntry) {
              // Find all image fields in the form
              const imageFields = data.formDef.fields.filter(field => field.tipe_field === 'image');
              
              // Compare old and new values for image fields
              for (const field of imageFields) {
                const oldUrl = oldEntry.data_custom?.[field.nama_field];
                const newUrl = dataToSave[field.nama_field];
                
                // If the image has been changed, delete the old one
                if (oldUrl && newUrl && oldUrl !== newUrl) {
                  // Check if oldUrl is a Supabase storage URL before attempting to delete
                  if (oldUrl.includes('supabase.co')) {
                    try {
                      const deleteResult = await deleteImage(oldUrl);
                      if (!deleteResult) {
                        console.warn(`Failed to delete old image: ${oldUrl}`);
                      } else {
                        console.log(`Deleted old image: ${oldUrl}`);
                      }
                    } catch (deleteError) {
                      console.error(`Error deleting old image ${oldUrl}:`, deleteError);
                    }
                  }
                }
              }
            }
            
            console.log('Updating existing entry in normal mode using RPC:', { 
              entryId, 
              formId, 
              residentId: residentId || null, 
              dataToSave 
            });
            
            const result = await supabase.rpc('update_form_data_with_penduduk_check', {
              p_form_data_id: entryId,
              p_form_id: formId,
              p_penduduk_id: residentId || null, // Use null if not provided
              p_data_custom: dataToSave
            });
            
            // Check result from the operation
            if (result.error) {
              console.error('Error using update RPC function:', result.error);
              // If the RPC function doesn't exist or fails, we'll try the direct approach below
              throw result.error;
            }
            
            // Check the success status from the RPC result for updates
            if (result.data) {
              const rpcResult = result.data?.[0];
              if (rpcResult && rpcResult.success === false) {
                throw new Error(rpcResult.message || 'Gagal menyimpan data');
              }
            }
            
            console.log('Data updated successfully using RPC in normal mode');
            toast({ title: 'Berhasil', description: 'Data berhasil disimpan.' });
            queryClient.invalidateQueries({ queryKey: ['form_data_and_def', formId] });
            setIsFormOpen(false);
            setEditingEntry(null);
            setIsSaving(false);
            return; // Exit early since we've successfully updated
          } catch (rpcErr) {
            console.log('RPC update function failed or not available, trying direct approach:', rpcErr.message);
            // If RPC function doesn't exist or fails, we'll fall back to direct approach
          }
        }

        // For both insert and fallback in update, use direct approach
        const payload = {
          penduduk_id: residentId || null, // Use null if not provided
          data_custom: dataToSave,
          user_id: user?.id,
        };
        
        let result;
        if (entryId) {
          // Check if any image fields have been updated to clean up old images
          const oldEntry = data.entries.find(entry => entry.id === entryId);
          if (oldEntry) {
            // Find all image fields in the form
            const imageFields = data.formDef.fields.filter(field => field.tipe_field === 'image');
            
            // Compare old and new values for image fields
            for (const field of imageFields) {
              const oldUrl = oldEntry.data_custom?.[field.nama_field];
              const newUrl = dataToSave[field.nama_field];
              
              // If the image has been changed, delete the old one
              if (oldUrl && newUrl && oldUrl !== newUrl) {
                // Check if oldUrl is a Supabase storage URL before attempting to delete
                if (oldUrl.includes('supabase.co')) {
                  try {
                    const deleteResult = await deleteImage(oldUrl);
                    if (!deleteResult) {
                      console.warn(`Failed to delete old image: ${oldUrl}`);
                    } else {
                      console.log(`Deleted old image: ${oldUrl}`);
                    }
                  } catch (deleteError) {
                    console.error(`Error deleting old image ${oldUrl}:`, deleteError);
                  }
                }
              }
            }
          }
          
          console.log('Updating existing entry with direct approach:', { entryId, payload });
          // For updates, don't include form_tugas_id as it shouldn't change
          result = await supabase.from('form_tugas_data').update(payload).eq('id', entryId);
        } else {
          // For new entries, include form_tugas_id
          const insertPayload = { ...payload, form_tugas_id: formId };
          console.log('Inserting new entry:', { insertPayload });
          result = await supabase.from('form_tugas_data').insert(insertPayload);
        }
        
        if (result.error) {
          console.error('Error saving data with direct approach:', result.error);
          throw result.error;
        }
        
        toast({ title: 'Berhasil', description: 'Data berhasil disimpan.' });
        queryClient.invalidateQueries({ queryKey: ['form_data_and_def', formId] });
        setIsFormOpen(false);
        setEditingEntry(null);
      } catch (err) {
        console.error('Error in normal mode:', err);
        console.error('Error details:', {
          message: err.message,
          code: err.code,
          hint: err.hint,
          details: err.details
        });
        toast({ 
          title: 'Gagal', 
          description: `Terjadi kesalahan saat menyimpan data: ${err.message}. ${err.code ? `Kode: ${err.code}.` : ''} Pastikan data yang dimasukkan benar dan lengkap.`, 
          variant: 'destructive' 
        });
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleExport = () => {
    const headers = data.formDef.fields.map(f => f.label_field);
    const dataForSheet = sortedEntries.map(entry => {
      const row = {};
      data.formDef.fields.forEach(field => {
        let value = getFieldValue(entry, field);
        
        // Handle image fields for export - extract URL if it's an image object
        if (field.tipe_field === 'image' && typeof value === 'object' && value.type === 'image' && value.url) {
          value = value.url;  // Use the URL directly for export
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

  const handleExportFiltered = () => {
    const headers = data.formDef.fields.map(f => f.label_field);
    const dataForSheet = filteredEntries.map(entry => {
      const row = {};
      data.formDef.fields.forEach(field => {
        let value = getFieldValue(entry, field);
        
        // Handle image fields for export - extract URL if it's an image object
        if (field.tipe_field === 'image' && typeof value === 'object' && value.type === 'image' && value.url) {
          value = value.url;  // Use the URL directly for export
        }
        
        row[field.label_field] = value;
      });
      return row;
    });
    const worksheet = XLSX.utils.json_to_sheet(dataForSheet, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Terfilter');
    XLSX.writeFile(workbook, `${data.formDef.nama_tugas.replace(/\s+/g, '_')}_terfilter.xlsx`);
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

  // Navigation functions for hierarchical groups
  const navigateToGroup = (groupName: string) => {
    setCurrentGroupPath(prev => [...prev, groupName]);
  };

  const navigateBack = () => {
    setCurrentGroupPath(prev => prev.slice(0, -1));
  };

  const navigateToRoot = () => {
    setCurrentGroupPath([]);
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

  const handleApplyAdvancedFilter = (filters) => {
    setAdvancedFilters(filters);
  };

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  
  // Handle specific permission errors
  if (error && error.message.includes('permission_denied_form')) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Akses Form Ditolak</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Anda tidak memiliki izin untuk mengakses formulir ini. 
              Formulir ini mungkin hanya tersedia untuk dusun tertentu.
            </p>
            <div>
              <Link to="/form-tugas">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Kembali ke Daftar Form
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (error && error.message.includes('permission_denied_form_data')) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Akses Data Ditolak</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Anda tidak memiliki izin untuk mengakses data formulir ini. 
              {data?.formDef?.visibilitas_dusun === 'semua_data' 
                ? ' Anda mungkin tidak memiliki izin untuk formulir ini meskipun mode "lihat & isi semua data" aktif.' 
                : ' Formulir ini mungkin hanya menampilkan data dari dusun tertentu.'}
            </p>
            <div>
              <Link to="/form-tugas">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Kembali ke Daftar Form
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (error) return <div className="p-6 text-destructive">Error: {error.message}</div>;
  if (!data || !data.formDef) return <div className="p-6"><p>Form tidak ditemukan.</p></div>;

  const { formDef, entries, residents } = data;
  
  // Use the current view mode state (which respects user selection and defaults to form configuration)
  const actualViewMode = viewMode;
  
  // Render table view with pagination
  const renderTableView = () => {
    if (groupByHierarchy.length > 0 && groupedEntries) {
      // Show breadcrumbs for navigation
      const renderBreadcrumbs = () => {
        if (currentGroupPath.length === 0) return null;
        
        return (
          <div className="flex items-center flex-wrap gap-2 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={navigateToRoot}
              className="flex items-center h-8"
            >
              <span>Home</span>
            </Button>
            {currentGroupPath.map((group, index) => {
              const fieldId = groupByHierarchy[index];
              const field = formDef.fields.find(f => f.nama_field === fieldId);
              const fieldName = field ? field.label_field : fieldId;
              
              return (
                <div key={index} className="flex items-center">
                  <span className="mx-1 text-gray-400">›</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentGroupPath(prev => prev.slice(0, index + 1))}
                    className="flex items-center h-8"
                    disabled={index === currentGroupPath.length - 1}
                  >
                    <span>{group}</span>
                  </Button>
                </div>
              );
            })}
          </div>
        );
      };

      // If we're at a leaf level (showing entries), render the entries table
      if (!groupedEntriesForCurrentLevel) {
        // We're at the leaf level showing actual entries
        return (
          <div>
            {renderBreadcrumbs()}
            <div className="overflow-x-auto relative rounded-lg border border-gray-200">
              <Table className="min-w-full">
                <TableHeader className="bg-gray-50">
                  <TableRow className="border-b border-gray-200">
                    <TableHead className="w-12 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</TableHead>
                    {formDef.fields.map(field => (
                      <TableHead 
                        key={field.id} 
                        onClick={() => requestSort(field.nama_field)} 
                        className="cursor-pointer hover:bg-gray-100 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider transition-colors duration-150"
                      >
                        <div className="flex items-center gap-2">
                          {field.label_field}
                          {sortConfig.key === field.nama_field && (
                            <ArrowUpDown className="h-4 w-4 text-gray-700" />
                          )}
                        </div>
                      </TableHead>
                    ))}
                    <TableHead className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 z-10 border-l border-gray-200 min-w-[100px]">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-white divide-y divide-gray-200">
                  {paginatedEntries.map((entry, index) => (
                    <TableRow 
                      key={entry.id} 
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </TableCell>
                      {formDef.fields.map(field => (
                        <TableCell key={field.id} className="px-4 py-3 text-sm text-gray-900">
                          {(() => {
                            const value = getFieldValue(entry, field);
                            
                            if (field.tipe_field === 'coordinate') {
                              if (value && value !== 'Koordinat tidak valid') {
                                // Try to parse the coordinate value
                                let coords = null;
                                try {
                                  // If it's already an object format from JSON.parse
                                  if (typeof value === 'object') {
                                    coords = value;
                                  } else {
                                    // If it's in "lat, lng" format, split it
                                    const [lat, lng] = value.split(',').map(coord => parseFloat(coord.trim()));
                                    if (!isNaN(lat) && !isNaN(lng)) {
                                      coords = { lat, lng };
                                    }
                                  }
                                } catch (e) {
                                  console.error("Error parsing coordinate for link:", e);
                                }
                                
                                if (coords) {
                                  const mapUrl = `https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lng}#map=15/${coords.lat}/${coords.lng}`;
                                  return (
                                    <a 
                                      href={mapUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline flex items-center gap-1"
                                      onClick={(e) => e.stopPropagation()} // Prevent row click from firing
                                    >
                                      {value}
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-pin">
                                        <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
                                        <circle cx="12" cy="10" r="3"/>
                                      </svg>
                                    </a>
                                  );
                                }
                              }
                              return value;
                            } else if (field.tipe_field === 'image' && typeof value === 'object' && value.type === 'image' && value.url) {
                              // Handle image display in table view
                              return (
                                <a 
                                  href={value.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="block"
                                  onClick={(e) => e.stopPropagation()} // Prevent row click from firing
                                >
                                  <img 
                                    src={value.url} 
                                    alt="Gambar" 
                                    className="max-h-16 object-cover rounded border"
                                    onError={(e) => {
                                      // If the image fails to load, show an error indicator
                                      e.currentTarget.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><rect x='3' y='3' width='18' height='18' rx='2' ry='2'/><line x1='3' y1='9' x2='21' y2='9'/><line x1='9' y1='21' x2='9' y2='9'/></svg>";
                                      e.currentTarget.className = 'max-h-16 object-cover rounded border text-gray-400';
                                    }}
                                  />
                                </a>
                              );
                            }
                            
                            return <span className="text-gray-700">{value}</span>;
                          })()}
                        </TableCell>
                      ))}
                      <TableCell className="flex gap-1 justify-end px-4 py-3 whitespace-nowrap text-sm sticky right-0 bg-white z-10 border-l border-gray-200 min-w-[100px]">
                        {formDef.show_edit_button && (
                          <Button variant="outline" size="sm" onClick={() => handleEdit(entry)} className="h-8 w-8 p-0">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {formDef.show_delete_button && (
                          <Button variant="outline" size="sm" onClick={() => openDeleteDialog(entry)} className="h-8 w-8 p-0">
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
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-600">
                  Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, sortedEntries.length)} dari {sortedEntries.length} data
                </div>
                
                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={firstPage}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronsLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
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
                          className="w-8 h-8 text-xs"
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
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={lastPage}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronsRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
                
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-600">Baris per halaman:</span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value));
                      setCurrentPage(1); // Reset to first page when changing items per page
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs w-16">
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
      } else {
        // We're at an intermediate level showing groups to navigate to
        return (
          <div>
            {renderBreadcrumbs()}
            <div className="space-y-3">
              {Object.entries(groupedEntriesForCurrentLevel).map(([groupKey, subEntries]) => {
                const currentLevelIndex = currentGroupPath.length;
                const fieldId = groupByHierarchy[currentLevelIndex];
                const field = formDef.fields.find(f => f.nama_field === fieldId);
                const fieldName = field ? field.label_field : fieldId;
                
                const subEntryCount = Array.isArray(subEntries) 
                  ? subEntries.length 
                  : Object.keys(subEntries).reduce((sum, key) => sum + (Array.isArray(subEntries[key]) ? subEntries[key].length : 0), 0);
                
                return (
                  <div 
                    key={groupKey} 
                    className={`flex justify-between items-center p-3 rounded-lg border-l-4 ${
                      currentLevelIndex === 0 ? 'border-blue-500 bg-blue-50' : 
                      currentLevelIndex === 1 ? 'border-indigo-500 bg-indigo-50 ml-4' : 
                      'border-purple-500 bg-purple-50 ml-8'
                    } shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer`}
                    onClick={() => navigateToGroup(groupKey)}
                  >
                    <div className="flex items-center">
                      <div className={`w-2.5 h-2.5 rounded-full mr-2 ${
                        currentLevelIndex === 0 ? 'bg-blue-500' : 
                        currentLevelIndex === 1 ? 'bg-indigo-500' : 
                        'bg-purple-500'
                      }`}></div>
                      <div>
                        <h3 className="font-medium text-gray-800 text-sm">
                          {groupKey}
                        </h3>
                        <p className="text-xs text-gray-600">
                          {subEntryCount} item
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="flex items-center h-8">
                      <span className="text-xs mr-1">Masuk</span>
                      <svg 
                        className="h-3.5 w-3.5" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }
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
                      <TableCell key={field.id}>
                        {(() => {
                          const value = getFieldValue(entry, field);
                          
                          if (field.tipe_field === 'coordinate') {
                            if (value && value !== 'Koordinat tidak valid') {
                              // Try to parse the coordinate value
                              let coords = null;
                              try {
                                // If it's already an object format from JSON.parse
                                if (typeof value === 'object') {
                                  coords = value;
                                } else {
                                  // If it's in "lat, lng" format, split it
                                  const [lat, lng] = value.split(',').map(coord => parseFloat(coord.trim()));
                                  if (!isNaN(lat) && !isNaN(lng)) {
                                    coords = { lat, lng };
                                  }
                                }
                              } catch (e) {
                                console.error("Error parsing coordinate for link:", e);
                              }
                              
                              if (coords) {
                                const mapUrl = `https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lng}#map=15/${coords.lat}/${coords.lng}`;
                                return (
                                  <a 
                                    href={mapUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline flex items-center gap-1"
                                    onClick={(e) => e.stopPropagation()} // Prevent row click from firing
                                  >
                                    {value}
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-pin">
                                      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
                                      <circle cx="12" cy="10" r="3"/>
                                    </svg>
                                  </a>
                                );
                              }
                            }
                            return value;
                          } else if (field.tipe_field === 'image' && typeof value === 'object' && value.type === 'image' && value.url) {
                            // Handle image display in table view
                            return (
                              <a 
                                href={value.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="block"
                                onClick={(e) => e.stopPropagation()} // Prevent row click from firing
                              >
                                <img 
                                  src={value.url} 
                                  alt="Gambar" 
                                  className="max-h-16 object-cover rounded border"
                                  onError={(e) => {
                                    // If the image fails to load, show an error indicator
                                    e.currentTarget.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='18' height='18' rx='2' ry='2'/><line x1='3' y1='9' x2='21' y2='9'/><line x1='9' y1='21' x2='9' y2='9'/></svg>";
                                    e.currentTarget.className = 'max-h-16 object-cover rounded border text-gray-400';
                                  }}
                                />
                              </a>
                            );
                          }
                          
                          return value;
                        })()}
                      </TableCell>
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-xs text-gray-600">
                Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, sortedEntries.length)} dari {sortedEntries.length} data
              </div>
              
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={firstPage}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
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
                        className="w-8 h-8 text-xs"
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
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={lastPage}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsRight className="h-3.5 w-3.5" />
                </Button>
              </div>
              
              <div className="flex items-center space-x-1">
                <span className="text-xs text-gray-600">Baris per halaman:</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(Number(value));
                    setCurrentPage(1); // Reset to first page when changing items per page
                  }}
                >
                  <SelectTrigger className="h-8 text-xs w-16">
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
    if (groupByHierarchy.length > 0 && groupedEntries) {
      // Show breadcrumbs for navigation
      const renderBreadcrumbs = () => {
        if (currentGroupPath.length === 0) return null;
        
        return (
          <div className="flex items-center flex-wrap gap-2 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={navigateToRoot}
              className="flex items-center h-8"
            >
              <span>Home</span>
            </Button>
            {currentGroupPath.map((group, index) => {
              const fieldId = groupByHierarchy[index];
              const field = formDef.fields.find(f => f.nama_field === fieldId);
              const fieldName = field ? field.label_field : fieldId;
              
              return (
                <div key={index} className="flex items-center">
                  <span className="mx-1 text-gray-400">›</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentGroupPath(prev => prev.slice(0, index + 1))}
                    className="flex items-center h-8"
                    disabled={index === currentGroupPath.length - 1}
                  >
                    <span>{group}</span>
                  </Button>
                </div>
              );
            })}
          </div>
        );
      };

      // If we're at a leaf level (showing entries), render the deck entries
      if (!groupedEntriesForCurrentLevel) {
        // We're at the leaf level showing actual entries
        return (
          <div>
            {renderBreadcrumbs()}
            <div className="space-y-3">
              {paginatedEntries.map((entry, index) => {
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
                  <Card key={entry.id} className="overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex flex-col sm:flex-row">
                      {/* Left side - Header and primary info */}
                      <div className="flex-1 p-4 min-w-0">
                        {headerFieldValue && (
                          <div className="mb-3">
                            <h3 className={`font-semibold text-gray-900 ${headerField.deck_display_format === 'header' ? 'text-lg' : 'text-base'}`}>
                              {headerFieldValue}
                            </h3>
                          </div>
                        )}
                        
                        {/* Horizontal layout for deck fields - show only first 3-4 fields, with 'lainnya' indicator for additional fields */}
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {bodyFields.slice(0, 3).map(field => {
                              const value = getFieldValue(entry, field);
                              
                              let displayElement;
                              if (field.tipe_field === 'coordinate') {
                                if (value && value !== 'Koordinat tidak valid') {
                                  // Try to parse the coordinate value
                                  let coords = null;
                                  try {
                                    // If it's already an object format from JSON.parse
                                    if (typeof value === 'object') {
                                      coords = value;
                                    } else {
                                      // If it's in "lat, lng" format, split it
                                      const [lat, lng] = value.split(',').map(coord => parseFloat(coord.trim()));
                                      if (!isNaN(lat) && !isNaN(lng)) {
                                        coords = { lat, lng };
                                      }
                                    }
                                  } catch (e) {
                                    console.error("Error parsing coordinate for link:", e);
                                  }
                                  
                                  if (coords) {
                                    const mapUrl = `https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lng}#map=15/${coords.lat}/${coords.lng}`;
                                    displayElement = (
                                      <a 
                                        href={mapUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline text-xs"
                                        onClick={(e) => e.stopPropagation()} // Prevent card click from firing
                                      >
                                        {value}
                                      </a>
                                    );
                                  } else {
                                    displayElement = <span className="text-xs text-gray-700">{value}</span>;
                                  }
                                } else {
                                  displayElement = <span className="text-xs text-gray-700">{value}</span>;
                                }
                              } else if (field.tipe_field === 'image' && typeof value === 'object' && value.type === 'image' && value.url) {
                                // Handle image display in deck view
                                displayElement = (
                                  <a 
                                    href={value.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-block"
                                    onClick={(e) => e.stopPropagation()} // Prevent card click from firing
                                  >
                                    <img 
                                      src={value.url} 
                                      alt="Gambar" 
                                      className="h-10 w-10 object-cover rounded border"
                                      onError={(e) => {
                                        // If the image fails to load, show an error indicator
                                        e.currentTarget.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><rect x='3' y='3' width='18' height='18' rx='2' ry='2'/><line x1='3' y1='9' x2='21' y2='9'/><line x1='9' y1='21' x2='9' y2='9'/></svg>";
                                        e.currentTarget.className = 'h-10 w-10 object-cover rounded border text-gray-400';
                                      }}
                                    />
                                  </a>
                                );
                              } else {
                                displayElement = <span className="text-xs text-gray-700">{value}</span>;
                              }
                              
                              return (
                                <div key={field.id} className="flex flex-col">
                                  <Label className="text-xs font-medium text-muted-foreground truncate">{field.label_field}</Label>
                                  <div className="mt-1">
                                    {displayElement}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {bodyFields.length > 3 && (
                            <div className="pt-1">
                              <span className="text-xs text-gray-500">+{bodyFields.length - 3} field lainnya</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Right side - Actions */}
                      <div className="flex items-center justify-center p-4 border-t sm:border-t-0 sm:border-l border-gray-100 bg-gray-50">
                        <div className="flex gap-2">
                          {formDef.show_edit_button && (
                            <Button variant="outline" size="sm" onClick={() => handleEdit(entry)} className="h-8 w-8 p-0">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {formDef.show_delete_button && (
                            <Button variant="outline" size="sm" onClick={() => openDeleteDialog(entry)} className="h-8 w-8 p-0">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-600">
                  Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, sortedEntries.length)} dari {sortedEntries.length} data
                </div>
                
                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={firstPage}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronsLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
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
                          className="w-8 h-8 text-xs"
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
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={lastPage}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronsRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
                
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-600">Baris per halaman:</span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value));
                      setCurrentPage(1); // Reset to first page when changing items per page
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs w-16">
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
      } else {
        // We're at an intermediate level showing groups to navigate to
        return (
          <div>
            {renderBreadcrumbs()}
            <div className="space-y-3">
              {Object.entries(groupedEntriesForCurrentLevel).map(([groupKey, subEntries]) => {
                const currentLevelIndex = currentGroupPath.length;
                const fieldId = groupByHierarchy[currentLevelIndex];
                const field = formDef.fields.find(f => f.nama_field === fieldId);
                const fieldName = field ? field.label_field : fieldId;
                
                const subEntryCount = Array.isArray(subEntries) 
                  ? subEntries.length 
                  : Object.keys(subEntries).reduce((sum, key) => sum + (Array.isArray(subEntries[key]) ? subEntries[key].length : 0), 0);
                
                return (
                  <div 
                    key={groupKey} 
                    className={`flex justify-between items-center p-3 rounded-lg border-l-4 ${
                      currentLevelIndex === 0 ? 'border-blue-500 bg-blue-50' : 
                      currentLevelIndex === 1 ? 'border-indigo-500 bg-indigo-50 ml-4' : 
                      'border-purple-500 bg-purple-50 ml-8'
                    } shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer`}
                    onClick={() => navigateToGroup(groupKey)}
                  >
                    <div className="flex items-center">
                      <div className={`w-2.5 h-2.5 rounded-full mr-2 ${
                        currentLevelIndex === 0 ? 'bg-blue-500' : 
                        currentLevelIndex === 1 ? 'bg-indigo-500' : 
                        'bg-purple-500'
                      }`}></div>
                      <div>
                        <h3 className="font-medium text-gray-800 text-sm">
                          {groupKey}
                        </h3>
                        <p className="text-xs text-gray-600">
                          {subEntryCount} item
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="flex items-center h-8">
                      <span className="text-xs mr-1">Masuk</span>
                      <svg 
                        className="h-3.5 w-3.5" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      } // End of groupedEntriesForCurrentLevel condition
    } // End of grouped entries condition
    else {
      // Non-grouped deck view with pagination
      // Use deck display fields from the form fields if they exist and are visible
      // Filter out fields that have missing deck columns (to prevent errors if columns don't exist in DB yet)
      const visibleDeckFields = formDef.fields
        .filter(field => field.deck_visible)
        .sort((a, b) => (a.deck_display_order || 0) - (b.deck_display_order || 0));
      
      return (
        <div>
          <div className="space-y-3">
            {paginatedEntries.map((entry, index) => {
              // Find the header field if any
              const headerField = visibleDeckFields.find(f => f.deck_is_header);
              const headerFieldValue = headerField ? getFieldValue(entry, headerField) : null;
              
              // Get non-header fields to display in body
              const bodyFields = visibleDeckFields.filter(f => !f.deck_is_header);
              
              return (
                <Card key={entry.id} className="overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="flex flex-col sm:flex-row">
                    {/* Left side - Header and primary info */}
                    <div className="flex-1 p-4 min-w-0">
                      {headerFieldValue && (
                        <div className="mb-3">
                          <h3 className={`font-semibold text-gray-900 ${headerField.deck_display_format === 'header' ? 'text-lg' : 'text-base'}`}>
                            {headerFieldValue}
                          </h3>
                        </div>
                      )}
                      
                      {/* Horizontal layout for deck fields - show only first 3-4 fields, with 'lainnya' indicator for additional fields */}
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {bodyFields.slice(0, 3).map(field => {
                            const value = getFieldValue(entry, field);
                            
                            let displayElement;
                            if (field.tipe_field === 'coordinate') {
                              if (value && value !== 'Koordinat tidak valid') {
                                // Try to parse the coordinate value
                                let coords = null;
                                try {
                                  // If it's already an object format from JSON.parse
                                  if (typeof value === 'object') {
                                    coords = value;
                                  } else {
                                    // If it's in "lat, lng" format, split it
                                    const [lat, lng] = value.split(',').map(coord => parseFloat(coord.trim()));
                                    if (!isNaN(lat) && !isNaN(lng)) {
                                      coords = { lat, lng };
                                    }
                                  }
                                } catch (e) {
                                  console.error("Error parsing coordinate for link:", e);
                                }
                                
                                if (coords) {
                                  const mapUrl = `https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lng}#map=15/${coords.lat}/${coords.lng}`;
                                  displayElement = (
                                    <a 
                                      href={mapUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline text-xs"
                                      onClick={(e) => e.stopPropagation()} // Prevent card click from firing
                                    >
                                      {value}
                                    </a>
                                  );
                                } else {
                                  displayElement = <span className="text-xs text-gray-700">{value}</span>;
                                }
                              } else {
                                displayElement = <span className="text-xs text-gray-700">{value}</span>;
                              }
                            } else if (field.tipe_field === 'image' && typeof value === 'object' && value.type === 'image' && value.url) {
                              // Handle image display in deck view
                              displayElement = (
                                <a 
                                  href={value.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-block"
                                  onClick={(e) => e.stopPropagation()} // Prevent card click from firing
                                >
                                  <img 
                                    src={value.url} 
                                    alt="Gambar" 
                                    className="h-10 w-10 object-cover rounded border"
                                  onError={(e) => {
                                    // If the image fails to load, show an error indicator
                                    e.currentTarget.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='18' height='18' rx='2' ry='2'/><line x1='3' y1='9' x2='21' y2='9'/><line x1='9' y1='21' x2='9' y2='9'/></svg>";
                                    e.currentTarget.className = 'h-10 w-10 object-cover rounded border text-gray-400';
                                  }}
                                  ></img>
                                </a>
                              );
                            } else {
                              displayElement = <span className="text-xs text-gray-700">{value}</span>;
                            }
                            
                            return (
                              <div key={field.id} className="flex flex-col">
                                <Label className="text-xs font-medium text-muted-foreground truncate">{field.label_field}</Label>
                                <div className="mt-1">
                                  {displayElement}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {bodyFields.length > 3 && (
                          <div className="pt-1">
                            <span className="text-xs text-gray-500">+{bodyFields.length - 3} field lainnya</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Right side - Actions */}
                    <div className="flex items-center justify-center p-4 border-t sm:border-t-0 sm:border-l border-gray-100 bg-gray-50">
                      <div className="flex gap-2">
                        {formDef.show_edit_button && (
                          <Button variant="outline" size="sm" onClick={() => handleEdit(entry)} className="h-8 w-8 p-0">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {formDef.show_delete_button && (
                          <Button variant="outline" size="sm" onClick={() => openDeleteDialog(entry)} className="h-8 w-8 p-0">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
          
          {/* Pagination Controls for Deck View */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-xs text-gray-600">
                Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, sortedEntries.length)} dari {sortedEntries.length} data
              </div>
              
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={firstPage}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
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
                        className="w-8 h-8 text-xs"
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
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={lastPage}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsRight className="h-3.5 w-3.5" />
                </Button>
              </div>
              
              <div className="flex items-center space-x-1">
                <span className="text-xs text-gray-600">Baris per halaman:</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(Number(value));
                    setCurrentPage(1); // Reset to first page when changing items per page
                  }}
                >
                  <SelectTrigger className="h-8 text-xs w-16">
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
            <h1 className="text-3xl font-bold text-gradient">Data: {formDef.nama_tugas}</h1>
            <p className="text-muted-foreground mt-2">
              {formDef.deskripsi}
            </p>
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

        {/* View mode toggle - show if form has deck fields */}
        {/* Search box, field selector and advanced filter */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-1/2">
            <div className="relative w-full mb-2 md:mb-0">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                placeholder="Cari data..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
              />
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-1/2">
            <div className="w-full md:w-auto">
              {/* Field Selection Dropdown */}
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
              {/* Advanced Filter Button */}
              <Button 
                variant="outline" 
                onClick={() => setIsAdvancedFilterOpen(true)}
                className="flex items-center gap-2 relative w-full md:w-auto"
                size="sm"
              >
                <Filter className="h-4 w-4" />
                <span>Filter Lanjutan</span>
              </Button>
            </div>
          </div>
          {formDef.display_type === 'deck' && (
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

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Daftar Data Terisi</h2>
              <p className="text-sm text-gray-600 mt-1">
                Menampilkan {sortedEntries.length} dari {entries.length} data
                {groupByHierarchy.length > 0 && groupedEntries ? ` dalam ${Object.keys(groupedEntries).length} grup` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {actualViewMode === 'table' ? 'Tabel' : 'Kartu'} View
              </span>
            </div>
          </div>
          {entries.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">Belum ada data yang diisi</p>
              <p className="text-gray-500 text-sm mt-1">Data yang diisi akan muncul di sini</p>
            </div>
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
              profile={profile}
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
      
      {/* Advanced Form Filter Dialog */}
      <AdvancedFormFilter
        open={isAdvancedFilterOpen}
        onOpenChange={setIsAdvancedFilterOpen}
        onApplyFilter={handleApplyAdvancedFilter}
        filteredCount={filteredEntries.length}
        totalCount={entries.length}
        formDef={formDef}
        onDownloadFiltered={handleExportFiltered}
      />
    </>
  );
};

export default FormDataEntry;