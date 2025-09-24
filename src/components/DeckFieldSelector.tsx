import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DeckFieldSelectorProps {
  fields: any[];
  onFieldsUpdate: (fields: any[]) => void;
}

const DeckFieldSelector: React.FC<DeckFieldSelectorProps> = ({ 
  fields, 
  onFieldsUpdate 
}) => {
  // Local state to manage settings for each field
  const [fieldSettings, setFieldSettings] = useState<Record<string, any>>({});
  
  const handleFieldToggle = (fieldId: string, checked: boolean) => {
    const updatedFields = fields.map(field => {
      if (field.id === fieldId) {
        // Calculate new order based on currently visible fields
        const visibleCount = fields.filter(f => f.deck_visible !== undefined ? f.deck_visible : false && f.id !== fieldId).length;
        const newOrder = checked ? visibleCount + 1 : (field.deck_display_order !== undefined ? field.deck_display_order : 0);
        
        return {
          ...field,
          deck_visible: checked,
          deck_display_order: newOrder,
          deck_display_format: field.deck_display_format !== undefined ? field.deck_display_format : 'default',
          deck_is_header: field.deck_is_header !== undefined ? field.deck_is_header : false
        };
      }
      return field;
    });
    
    onFieldsUpdate(updatedFields);
  };

  const handleFieldSettingsChange = (fieldId: string, setting: string, value: any) => {
    const updatedFields = fields.map(field => {
      if (field.id === fieldId) {
        const updatedField = { 
          ...field, 
          [setting]: value 
        };
        
        // If we're changing the header status, make sure only one field is header
        if (setting === 'deck_is_header' && value) {
          // Reset all other fields' header status
          return {
            ...updatedField,
            deck_is_header: true
          };
        }
        
        return updatedField;
      }
      
      // If the changed field is set as header, unset any other header fields
      if (setting === 'deck_is_header' && value && field.id !== fieldId) {
        return { 
          ...field, 
          deck_is_header: false 
        };
      }
      
      return field;
    });
    
    onFieldsUpdate(updatedFields);
  };

  // Get only visible deck fields and sort them by display order
  // Filter out fields that have missing deck columns to prevent errors
  const visibleDeckFields = fields
    .filter(field => field.deck_visible !== undefined ? field.deck_visible : false)
    .sort((a, b) => (a.deck_display_order || 0) - (b.deck_display_order || 0));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pengaturan Tampilan Kartu</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Pilih field-field yang ingin ditampilkan dalam tampilan kartu dan atur tampilannya
        </p>
        
        {fields.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada field yang dibuat</p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-3">
              {fields.map(field => {
                const isAdded = field.deck_visible !== undefined ? field.deck_visible : false;
                
                return (
                  <div key={field.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <Label className="font-semibold">{field.label_field}</Label>
                        <p className="text-xs text-muted-foreground">{field.nama_field}</p>
                      </div>
                      <Switch
                        checked={isAdded}
                        onCheckedChange={(checked) => handleFieldToggle(field.id, checked)}
                      />
                    </div>
                    
                    {isAdded && (
                      <div className="pl-4 space-y-3 border-l-2 border-border">
                        <div className="flex items-center gap-3">
                          <Label className="text-sm">Format Tampilan:</Label>
                          <Select 
                            value={field.deck_display_format !== undefined ? field.deck_display_format : 'default'} 
                            onValueChange={(value) => handleFieldSettingsChange(field.id, 'deck_display_format', value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="default">Default</SelectItem>
                              <SelectItem value="header">Header/Kepala Kartu</SelectItem>
                              <SelectItem value="full-width">Full Width</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {(field.deck_display_format === 'header' || field.deck_is_header) && (
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={field.deck_is_header !== undefined ? field.deck_is_header : false}
                              onCheckedChange={(checked) => handleFieldSettingsChange(field.id, 'deck_is_header', checked)}
                            />
                            <Label className="text-sm">Gunakan sebagai judul kartu</Label>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-3">
                          <Label className="text-sm">Urutan:</Label>
                          <input
                            type="number"
                            min="1"
                            max={fields.filter(f => f.deck_visible !== undefined ? f.deck_visible : false).length}
                            value={field.deck_display_order !== undefined ? field.deck_display_order : 1}
                            onChange={(e) => handleFieldSettingsChange(field.id, 'deck_display_order', parseInt(e.target.value) || 1)}
                            className="border rounded px-2 py-1 w-20"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {visibleDeckFields.length > 0 && (
              <div className="mt-6">
                <Label className="font-semibold">Pratinjau Urutan Tampilan:</Label>
                <div className="mt-2 space-y-2">
                  {visibleDeckFields.map((field, index) => (
                    <div key={field.id} className="flex items-center text-sm p-2 bg-muted rounded">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs mr-2">
                        {index + 1}
                      </span>
                      <span>{field.label_field}</span>
                      {field.deck_is_header && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">Header</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DeckFieldSelector;