import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { FileDropzone } from './FileDropzone';
import { SerikatMember, JenisSurat } from './types';
import { ACCEPTED_FORMATS_ALL, KTP_PENJUAL_LABEL, KTP_PEMBELI_LABEL } from './config';

interface SerikatSectionProps {
  jenisSurat: JenisSurat;
  isSerikat: boolean;
  onToggle: (v: boolean) => void;
  keterangan: string;
  onKeteranganChange: (v: string) => void;
  serikatPenjual: SerikatMember[];
  serikatPembeli: SerikatMember[];
  onChangePenjual: (m: SerikatMember[]) => void;
  onChangePembeli: (m: SerikatMember[]) => void;
  onAddFilesPenjual: (memberId: string, files: File[]) => void;
  onRemoveFilePenjual: (memberId: string, fileId: string) => void;
  onAddFilesPembeli: (memberId: string, files: File[]) => void;
  onRemoveFilePembeli: (memberId: string, fileId: string) => void;
}

const MemberList: React.FC<{
  members: SerikatMember[];
  onChange: (m: SerikatMember[]) => void;
  onAddFiles: (id: string, f: File[]) => void;
  onRemoveFile: (id: string, fid: string) => void;
  label: string;
  showUpload: boolean;
}> = ({ members, onChange, onAddFiles, onRemoveFile, label, showUpload }) => {
  const add = () => onChange([...members, { id: crypto.randomUUID(), nama: '', files: [] }]);
  const remove = (id: string) => { if (members.length > 1) onChange(members.filter(m => m.id !== id)); };
  const update = (id: string, nama: string) => onChange(members.map(m => m.id === id ? { ...m, nama } : m));

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      {members.map((m, i) => (
        <div key={m.id} className="border rounded-lg p-2 space-y-2">
          <div className="flex items-center gap-2">
            <Input placeholder={`Nama anggota #${i + 1}`} value={m.nama} onChange={e => update(m.id, e.target.value)} className="flex-1" />
            {members.length > 1 && (
              <Button variant="ghost" size="icon" onClick={() => remove(m.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
          {showUpload && (
            <FileDropzone files={m.files} onAdd={f => onAddFiles(m.id, f)} onRemove={fid => onRemoveFile(m.id, fid)} accept={ACCEPTED_FORMATS_ALL} />
          )}
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add}>
        <Plus className="h-4 w-4 mr-1" /> Tambah Anggota Serikat
      </Button>
    </div>
  );
};

const SerikatSection: React.FC<SerikatSectionProps> = ({
  jenisSurat, isSerikat, onToggle, keterangan, onKeteranganChange,
  serikatPenjual, serikatPembeli, onChangePenjual, onChangePembeli,
  onAddFilesPenjual, onRemoveFilePenjual, onAddFilesPembeli, onRemoveFilePembeli,
}) => {
  const showUpload = jenisSurat !== 'SKT';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Switch id="serikat-toggle" checked={isSerikat} onCheckedChange={onToggle} />
        <Label htmlFor="serikat-toggle" className="font-medium">Transaksi Serikat</Label>
      </div>
      {isSerikat && (
        <div className="space-y-4 pl-2 border-l-2 border-primary/20">
          <Input placeholder="Nama/Keterangan Kelompok Serikat" value={keterangan} onChange={e => onKeteranganChange(e.target.value)} />
          {showUpload && (
            <>
              <MemberList
                members={serikatPenjual} onChange={onChangePenjual}
                onAddFiles={onAddFilesPenjual} onRemoveFile={onRemoveFilePenjual}
                label={`Anggota Serikat - ${KTP_PENJUAL_LABEL[jenisSurat]}`} showUpload
              />
              <MemberList
                members={serikatPembeli} onChange={onChangePembeli}
                onAddFiles={onAddFilesPembeli} onRemoveFile={onRemoveFilePembeli}
                label={`Anggota Serikat - ${KTP_PEMBELI_LABEL[jenisSurat]}`} showUpload
              />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SerikatSection;
