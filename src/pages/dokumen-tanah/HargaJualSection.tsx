import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileDropzone } from './FileDropzone';
import { HargaJualData } from './types';
import { ACCEPTED_FORMATS_ALL } from './config';

interface HargaJualSectionProps {
  data: HargaJualData;
  onChange: (data: HargaJualData) => void;
  onAddFiles: (files: File[]) => void;
  onRemoveFile: (fileId: string) => void;
}

function formatRupiah(value: string): string {
  const num = value.replace(/\D/g, '');
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

const HargaJualSection: React.FC<HargaJualSectionProps> = ({ data, onChange, onAddFiles, onRemoveFile }) => {
  return (
    <div className="space-y-3">
      <div>
        <Label>Harga Jual (Rp)</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rp</span>
          <Input
            className="pl-10"
            value={data.harga}
            onChange={e => onChange({ ...data, harga: formatRupiah(e.target.value) })}
            placeholder="0"
          />
        </div>
      </div>
      <div>
        <Label>Keterangan Harga (opsional)</Label>
        <Input
          value={data.keterangan}
          onChange={e => onChange({ ...data, keterangan: e.target.value })}
          placeholder="Contoh: sesuai NJOP, kesepakatan bersama"
        />
      </div>
      <FileDropzone
        files={data.buktiFiles}
        onAdd={onAddFiles}
        onRemove={onRemoveFile}
        accept={ACCEPTED_FORMATS_ALL}
        multiple
        label="Bukti Kesepakatan Harga (opsional)"
      />
    </div>
  );
};

export default HargaJualSection;
