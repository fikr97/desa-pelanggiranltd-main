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
    // First, find the field definition
    const field = formDef?.fields?.find((f: any) => f.nama_field === fieldName);
    
    // For custom fields that have predefined options (like dropdown, radio, checkbox), 
    // return the available options from the field definition
    if (field && ['dropdown', 'select', 'radio', 'checkbox'].includes(field.tipe_field) && field.opsi_pilihan && Array.isArray(field.opsi_pilihan)) {
      // Return the options from the field definition
      return field.opsi_pilihan.map((opt: any) => {
        // If options are objects with value/label format
        if (opt && typeof opt === 'object' && opt.value !== undefined) {
          return opt.value;
        }
        // If options are simple values
        return String(opt);
      }).sort();
    }
    
    // For other fields or if no predefined options, get values from actual entries
    if (!formDef?.entries || !Array.isArray(formDef.entries)) return [];
    
    const uniqueValues = new Set();
    
    formDef.entries.forEach(entry => {
      let value;
      
      // First check if it's a predefined field (uses penduduk data)
      if (field && field.tipe_field === 'predefined') {
        value = entry.penduduk?.[fieldName];
      } else {
        // For custom fields, check data_custom
        value = entry.data_custom?.[fieldName];
      }
      
      // If we still don't have a value in data_custom, check if it's in penduduk data
      if (value === undefined || value === null || value === '') {
        value = entry.penduduk?.[fieldName];
      }
      
      if (value !== undefined && value !== null && value !== 'N/A' && value !== '') {
        uniqueValues.add(String(value));
      }
    });
    
    return Array.from(uniqueValues).sort();
  };

  const handleStringFilterChange = (fieldName: string, value: string) => {
    setFilters(prev => (value || value === '') // Accept empty string as valid value
      ? {
          ...prev,
          [fieldName]: {
            type: 'string',
            value: value || null
          }
        }
      : { 
          ...prev, 
          [fieldName]: undefined // Remove the filter if empty
        }
    );
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

  // No more field type classifications - we'll handle all fields in one place

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
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Filter Field</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {formDef?.fields && formDef.fields.map((field: any) => {
                // Determine if this field has options (dropdown, select, radio, checkbox)
                const isOptionField = ['dropdown', 'select', 'predefined', 'radio', 'checkbox'].includes(field.tipe_field);
                
                if (isOptionField) {
                  // For option fields, get unique values
                  const uniqueValues = getUniqueFieldValues(field.nama_field);
                  if (uniqueValues.length === 0) return null; // Skip if no values available
                  
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
                } else {
                  // For non-option fields, use text input
                  const currentValue = filters[field.nama_field]?.value as string || '';
                  return (
                    <div key={field.nama_field} className="space-y-2">
                      <Label>{field.label_field}</Label>
                      <Input
                        placeholder={`Cari ${field.label_field}...`}
                        value={currentValue || ''}
                        onChange={(e) => handleStringFilterChange(field.nama_field, e.target.value)}
                      />
                    </div>
                  );
                }
              })}
            </div>
          </div>
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