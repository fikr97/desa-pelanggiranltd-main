import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Section {
  id: string;
  nama_section: string;
  deskripsi_section?: string;
  urutan: number;
}

interface Field {
  id?: string;
  nama_field: string;
  label_field: string;
  section_id?: string | null;
  // other field properties...
}

interface SectionFieldManagerProps {
  fields: Field[];
  sections: Section[];
  onFieldsChange: (fields: Field[]) => void;
}

const SectionFieldManager: React.FC<SectionFieldManagerProps> = ({ 
  fields, 
  sections, 
  onFieldsChange 
}) => {
  const handleSectionChange = (index: number, sectionId: string | null) => {
    const updatedFields = [...fields];
    updatedFields[index] = { ...updatedFields[index], section_id: sectionId };
    onFieldsChange(updatedFields);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tata Letak Field dalam Section</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Pilih section untuk setiap field. Field yang tidak dipilih section akan muncul di awal form.
        </p>
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={`${field.id || field.nama_field}-${index}`} className="flex items-center gap-4 p-3 border rounded">
              <div className="flex-1">
                <Label className="text-sm font-medium">{field.label_field}</Label>
                <p className="text-xs text-muted-foreground">{field.nama_field}</p>
              </div>
              <div className="w-64">
                <Select
                  value={field.section_id || 'no-section'}
                  onValueChange={(value) => 
                    handleSectionChange(index, value === 'no-section' ? null : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih section..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-section">Tidak ada section (di awal form)</SelectItem>
                    {sections.map((section) => (
                      <SelectItem key={section.id} value={section.id}>
                        {section.nama_section}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SectionFieldManager;