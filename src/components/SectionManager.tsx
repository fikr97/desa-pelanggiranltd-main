import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, ArrowUp, ArrowDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';

interface Section {
  id: string;
  nama_section: string;
  deskripsi_section?: string;
  urutan: number;
}

interface SectionManagerProps {
  sections: Section[];
  onSectionsChange: (sections: Section[]) => void;
  fields: any[]; // Fields from form
  onFieldsChange: (fields: any[]) => void; // To update section_id in fields
}

const SectionManager: React.FC<SectionManagerProps> = ({ 
  sections, 
  onSectionsChange, 
  fields,
  onFieldsChange 
}) => {
  const [isAddSectionDialogOpen, setIsAddSectionDialogOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionDescription, setNewSectionDescription] = useState('');

  const addSection = () => {
    if (!newSectionName.trim()) return;
    
    const newSection: Section = {
      id: `temp-${Date.now()}`, // Temporary ID until saved to DB
      nama_section: newSectionName,
      deskripsi_section: newSectionDescription,
      urutan: sections.length,
    };
    
    onSectionsChange([...sections, newSection]);
    setNewSectionName('');
    setNewSectionDescription('');
    setIsAddSectionDialogOpen(false);
  };

  const removeSection = (index: number) => {
    const sectionToRemove = sections[index];
    const updatedSections = [...sections];
    updatedSections.splice(index, 1);
    
    // Update sections list
    onSectionsChange(updatedSections);
    
    // Also update fields that were in this section to have no section
    const updatedFields = fields.map(field => 
      field.section_id === sectionToRemove.id 
        ? { ...field, section_id: null } 
        : field
    );
    
    onFieldsChange(updatedFields);
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...sections];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= newSections.length) return;
    
    const [movedSection] = newSections.splice(index, 1);
    newSections.splice(newIndex, 0, movedSection);
    
    // Update order (urutan) values
    const reorderedSections = newSections.map((section, i) => ({
      ...section,
      urutan: i
    }));
    
    onSectionsChange(reorderedSections);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Manajemen Section</CardTitle>
        <Dialog open={isAddSectionDialogOpen} onOpenChange={setIsAddSectionDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Section
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Section Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="section-name">Nama Section</Label>
                <Input
                  id="section-name"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  placeholder="Contoh: Informasi Pribadi"
                />
              </div>
              <div>
                <Label htmlFor="section-description">Deskripsi (opsional)</Label>
                <Input
                  id="section-description"
                  value={newSectionDescription}
                  onChange={(e) => setNewSectionDescription(e.target.value)}
                  placeholder="Penjelasan tentang section ini"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddSectionDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={addSection}>Tambah Section</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {sections.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Belum ada section yang ditambahkan. Tambahkan section untuk mengorganisir field-field.
          </p>
        ) : (
          <div className="space-y-4">
            {sections.map((section, index) => (
              <div 
                key={section.id} 
                className="flex items-center justify-between p-4 border rounded-lg bg-muted"
              >
                <div className="flex-1">
                  <h3 className="font-medium">{section.nama_section}</h3>
                  {section.deskripsi_section && (
                    <p className="text-sm text-muted-foreground mt-1">{section.deskripsi_section}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">Urutan: {section.urutan + 1}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => moveSection(index, 'up')} 
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => moveSection(index, 'down')} 
                    disabled={index === sections.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="destructive" 
                    onClick={() => removeSection(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SectionManager;