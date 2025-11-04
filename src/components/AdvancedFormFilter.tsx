import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Filter, X, Download, Search } from 'lucide-react';
import MultiSelectFilter from '@/components/ui/multi-select';

interface FilterValue {
  type: 'string' | 'number' | 'date' | 'boolean' | 'dropdown';
  value: string | string[] | number | boolean | null;
}

interface FilterValues {
  [key: string]: FilterValue;
}

interface AdvancedFormFilterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyFilter: (filters: FilterValues) => void;
  onDownloadFiltered: () => void;
  initialFilters?: FilterValues;
  filteredCount: number;
  totalCount: number;
  formDef: any; // Form definition from FormDataEntry
}

const AdvancedFormFilter = ({ 
  open, 
  onOpenChange, 
  onApplyFilter, 
  onDownloadFiltered, 
  initialFilters = {}, 
  filteredCount, 
  totalCount,
  formDef 
}: AdvancedFormFilterProps) => {
  const [filters, setFilters] = useState<FilterValues>(initialFilters);

  // Get unique values for dropdown fields from form data
  const getUniqueFieldValues = (fieldName: string) => {
    if (!formDef?.entries || !Array.isArray(formDef.entries)) return [];
    
    const uniqueValues = new Set();
    
    formDef.entries.forEach(entry => {
      // Look for the value in the data_custom object first
      const customValue = entry.data_custom?.[fieldName];
      const pendudukValue = entry.penduduk?.[fieldName];
      const value = customValue !== undefined && customValue !== null && customValue !== '' 
        ? customValue 
        : (pendudukValue !== undefined && pendudukValue !== null ? pendudukValue : 'N/A');
        
      if (value && value !== 'N/A') {
        uniqueValues.add(String(value));
      }
    });
    
    return Array.from(uniqueValues).sort();
  };

  const handleStringFilterChange = (fieldName: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [fieldName]: {
        type: 'string',
        value: value || null
      }
    }));
  };

  const handleNumberFilterChange = (fieldName: string, value: string) => {
    const numValue = value ? Number(value) : null;
    setFilters(prev => (!numValue && numValue !== 0) 
      ? { ...prev, [fieldName]: undefined } 
      : {
          ...prev,
          [fieldName]: {
            type: 'number',
            value: numValue
          }
        }
    );
  };

  const handleDateFilterChange = (fieldName: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [fieldName]: {
        type: 'date',
        value: value || null
      }
    }));
  };

  const handleBooleanFilterChange = (fieldName: string, value: boolean) => {
    setFilters(prev => ({
      ...prev,
      [fieldName]: {
        type: 'boolean',
        value: value
      }
    }));
  };

  const handleMultiFilterChange = (fieldName: string, value: string[]) => {
    setFilters(prev => ({
      ...prev,
      [fieldName]: {
        type: 'dropdown',
        value: value.length > 0 ? value : null
      }
    }));
  };

  const handleApply = () => {
    onApplyFilter(filters);
    onOpenChange(false);
  };

  const handleReset = () => {
    setFilters({});
    onApplyFilter({});
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    Object.entries(filters).forEach(([_, filterValue]) => {
      if (filterValue && filterValue.value) {
        if (Array.isArray(filterValue.value)) {
          count += filterValue.value.length;
        } else {
          count += 1;
        }
      }
    });
    return count;
  };

  const getFilterSummary = () => {
    const activeFilters = Object.entries(filters)
      .filter(([_, filterValue]) => filterValue && filterValue.value)
      .map(([fieldName, filterValue]) => {
        const field = formDef?.fields?.find((f: any) => f.nama_field === fieldName);
        const label = field?.label_field || fieldName;
        
        if (Array.isArray(filterValue.value)) {
          return filterValue.value.map(v => `${label}: ${v}`);
        } else {
          return [`${label}: ${filterValue.value}`];
        }
      })
      .flat();
    return activeFilters;
  };

  // Filter form fields by their type for appropriate UI components
  const stringFields = formDef?.fields?.filter((field: any) => 
    ['text', 'textarea', 'email', 'phone', 'custom'].includes(field.tipe_field)
  ) || [];

  const numberFields = formDef?.fields?.filter((field: any) => 
    ['number', 'custom'].includes(field.tipe_field)
  ) || [];

  const dateFields = formDef?.fields?.filter((field: any) => 
    field.tipe_field === 'date'
  ) || [];

  const dropdownFields = formDef?.fields?.filter((field: any) => 
    ['dropdown', 'predefined', 'custom'].includes(field.tipe_field)
  ) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Lanjutan Data Form
          </DialogTitle>
          
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Total Data: <strong>{totalCount}</strong></span>
              <span>Hasil Filter: <strong>{filteredCount}</strong></span>
              {getActiveFiltersCount() > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {getActiveFiltersCount()} Filter Aktif
                </Badge>
              )}
            </div>
            
            {getFilterSummary().length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium">Filter Aktif:</span>
                <div className="flex flex-wrap gap-2">
                  {getFilterSummary().map((filter, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {filter}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogHeader>

        <Separator />
        
        <div className="space-y-6">
          {/* String/Text Fields */}
          {stringFields.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground">Filter Teks</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stringFields.map((field: any) => {
                  const currentValue = filters[field.nama_field]?.value || '';
                  return (
                    <div key={field.nama_field} className="space-y-2">
                      <Label>{field.label_field}</Label>
                      <Input
                        placeholder={`Cari ${field.label_field}...`}
                        value={currentValue as string || ''}
                        onChange={(e) => handleStringFilterChange(field.nama_field, e.target.value)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Number Fields */}
          {numberFields.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground">Filter Angka</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {numberFields.map((field: any) => {
                  const currentValue = filters[field.nama_field]?.value || '';
                  return (
                    <div key={field.nama_field} className="space-y-2">
                      <Label>{field.label_field}</Label>
                      <Input
                        type="number"
                        placeholder={`Masukkan ${field.label_field}...`}
                        value={currentValue as string || ''}
                        onChange={(e) => handleNumberFilterChange(field.nama_field, e.target.value)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Date Fields */}
          {dateFields.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground">Filter Tanggal</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dateFields.map((field: any) => {
                  const currentValue = filters[field.nama_field]?.value || '';
                  return (
                    <div key={field.nama_field} className="space-y-2">
                      <Label>{field.label_field}</Label>
                      <Input
                        type="date"
                        value={currentValue as string || ''}
                        onChange={(e) => handleDateFilterChange(field.nama_field, e.target.value)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dropdown/Select Fields */}
          {dropdownFields.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground">Filter Pilihan</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dropdownFields.map((field: any) => {
                  const uniqueValues = getUniqueFieldValues(field.nama_field);
                  const currentValue = filters[field.nama_field]?.value as string[] || [];
                  
                  return (
                    <div key={field.nama_field} className="space-y-2">
                      <Label>{field.label_field}</Label>
                      <MultiSelectFilter
                        options={uniqueValues}
                        value={currentValue}
                        onChange={(value) => handleMultiFilterChange(field.nama_field, value)}
                        label={field.label_field}
                        placeholder={`Pilih ${field.label_field}...`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <Separator />

        <div className="flex flex-col sm:flex-row gap-2 pt-4">
          <Button variant="outline" onClick={handleReset} className="flex items-center gap-2">
            <X className="h-4 w-4" />
            Reset Filter
          </Button>
          <Button 
            variant="outline" 
            onClick={onDownloadFiltered}
            className="flex items-center gap-2"
            disabled={filteredCount === 0}
          >
            <Download className="h-4 w-4" />
            Download ({filteredCount} data)
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Batal
          </Button>
          <Button onClick={handleApply} className="flex-1">
            <Search className="h-4 w-4 mr-2" />
            Terapkan Filter
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdvancedFormFilter;