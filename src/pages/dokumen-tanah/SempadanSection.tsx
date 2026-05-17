import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileDropzone } from './FileDropzone';
import { SempadanSlot, UploadedFile } from './types';
import { ACCEPTED_FORMATS_ALL } from './config';

const ARAH_OPTIONS = ['Utara', 'Selatan', 'Timur', 'Barat', 'Lainnya'];

interface SempadanSectionProps {
  slots: SempadanSlot[];
  onChange: (slots: SempadanSlot[]) => void;
  onAddFiles: (slotId: string, files: File[]) => void;
  onRemoveFile: (slotId: string, fileId: string) => void;
}

const SempadanSection: React.FC<SempadanSectionProps> = ({ slots, onChange, onAddFiles, onRemoveFile }) => {
  const updateSlot = (id: string, patch: Partial<SempadanSlot>) => {
    onChange(slots.map(s => s.id === id ? { ...s, ...patch } : s));
  };

  const addSlot = () => {
    onChange([...slots, { id: crypto.randomUUID(), nama: '', arah: '', isFasilitasUmum: false, files: [] }]);
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
              placeholder="Nama Sempadan"
              value={slot.nama}
              onChange={e => updateSlot(slot.id, { nama: e.target.value })}
              className="flex-1"
            />
            <Select value={slot.arah} onValueChange={v => updateSlot(slot.id, { arah: v })}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Arah" />
              </SelectTrigger>
              <SelectContent>
                {ARAH_OPTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
            {slots.length > 1 && (
              <Button variant="ghost" size="icon" onClick={() => removeSlot(slot.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id={`fasum-${slot.id}`}
              checked={slot.isFasilitasUmum}
              onCheckedChange={v => updateSlot(slot.id, { isFasilitasUmum: !!v })}
            />
            <label htmlFor={`fasum-${slot.id}`} className="text-sm">Fasilitas Umum (tidak perlu KTP)</label>
          </div>
          {!slot.isFasilitasUmum && (
            <FileDropzone
              files={slot.files}
              onAdd={f => onAddFiles(slot.id, f)}
              onRemove={fid => onRemoveFile(slot.id, fid)}
              accept={ACCEPTED_FORMATS_ALL}
              label="Upload KTP Sempadan"
            />
          )}
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addSlot}>
        <Plus className="h-4 w-4 mr-1" /> Tambah Sempadan
      </Button>
    </div>
  );
};

export default SempadanSection;
