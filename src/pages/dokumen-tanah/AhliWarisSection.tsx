import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileDropzone } from './FileDropzone';
import { AhliWarisSlot } from './types';
import { ACCEPTED_FORMATS_ALL } from './config';

const HUBUNGAN_OPTIONS = ['Anak', 'Pasangan', 'Saudara', 'Lainnya'];

interface AhliWarisSectionProps {
  slots: AhliWarisSlot[];
  onChange: (slots: AhliWarisSlot[]) => void;
  onAddFiles: (slotId: string, files: File[]) => void;
  onRemoveFile: (slotId: string, fileId: string) => void;
}

const AhliWarisSection: React.FC<AhliWarisSectionProps> = ({ slots, onChange, onAddFiles, onRemoveFile }) => {
  const updateSlot = (id: string, patch: Partial<AhliWarisSlot>) => {
    onChange(slots.map(s => s.id === id ? { ...s, ...patch } : s));
  };

  const addSlot = () => {
    onChange([...slots, { id: crypto.randomUUID(), nama: '', hubungan: '', files: [] }]);
  };

  const removeSlot = (id: string) => {
    if (slots.length <= 1) return;
    onChange(slots.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-3">
      {slots.map((slot, i) => (
        <div key={slot.id} className="border rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium min-w-[24px]">#{i + 1}</span>
            <Input
              placeholder="Nama Ahli Waris"
              value={slot.nama}
              onChange={e => updateSlot(slot.id, { nama: e.target.value })}
              className="flex-1"
            />
            <Select value={slot.hubungan} onValueChange={v => updateSlot(slot.id, { hubungan: v })}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Hubungan" />
              </SelectTrigger>
              <SelectContent>
                {HUBUNGAN_OPTIONS.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
              </SelectContent>
            </Select>
            {slots.length > 1 && (
              <Button variant="ghost" size="icon" onClick={() => removeSlot(slot.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
          <FileDropzone
            files={slot.files}
            onAdd={f => onAddFiles(slot.id, f)}
            onRemove={fid => onRemoveFile(slot.id, fid)}
            accept={ACCEPTED_FORMATS_ALL}
            label="Upload KTP Ahli Waris"
          />
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addSlot}>
        <Plus className="h-4 w-4 mr-1" /> Tambah Ahli Waris
      </Button>
    </div>
  );
};

export default AhliWarisSection;
