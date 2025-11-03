import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Plus, GripVertical, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

interface NestedGroupSelectorProps {
  fields: any[]; // Form fields to choose from
  groupByHierarchy: string[]; // Current selected grouped fields
  onChange: (newHierarchy: string[]) => void;
}

const NestedGroupSelector: React.FC<NestedGroupSelectorProps> = ({ 
  fields, 
  groupByHierarchy,
  onChange 
}) => {
  // Get fields that are not yet in the hierarchy
  const unusedFields = fields.filter(field => 
    !groupByHierarchy.includes(field.nama_field)
  );

  const handleAddField = (fieldName: string) => {
    onChange([...groupByHierarchy, fieldName]);
  };

  const handleRemoveField = (index: number) => {
    const newHierarchy = [...groupByHierarchy];
    newHierarchy.splice(index, 1);
    onChange(newHierarchy);
  };

  const moveField = (fromIndex: number, toIndex: number) => {
    if (fromIndex < 0 || fromIndex >= groupByHierarchy.length || 
        toIndex < 0 || toIndex >= groupByHierarchy.length) {
      return;
    }
    
    const newHierarchy = [...groupByHierarchy];
    const [movedItem] = newHierarchy.splice(fromIndex, 1);
    newHierarchy.splice(toIndex, 0, movedItem);
    onChange(newHierarchy);
  };

  const moveUp = (index: number) => {
    if (index > 0) {
      moveField(index, index - 1);
    }
  };

  const moveDown = (index: number) => {
    if (index < groupByHierarchy.length - 1) {
      moveField(index, index + 1);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Grup Bertingkat</CardTitle>
        <p className="text-sm text-muted-foreground">
          Atur pengelompokan data berdasarkan beberapa field secara hierarkis
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Add field selector */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Select 
              onValueChange={handleAddField}
              value=""
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih field untuk ditambahkan ke grup..." />
              </SelectTrigger>
              <SelectContent>
                {unusedFields.map(field => (
                  <SelectItem key={field.id} value={field.nama_field}>
                    {field.label_field}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Current grouping hierarchy */}
          {groupByHierarchy.length > 0 ? (
            <div className="space-y-2">
              <Label>Hierarki Grup Saat Ini:</Label>
              <div className="space-y-2">
                {groupByHierarchy.map((fieldId, index) => {
                  const field = fields.find(f => f.nama_field === fieldId);
                  return (
                    <div 
                      key={`${fieldId}-${index}`} 
                      className="flex items-center gap-2 p-2 border rounded-md bg-accent"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <span className="font-medium">{index + 1}. {field?.label_field || fieldId}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveUp(index)}
                          disabled={index === 0}
                          aria-label="Pindahkan ke atas"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveDown(index)}
                          disabled={index === groupByHierarchy.length - 1}
                          aria-label="Pindahkan ke bawah"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveField(index)}
                          aria-label="Hapus field"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              Belum ada field yang ditambahkan ke grup bertingkat
            </div>
          )}

          {groupByHierarchy.length > 0 && (
            <div className="text-sm text-muted-foreground mt-2">
              <p>Urutan field menentukan hierarki pengelompokan:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                {groupByHierarchy.map((fieldId, index) => {
                  const field = fields.find(f => f.nama_field === fieldId);
                  return (
                    <li key={`hierarchy-${index}`} className="text-sm">
                      Grup tingkat {index + 1}: {field?.label_field || fieldId}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NestedGroupSelector;