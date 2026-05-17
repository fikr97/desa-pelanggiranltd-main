import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, XCircle, ShieldCheck, Loader2, FileText, Eye } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { JENIS_SURAT_LABELS } from './config';
import StatusWorkflow from './StatusWorkflow';
import { fetchAllPengajuan, verifyPengajuan, approvePengajuan, rejectPengajuan, PengajuanRow } from './supabase-service';

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  diajukan: { label: 'Diajukan', variant: 'default' },
  diverifikasi: { label: 'Diverifikasi', variant: 'outline' },
  disetujui: { label: 'Disetujui', variant: 'default' },
  ditolak: { label: 'Ditolak', variant: 'destructive' },
};

const VerifikasiPage: React.FC = () => {
  const { toast } = useToast();
  const { profile, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [catatan, setCatatan] = useState('');
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('diajukan');

  const canVerify = hasPermission('dokumen_tanah:verify');
  const canApprove = hasPermission('dokumen_tanah:approve');

  const { data: pengajuanList = [], isLoading } = useQuery({
    queryKey: ['dokumen-tanah-admin', activeTab],
    queryFn: () => fetchAllPengajuan(activeTab === 'semua' ? undefined : activeTab),
  });

  const selected = pengajuanList.find(p => p.id === selectedId);

  const handleAction = async (action: 'verify' | 'approve' | 'reject') => {
    if (!selectedId) return;
    setProcessing(true);
    try {
      if (action === 'verify') await verifyPengajuan(selectedId, catatan);
      else if (action === 'approve') await approvePengajuan(selectedId, catatan);
      else await rejectPengajuan(selectedId, catatan);

      toast({ title: action === 'verify' ? 'Berhasil diverifikasi' : action === 'approve' ? 'Berhasil disetujui' : 'Pengajuan ditolak' });
      setCatatan('');
      setSelectedId(null);
      queryClient.invalidateQueries({ queryKey: ['dokumen-tanah-admin'] });
    } catch (err: any) {
      toast({ title: 'Gagal', description: err.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4">
      <div>
        <h1 className="text-2xl font-bold">Verifikasi & Persetujuan Dokumen Tanah</h1>
        <p className="text-muted-foreground">
          {canApprove ? 'Verifikasi dan setujui pengajuan dokumen tanah' : 'Verifikasi pengajuan dokumen tanah'}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="diajukan">Diajukan</TabsTrigger>
          <TabsTrigger value="diverifikasi">Diverifikasi</TabsTrigger>
          <TabsTrigger value="disetujui">Disetujui</TabsTrigger>
          <TabsTrigger value="ditolak">Ditolak</TabsTrigger>
          <TabsTrigger value="semua">Semua</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : pengajuanList.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Tidak ada pengajuan</CardContent></Card>
          ) : (
            <div className="grid gap-3">
              {pengajuanList.map(p => (
                <Card key={p.id} className={`cursor-pointer transition-colors ${selectedId === p.id ? 'ring-2 ring-primary' : 'hover:bg-muted/50'}`} onClick={() => setSelectedId(p.id)}>
                  <CardContent className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{JENIS_SURAT_LABELS[p.jenis_surat as keyof typeof JENIS_SURAT_LABELS] || p.jenis_surat}</p>
                        <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <Badge variant={STATUS_BADGE[p.status]?.variant || 'secondary'}>{STATUS_BADGE[p.status]?.label || p.status}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Detail & Action Panel */}
      {selected && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detail Pengajuan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatusWorkflow currentStatus={selected.status} role={profile?.role || 'kades'} />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Jenis Surat:</span> <strong>{JENIS_SURAT_LABELS[selected.jenis_surat as keyof typeof JENIS_SURAT_LABELS]}</strong></div>
              <div><span className="text-muted-foreground">Serikat:</span> <strong>{selected.is_serikat ? 'Ya' : 'Tidak'}</strong></div>
              {selected.harga_jual && <div><span className="text-muted-foreground">Harga:</span> <strong>Rp {selected.harga_jual}</strong></div>}
              {selected.catatan_verifikasi && <div className="col-span-2"><span className="text-muted-foreground">Catatan Verifikasi:</span> <p className="mt-1">{selected.catatan_verifikasi}</p></div>}
              {selected.catatan_approval && <div className="col-span-2"><span className="text-muted-foreground">Catatan Approval:</span> <p className="mt-1">{selected.catatan_approval}</p></div>}
            </div>

            {/* Action area */}
            {((canVerify && selected.status === 'diajukan') || (canApprove && selected.status === 'diverifikasi')) && (
              <div className="border-t pt-4 space-y-3">
                <Textarea placeholder="Catatan (opsional)" value={catatan} onChange={e => setCatatan(e.target.value)} />
                <div className="flex gap-2">
                  {canVerify && selected.status === 'diajukan' && (
                    <Button onClick={() => handleAction('verify')} disabled={processing}>
                      {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                      Verifikasi
                    </Button>
                  )}
                  {canApprove && selected.status === 'diverifikasi' && (
                    <>
                      <Button onClick={() => handleAction('approve')} disabled={processing}>
                        {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                        Setujui
                      </Button>
                      <Button variant="destructive" onClick={() => handleAction('reject')} disabled={processing}>
                        {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                        Tolak
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VerifikasiPage;
