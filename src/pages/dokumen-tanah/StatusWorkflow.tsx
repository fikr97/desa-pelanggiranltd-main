import React from 'react';
import { CheckCircle2, Clock, XCircle, ArrowRight, FileEdit, ShieldCheck, Stamp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusWorkflowProps {
  currentStatus: string;
  role: string;
}

const STEPS = [
  { key: 'draft', label: 'Draft', icon: FileEdit, roleHint: 'Kadus' },
  { key: 'diajukan', label: 'Diajukan', icon: Clock, roleHint: 'Kadus' },
  { key: 'diverifikasi', label: 'Diverifikasi', icon: ShieldCheck, roleHint: 'Sekdes' },
  { key: 'disetujui', label: 'Disetujui', icon: Stamp, roleHint: 'Kades' },
];

const STATUS_ORDER = ['draft', 'diajukan', 'diverifikasi', 'disetujui'];

const StatusWorkflow: React.FC<StatusWorkflowProps> = ({ currentStatus, role }) => {
  const currentIdx = currentStatus === 'ditolak' ? -1 : STATUS_ORDER.indexOf(currentStatus);

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Status Pengajuan</h3>
        {currentStatus === 'ditolak' && (
          <span className="inline-flex items-center gap-1 text-sm font-medium text-destructive">
            <XCircle className="h-4 w-4" /> Ditolak
          </span>
        )}
      </div>

      {/* Visual Steps */}
      <div className="flex items-center gap-1">
        {STEPS.map((step, i) => {
          const isActive = i === currentIdx;
          const isDone = i < currentIdx;
          const Icon = step.icon;

          return (
            <React.Fragment key={step.key}>
              <div className={cn(
                'flex flex-col items-center flex-1 min-w-0',
              )}>
                <div className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors',
                  isDone && 'bg-green-100 border-green-500 text-green-600',
                  isActive && 'bg-primary/10 border-primary text-primary ring-2 ring-primary/20',
                  !isDone && !isActive && 'bg-muted border-muted-foreground/30 text-muted-foreground',
                )}>
                  {isDone ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
                </div>
                <span className={cn(
                  'text-[10px] mt-1 text-center leading-tight',
                  isActive ? 'font-semibold text-primary' : 'text-muted-foreground',
                )}>{step.label}</span>
                <span className="text-[9px] text-muted-foreground">{step.roleHint}</span>
              </div>
              {i < STEPS.length - 1 && (
                <ArrowRight className={cn(
                  'h-4 w-4 shrink-0 mt-[-16px]',
                  i < currentIdx ? 'text-green-500' : 'text-muted-foreground/40',
                )} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Role-specific hint */}
      <div className="mt-3 text-xs text-muted-foreground border-t pt-2">
        {role === 'kadus' || role === 'kaur_kasi' ? (
          currentStatus === 'draft' ? 'Lengkapi dokumen lalu klik Submit untuk mengajukan.' :
          currentStatus === 'diajukan' ? 'Pengajuan sedang menunggu verifikasi Sekretaris Desa.' :
          currentStatus === 'diverifikasi' ? 'Pengajuan sudah diverifikasi, menunggu persetujuan Kepala Desa.' :
          currentStatus === 'disetujui' ? '✅ Pengajuan telah disetujui.' :
          currentStatus === 'ditolak' ? '❌ Pengajuan ditolak. Anda dapat memperbaiki dan mengajukan ulang.' : ''
        ) : role === 'sekretaris_desa' ? (
          currentStatus === 'diajukan' ? 'Anda dapat memverifikasi pengajuan ini.' :
          currentStatus === 'diverifikasi' ? 'Menunggu persetujuan Kepala Desa.' : 'Lihat detail pengajuan.'
        ) : role === 'kades' ? (
          currentStatus === 'diverifikasi' ? 'Anda dapat menyetujui atau menolak pengajuan ini.' :
          currentStatus === 'disetujui' ? 'Pengajuan telah Anda setujui.' : 'Lihat detail pengajuan.'
        ) : 'Lihat detail pengajuan.'}
      </div>
    </div>
  );
};

export default StatusWorkflow;
