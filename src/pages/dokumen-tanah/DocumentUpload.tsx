import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, AlertCircle, Circle, Save, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

import { FileDropzone, validateFile } from './FileDropzone';
import SempadanSection from './SempadanSection';
import AhliWarisSection from './AhliWarisSection';
import SerikatSection from './SerikatSection';
import HargaJualSection from './HargaJualSection';
import StatusWorkflow from './StatusWorkflow';
import {
  DocumentState, JenisSurat, UploadedFile, SempadanSlot, AhliWarisSlot, SerikatMember, HargaJualData,
} from './types';
import {
  JENIS_SURAT_LABELS, ACCEPTED_FORMATS_ALL, ACCEPTED_FORMATS_IMAGE,
  KTP_PENJUAL_LABEL, KTP_PEMBELI_LABEL, isVisible, isRequired,
} from './config';
import { createPengajuan, updatePengajuan, uploadDokumenFile } from './supabase-service';

function createFile(file: File, accept: string): UploadedFile {
  const error = validateFile(file, accept);
  return {
    id: crypto.randomUUID(),
    file,
    name: file.name,
    size: file.size,
    type: file.type,
    preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    progress: error ? 0 : 100,
    error: error || undefined,
  };
}

const DEFAULT_SEMPADAN: SempadanSlot[] = ['Utara', 'Selatan', 'Timur', 'Barat'].map(arah => ({
  id: crypto.randomUUID(), nama: '', arah, isFasilitasUmum: false, files: [],
}));

function initialState(jenis: JenisSurat): DocumentState {
  return {
    jenisSurat: jenis,
    alasDasar: [],
    ktpPenjual: [],
    ktpPembeli: [],
    sempadan: DEFAULT_SEMPADAN.map(s => ({ ...s, id: crypto.randomUUID() })),
    ktpAhliWaris: [{ id: crypto.randomUUID(), nama: '', hubungan: '', files: [] }],
    suratKematian: [],
    fotoDokumentasi: [],
    sketGambar: [],
    titikKoordinat: [],
    hargaJual: { harga: '', keterangan: '', buktiFiles: [] },
    isSerikat: false,
    serikatKeterangan: '',
    serikatPenjual: [{ id: crypto.randomUUID(), nama: '', files: [] }],
    serikatPembeli: [{ id: crypto.randomUUID(), nama: '', files: [] }],
    dokumenLainnya: [],
  };
}

type SectionStatus = 'empty' | 'filled' | 'error';

const StatusIcon: React.FC<{ status: SectionStatus }> = ({ status }) => {
  if (status === 'filled') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  if (status === 'error') return <AlertCircle className="h-4 w-4 text-destructive" />;
  return <Circle className="h-4 w-4 text-muted-foreground" />;
};

const DocumentUpload: React.FC = () => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [state, setState] = useState<DocumentState>(initialState('GR'));
  const [saving, setSaving] = useState(false);
  const [pengajuanId, setPengajuanId] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string>('draft');
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const jenis = state.jenisSurat;
  const changeJenis = (v: JenisSurat) => { setState(initialState(v)); setPengajuanId(null); setCurrentStatus('draft'); };

  // Generic file adder
  const addFiles = (field: keyof DocumentState, accept: string, multiple: boolean) => (files: File[]) => {
    const newFiles = (multiple ? files : files.slice(0, 1)).map(f => createFile(f, accept));
    setState(prev => ({ ...prev, [field]: multiple ? [...(prev[field] as UploadedFile[]), ...newFiles] : newFiles }));
  };
  const removeFile = (field: keyof DocumentState) => (id: string) => {
    setState(prev => ({ ...prev, [field]: (prev[field] as UploadedFile[]).filter(f => f.id !== id) }));
  };

  // Sempadan handlers
  const addSempadanFiles = (slotId: string, files: File[]) => {
    setState(prev => ({
      ...prev,
      sempadan: prev.sempadan.map(s => s.id === slotId ? { ...s, files: [...s.files, ...files.map(f => createFile(f, ACCEPTED_FORMATS_ALL))] } : s),
    }));
  };
  const removeSempadanFile = (slotId: string, fileId: string) => {
    setState(prev => ({
      ...prev,
      sempadan: prev.sempadan.map(s => s.id === slotId ? { ...s, files: s.files.filter(f => f.id !== fileId) } : s),
    }));
  };

  // AhliWaris handlers
  const addAhliWarisFiles = (slotId: string, files: File[]) => {
    setState(prev => ({
      ...prev,
      ktpAhliWaris: prev.ktpAhliWaris.map(s => s.id === slotId ? { ...s, files: [...s.files, ...files.map(f => createFile(f, ACCEPTED_FORMATS_ALL))] } : s),
    }));
  };
  const removeAhliWarisFile = (slotId: string, fileId: string) => {
    setState(prev => ({
      ...prev,
      ktpAhliWaris: prev.ktpAhliWaris.map(s => s.id === slotId ? { ...s, files: s.files.filter(f => f.id !== fileId) } : s),
    }));
  };

  // Serikat member file handlers
  const makeMemberFileHandler = (field: 'serikatPenjual' | 'serikatPembeli') => ({
    add: (memberId: string, files: File[]) => {
      setState(prev => ({
        ...prev,
        [field]: (prev[field] as SerikatMember[]).map(m => m.id === memberId ? { ...m, files: [...m.files, ...files.map(f => createFile(f, ACCEPTED_FORMATS_ALL))] } : m),
      }));
    },
    remove: (memberId: string, fileId: string) => {
      setState(prev => ({
        ...prev,
        [field]: (prev[field] as SerikatMember[]).map(m => m.id === memberId ? { ...m, files: m.files.filter(f => f.id !== fileId) } : m),
      }));
    },
  });
  const penjualHandlers = makeMemberFileHandler('serikatPenjual');
  const pembeliHandlers = makeMemberFileHandler('serikatPembeli');

  // HargaJual file handlers
  const addHargaFiles = (files: File[]) => {
    setState(prev => ({
      ...prev,
      hargaJual: { ...prev.hargaJual, buktiFiles: [...prev.hargaJual.buktiFiles, ...files.map(f => createFile(f, ACCEPTED_FORMATS_ALL))] },
    }));
  };
  const removeHargaFile = (fileId: string) => {
    setState(prev => ({
      ...prev,
      hargaJual: { ...prev.hargaJual, buktiFiles: prev.hargaJual.buktiFiles.filter(f => f.id !== fileId) },
    }));
  };

  // Progress calculation
  const getRequiredSections = useCallback(() => {
    const sections: { key: string; filled: boolean }[] = [];
    if (isRequired('alasDasar', jenis)) sections.push({ key: 'alasDasar', filled: state.alasDasar.length > 0 });
    if (isRequired('ktpPenjual', jenis)) sections.push({ key: 'ktpPenjual', filled: state.isSerikat ? state.serikatPenjual.some(m => m.files.length > 0) : state.ktpPenjual.length > 0 });
    if (isRequired('ktpPembeli', jenis)) sections.push({ key: 'ktpPembeli', filled: state.isSerikat ? state.serikatPembeli.some(m => m.files.length > 0) : state.ktpPembeli.length > 0 });
    if (isRequired('ktpSempadan', jenis)) sections.push({ key: 'ktpSempadan', filled: state.sempadan.some(s => s.isFasilitasUmum || s.files.length > 0) });
    if (isRequired('ktpAhliWaris', jenis)) sections.push({ key: 'ktpAhliWaris', filled: state.ktpAhliWaris.some(s => s.files.length > 0) });
    if (isRequired('suratKematian', jenis)) sections.push({ key: 'suratKematian', filled: state.suratKematian.length > 0 });
    if (isRequired('fotoDokumentasi', jenis)) sections.push({ key: 'fotoDokumentasi', filled: state.fotoDokumentasi.length > 0 });
    if (isRequired('sketGambar', jenis)) sections.push({ key: 'sketGambar', filled: state.sketGambar.length > 0 });
    if (isRequired('titikKoordinat', jenis)) sections.push({ key: 'titikKoordinat', filled: state.titikKoordinat.length > 0 });
    if (isRequired('hargaJual', jenis)) sections.push({ key: 'hargaJual', filled: state.hargaJual.harga.length > 0 });
    return sections;
  }, [jenis, state]);

  const requiredSections = getRequiredSections();
  const filledCount = requiredSections.filter(s => s.filled).length;
  const progressPct = requiredSections.length > 0 ? Math.round((filledCount / requiredSections.length) * 100) : 0;

  // Collect all files for upload
  const collectAllFiles = (): { kategori: string; slotId?: string; file: File }[] => {
    const result: { kategori: string; slotId?: string; file: File }[] = [];
    state.alasDasar.filter(f => !f.error).forEach(f => result.push({ kategori: 'alas_dasar', file: f.file }));
    state.ktpPenjual.filter(f => !f.error).forEach(f => result.push({ kategori: 'ktp_penjual', file: f.file }));
    state.ktpPembeli.filter(f => !f.error).forEach(f => result.push({ kategori: 'ktp_pembeli', file: f.file }));
    state.sempadan.forEach(s => s.files.filter(f => !f.error).forEach(f => result.push({ kategori: 'ktp_sempadan', slotId: s.id, file: f.file })));
    state.ktpAhliWaris.forEach(s => s.files.filter(f => !f.error).forEach(f => result.push({ kategori: 'ktp_ahli_waris', slotId: s.id, file: f.file })));
    state.suratKematian.filter(f => !f.error).forEach(f => result.push({ kategori: 'surat_kematian', file: f.file }));
    state.fotoDokumentasi.filter(f => !f.error).forEach(f => result.push({ kategori: 'foto_dokumentasi', file: f.file }));
    state.sketGambar.filter(f => !f.error).forEach(f => result.push({ kategori: 'sket_gambar', file: f.file }));
    state.titikKoordinat.filter(f => !f.error).forEach(f => result.push({ kategori: 'titik_koordinat', file: f.file }));
    state.hargaJual.buktiFiles.filter(f => !f.error).forEach(f => result.push({ kategori: 'bukti_harga', file: f.file }));
    state.serikatPenjual.forEach(m => m.files.filter(f => !f.error).forEach(f => result.push({ kategori: 'serikat_penjual', slotId: m.id, file: f.file })));
    state.serikatPembeli.forEach(m => m.files.filter(f => !f.error).forEach(f => result.push({ kategori: 'serikat_pembeli', slotId: m.id, file: f.file })));
    state.dokumenLainnya.filter(f => !f.error).forEach(f => result.push({ kategori: 'dokumen_lainnya', file: f.file }));
    return result;
  };

  const saveToSupabase = async (submitStatus: 'draft' | 'diajukan') => {
    setSaving(true);
    try {
      let id = pengajuanId;
      const payload = {
        jenis_surat: jenis,
        is_serikat: state.isSerikat,
        serikat_keterangan: state.serikatKeterangan || null,
        harga_jual: state.hargaJual.harga || null,
        harga_keterangan: state.hargaJual.keterangan || null,
        sempadan_data: state.sempadan.map(s => ({ nama: s.nama, arah: s.arah, isFasilitasUmum: s.isFasilitasUmum })),
        ahli_waris_data: state.ktpAhliWaris.map(s => ({ nama: s.nama, hubungan: s.hubungan })),
        serikat_penjual_data: state.serikatPenjual.map(m => ({ nama: m.nama })),
        serikat_pembeli_data: state.serikatPembeli.map(m => ({ nama: m.nama })),
        status: submitStatus,
      };

      if (!id) {
        const row = await createPengajuan(payload);
        id = row.id;
        setPengajuanId(id);
      } else {
        await updatePengajuan(id, payload as any);
      }

      // Upload files
      const files = collectAllFiles();
      for (const { kategori, slotId, file } of files) {
        await uploadDokumenFile(id, kategori, file, slotId);
      }

      setCurrentStatus(submitStatus);
      toast({ title: submitStatus === 'draft' ? 'Draft tersimpan' : 'Pengajuan berhasil dikirim!' });
    } catch (err: any) {
      toast({ title: 'Gagal menyimpan', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = () => {
    const missing = requiredSections.filter(s => !s.filled);
    if (missing.length > 0) {
      toast({ title: 'Dokumen belum lengkap', description: `${missing.length} dokumen wajib belum diupload`, variant: 'destructive' });
      const firstRef = sectionRefs.current[missing[0].key];
      firstRef?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    saveToSupabase('diajukan');
  };

  const handleSaveDraft = () => saveToSupabase('draft');

  const isReadOnly = currentStatus === 'diajukan' || currentStatus === 'diverifikasi' || currentStatus === 'disetujui';

  // Section wrapper
  const Section: React.FC<{ id: string; title: string; fileCount?: number; required?: boolean; children: React.ReactNode }> = ({ id, title, fileCount, required, children }) => {
    const filled = requiredSections.find(s => s.key === id)?.filled ?? (fileCount !== undefined && fileCount > 0);
    const status: SectionStatus = filled ? 'filled' : 'empty';
    return (
      <div ref={el => { sectionRefs.current[id] = el; }}>
        <Card className={`${!filled && required ? 'border-orange-200' : ''}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <StatusIcon status={status} />
              {title}
              {fileCount !== undefined && fileCount > 0 && <Badge variant="secondary">{fileCount} file</Badge>}
              {required && <Badge variant="outline" className="text-xs">Wajib</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      <div>
        <h1 className="text-2xl font-bold">Upload Dokumen Persyaratan Surat Tanah</h1>
        <p className="text-muted-foreground">Pilih jenis surat lalu upload dokumen yang diperlukan</p>
      </div>

      {/* Status Workflow Visual */}
      <StatusWorkflow currentStatus={currentStatus} role={profile?.role || 'kadus'} />

      {/* Jenis Surat Selector */}
      <Card>
        <CardContent className="pt-4">
          <Select value={jenis} onValueChange={v => changeJenis(v as JenisSurat)} disabled={isReadOnly}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(JENIS_SURAT_LABELS) as [JenisSurat, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Kelengkapan Dokumen</span>
            <span className="text-sm font-bold">{progressPct}%</span>
          </div>
          <Progress value={progressPct} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">{filledCount}/{requiredSections.length} dokumen wajib terpenuhi</p>
        </CardContent>
      </Card>

      {/* Sections */}
      <div className="space-y-4">
        <Section id="alasDasar" title="Alas Dasar Hak Tanah" fileCount={state.alasDasar.length} required={isRequired('alasDasar', jenis)}>
          <FileDropzone files={state.alasDasar} onAdd={addFiles('alasDasar', ACCEPTED_FORMATS_ALL, true)} onRemove={removeFile('alasDasar')} accept={ACCEPTED_FORMATS_ALL} multiple disabled={isReadOnly} />
        </Section>

        {isVisible('ktpPenjual', jenis) && !state.isSerikat && (
          <Section id="ktpPenjual" title={KTP_PENJUAL_LABEL[jenis]} fileCount={state.ktpPenjual.length} required={isRequired('ktpPenjual', jenis)}>
            <FileDropzone files={state.ktpPenjual} onAdd={addFiles('ktpPenjual', ACCEPTED_FORMATS_ALL, false)} onRemove={removeFile('ktpPenjual')} accept={ACCEPTED_FORMATS_ALL} disabled={isReadOnly} />
          </Section>
        )}

        {isVisible('ktpPembeli', jenis) && !state.isSerikat && (
          <Section id="ktpPembeli" title={KTP_PEMBELI_LABEL[jenis]} fileCount={state.ktpPembeli.length} required={isRequired('ktpPembeli', jenis)}>
            <FileDropzone files={state.ktpPembeli} onAdd={addFiles('ktpPembeli', ACCEPTED_FORMATS_ALL, false)} onRemove={removeFile('ktpPembeli')} accept={ACCEPTED_FORMATS_ALL} disabled={isReadOnly} />
          </Section>
        )}

        {isVisible('ktpSerikat', jenis) && (
          <Section id="ktpSerikat" title="Opsi Serikat" required={false}>
            <SerikatSection
              jenisSurat={jenis} isSerikat={state.isSerikat}
              onToggle={v => setState(prev => ({ ...prev, isSerikat: v }))}
              keterangan={state.serikatKeterangan}
              onKeteranganChange={v => setState(prev => ({ ...prev, serikatKeterangan: v }))}
              serikatPenjual={state.serikatPenjual} serikatPembeli={state.serikatPembeli}
              onChangePenjual={m => setState(prev => ({ ...prev, serikatPenjual: m }))}
              onChangePembeli={m => setState(prev => ({ ...prev, serikatPembeli: m }))}
              onAddFilesPenjual={penjualHandlers.add} onRemoveFilePenjual={penjualHandlers.remove}
              onAddFilesPembeli={pembeliHandlers.add} onRemoveFilePembeli={pembeliHandlers.remove}
            />
          </Section>
        )}

        {isVisible('ktpSempadan', jenis) && (
          <Section id="ktpSempadan" title="KTP Sempadan" fileCount={state.sempadan.reduce((a, s) => a + s.files.length, 0)} required={isRequired('ktpSempadan', jenis)}>
            <SempadanSection slots={state.sempadan} onChange={s => setState(prev => ({ ...prev, sempadan: s }))} onAddFiles={addSempadanFiles} onRemoveFile={removeSempadanFile} />
          </Section>
        )}

        {isVisible('ktpAhliWaris', jenis) && (
          <Section id="ktpAhliWaris" title="KTP Ahli Waris" fileCount={state.ktpAhliWaris.reduce((a, s) => a + s.files.length, 0)} required={isRequired('ktpAhliWaris', jenis)}>
            <AhliWarisSection slots={state.ktpAhliWaris} onChange={s => setState(prev => ({ ...prev, ktpAhliWaris: s }))} onAddFiles={addAhliWarisFiles} onRemoveFile={removeAhliWarisFile} />
          </Section>
        )}

        {isVisible('suratKematian', jenis) && (
          <Section id="suratKematian" title="Surat Kematian Pewaris" fileCount={state.suratKematian.length} required={isRequired('suratKematian', jenis)}>
            <FileDropzone files={state.suratKematian} onAdd={addFiles('suratKematian', ACCEPTED_FORMATS_ALL, false)} onRemove={removeFile('suratKematian')} accept={ACCEPTED_FORMATS_ALL} disabled={isReadOnly} />
          </Section>
        )}

        <Section id="fotoDokumentasi" title="Foto Dokumentasi Pengukuran" fileCount={state.fotoDokumentasi.length} required={isRequired('fotoDokumentasi', jenis)}>
          <FileDropzone files={state.fotoDokumentasi} onAdd={addFiles('fotoDokumentasi', ACCEPTED_FORMATS_IMAGE, true)} onRemove={removeFile('fotoDokumentasi')} accept={ACCEPTED_FORMATS_IMAGE} multiple disabled={isReadOnly} />
        </Section>

        <Section id="sketGambar" title="Sket Gambar" fileCount={state.sketGambar.length} required={isRequired('sketGambar', jenis)}>
          <FileDropzone files={state.sketGambar} onAdd={addFiles('sketGambar', ACCEPTED_FORMATS_ALL, false)} onRemove={removeFile('sketGambar')} accept={ACCEPTED_FORMATS_ALL} disabled={isReadOnly} />
        </Section>

        <Section id="titikKoordinat" title="Titik Koordinat Tanah" fileCount={state.titikKoordinat.length} required={isRequired('titikKoordinat', jenis)}>
          <FileDropzone files={state.titikKoordinat} onAdd={addFiles('titikKoordinat', ACCEPTED_FORMATS_ALL, false)} onRemove={removeFile('titikKoordinat')} accept={ACCEPTED_FORMATS_ALL} disabled={isReadOnly} />
        </Section>

        {isVisible('hargaJual', jenis) && (
          <Section id="hargaJual" title="Harga Jual / Nilai Ganti Rugi" required={isRequired('hargaJual', jenis)}>
            <HargaJualSection data={state.hargaJual} onChange={d => setState(prev => ({ ...prev, hargaJual: d }))} onAddFiles={addHargaFiles} onRemoveFile={removeHargaFile} />
          </Section>
        )}

        <Section id="dokumenLainnya" title="Dokumen Pendukung Lainnya (Opsional)" fileCount={state.dokumenLainnya.length} required={false}>
          <FileDropzone files={state.dokumenLainnya} onAdd={addFiles('dokumenLainnya', ACCEPTED_FORMATS_ALL, true)} onRemove={removeFile('dokumenLainnya')} accept={ACCEPTED_FORMATS_ALL} multiple disabled={isReadOnly} />
        </Section>
      </div>

      {/* Action Buttons */}
      {!isReadOnly && (
        <div className="flex gap-3 sticky bottom-4 bg-background/95 backdrop-blur p-4 rounded-lg border shadow-lg">
          <Button variant="outline" onClick={handleSaveDraft} disabled={saving} className="flex-1">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Simpan Draft
          </Button>
          <Button onClick={handleSubmit} disabled={saving || progressPct < 100} className="flex-1">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Submit Pengajuan
          </Button>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
