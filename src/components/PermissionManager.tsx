import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from '../hooks/use-toast';
import {
  Search, Shield, Users, FileSignature, ClipboardList, Megaphone, Home,
  BarChart3, FileText, MapPin, Building2, Globe, UserCog, Settings,
  Check, X, Sparkles, Lock, Eye, Edit3, Trash, Plus, Upload, ArrowRight,
  RotateCcw, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Permission {
  id: number;
  role: string;
  permission: string;
  description: string;
  is_enabled: boolean;
}

// Category metadata with icons, labels, colors
const CATEGORY_META: Record<string, { label: string; icon: any; color: string; bg: string; description: string }> = {
  dashboard: { label: 'Dashboard', icon: Home, color: 'text-blue-600', bg: 'bg-blue-500/10', description: 'Akses halaman utama dashboard' },
  penduduk: { label: 'Data Penduduk', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-500/10', description: 'Kelola data kependudukan warga' },
  keluarga: { label: 'Data Keluarga', icon: Users, color: 'text-fuchsia-600', bg: 'bg-fuchsia-500/10', description: 'Kelola data kartu keluarga' },
  surat: { label: 'Surat Menyurat', icon: FileSignature, color: 'text-emerald-600', bg: 'bg-emerald-500/10', description: 'Template & arsip surat desa' },
  form_tugas: { label: 'Form Tugas', icon: ClipboardList, color: 'text-cyan-600', bg: 'bg-cyan-500/10', description: 'Form pendataan custom' },
  berita: { label: 'Berita & Konten', icon: Megaphone, color: 'text-rose-600', bg: 'bg-rose-500/10', description: 'Kelola berita publik' },
  statistik: { label: 'Statistik', icon: BarChart3, color: 'text-violet-600', bg: 'bg-violet-500/10', description: 'Data statistik kependudukan' },
  laporan: { label: 'Laporan', icon: FileText, color: 'text-amber-600', bg: 'bg-amber-500/10', description: 'Ekspor data & laporan' },
  wilayah: { label: 'Wilayah / Dusun', icon: MapPin, color: 'text-teal-600', bg: 'bg-teal-500/10', description: 'Pengaturan dusun & wilayah' },
  info_desa: { label: 'Info Desa', icon: Building2, color: 'text-blue-700', bg: 'bg-blue-500/10', description: 'Info desa & perangkat' },
  kelola_website: { label: 'Kelola Website', icon: Globe, color: 'text-sky-600', bg: 'bg-sky-500/10', description: 'Konten website publik' },
  manajemen_user: { label: 'Manajemen User', icon: UserCog, color: 'text-pink-600', bg: 'bg-pink-500/10', description: 'Akun pengguna sistem' },
  pengaturan: { label: 'Pengaturan Sistem', icon: Settings, color: 'text-slate-600', bg: 'bg-slate-500/10', description: 'Konfigurasi & hak akses' },
  general: { label: 'Lainnya', icon: Shield, color: 'text-gray-600', bg: 'bg-gray-500/10', description: 'Perizinan umum' },
};

const PERMISSION_TYPE_META: Record<string, { icon: any; label: string; color: string }> = {
  view: { icon: Eye, label: 'Lihat', color: 'text-blue-600' },
  create: { icon: Plus, label: 'Buat', color: 'text-emerald-600' },
  edit: { icon: Edit3, label: 'Edit', color: 'text-amber-600' },
  delete: { icon: Trash, label: 'Hapus', color: 'text-rose-600' },
  manage: { icon: Settings, label: 'Kelola', color: 'text-violet-600' },
  import: { icon: Upload, label: 'Impor', color: 'text-cyan-600' },
  fill: { icon: Edit3, label: 'Isi', color: 'text-teal-600' },
};

// Categorization helpers
const getPermissionCategory = (permission: string): string => {
  const keywords = [
    'penduduk', 'keluarga', 'surat', 'form_tugas', 'berita', 'statistik',
    'laporan', 'wilayah', 'info_desa', 'kelola_website', 'manajemen_user',
    'pengaturan', 'dashboard'
  ];
  for (const kw of keywords) {
    if (permission.includes(kw)) return kw;
  }
  return 'general';
};

const getPermissionType = (permission: string): string => {
  const parts = permission.split(':');
  // button:create:xxx  or  form_tugas:create etc.
  if (parts.length >= 3) return parts[1];
  if (parts.length === 2) return parts[1];
  return 'general';
};

const groupPermissions = (permissions: Permission[]) => {
  return permissions.reduce((acc, permission) => {
    const category = getPermissionCategory(permission.permission);
    if (!acc[category]) acc[category] = [];
    acc[category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);
};

const PermissionManager = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchPermissions = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('role', 'kadus')
        .order('permission', { ascending: true });

      if (error) {
        setError('Gagal memuat data hak akses: ' + error.message);
        toast({ title: 'Error', description: 'Gagal memuat data hak akses.', variant: 'destructive' });
      } else {
        setPermissions(data as Permission[]);
      }
      setLoading(false);
    };
    fetchPermissions();
  }, []);

  const togglePermission = async (permissionId: number, newStatus: boolean) => {
    setSavingIds(prev => new Set(prev).add(permissionId));
    setPermissions(prev => prev.map(p => p.id === permissionId ? { ...p, is_enabled: newStatus } : p));

    const { error } = await supabase
      .from('role_permissions')
      .update({ is_enabled: newStatus })
      .eq('id', permissionId);

    setSavingIds(prev => { const n = new Set(prev); n.delete(permissionId); return n; });

    if (error) {
      setPermissions(prev => prev.map(p => p.id === permissionId ? { ...p, is_enabled: !newStatus } : p));
      toast({ title: 'Update Gagal', description: 'Gagal memperbarui hak akses: ' + error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Tersimpan', description: 'Hak akses diperbarui.' });
    }
  };

  const toggleCategory = async (category: string, enable: boolean) => {
    const targetPerms = permissions.filter(p => getPermissionCategory(p.permission) === category);
    const ids = targetPerms.map(p => p.id);
    if (ids.length === 0) return;

    // Optimistic update
    setPermissions(prev => prev.map(p => ids.includes(p.id) ? { ...p, is_enabled: enable } : p));
    setSavingIds(prev => { const n = new Set(prev); ids.forEach(i => n.add(i)); return n; });

    const { error } = await supabase
      .from('role_permissions')
      .update({ is_enabled: enable })
      .in('id', ids);

    setSavingIds(prev => { const n = new Set(prev); ids.forEach(i => n.delete(i)); return n; });

    if (error) {
      toast({ title: 'Gagal', description: error.message, variant: 'destructive' });
      // reload
      const { data } = await supabase.from('role_permissions').select('*').eq('role', 'kadus');
      if (data) setPermissions(data as Permission[]);
    } else {
      toast({ title: 'Tersimpan', description: `Semua akses kategori ${CATEGORY_META[category]?.label || category} ${enable ? 'diaktifkan' : 'dinonaktifkan'}.` });
    }
  };

  const applyPreset = async (preset: 'readonly' | 'editor' | 'none') => {
    if (!window.confirm(`Terapkan preset "${preset}" ke semua hak akses Kadus? Ini akan menimpa pengaturan saat ini.`)) return;

    const updates = permissions.map(p => {
      let newStatus = false;
      if (preset === 'none') newStatus = false;
      else if (preset === 'readonly') {
        const type = getPermissionType(p.permission);
        newStatus = type === 'view';
      } else if (preset === 'editor') {
        const type = getPermissionType(p.permission);
        newStatus = ['view', 'create', 'edit', 'fill', 'manage'].includes(type);
      }
      return { id: p.id, is_enabled: newStatus };
    });

    setSavingIds(new Set(updates.map(u => u.id)));
    setPermissions(prev => prev.map(p => {
      const u = updates.find(x => x.id === p.id);
      return u ? { ...p, is_enabled: u.is_enabled } : p;
    }));

    // Batch update
    const promises = updates.map(u =>
      supabase.from('role_permissions').update({ is_enabled: u.is_enabled }).eq('id', u.id)
    );
    try {
      await Promise.all(promises);
      toast({ title: 'Preset Diterapkan', description: `Preset "${preset}" berhasil diterapkan.` });
    } catch (e: any) {
      toast({ title: 'Gagal', description: e.message || 'Gagal menerapkan preset', variant: 'destructive' });
    } finally {
      setSavingIds(new Set());
    }
  };

  const filteredPermissions = useMemo(() => {
    return permissions.filter(p => {
      if (filter === 'enabled' && !p.is_enabled) return false;
      if (filter === 'disabled' && p.is_enabled) return false;
      if (search) {
        const q = search.toLowerCase();
        return (p.description?.toLowerCase().includes(q)) ||
          p.permission.toLowerCase().includes(q);
      }
      return true;
    });
  }, [permissions, search, filter]);

  const grouped = useMemo(() => groupPermissions(filteredPermissions), [filteredPermissions]);
  const totalEnabled = permissions.filter(p => p.is_enabled).length;
  const totalPerms = permissions.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) return <div className="text-destructive p-4">{error}</div>;

  return (
    <div className="space-y-5">
      {/* Summary + Presets */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-background to-accent/5 p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg">Hak Akses Kepala Dusun (Kadus)</h3>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{totalEnabled}</span> dari{' '}
                <span className="font-semibold text-foreground">{totalPerms}</span> izin aktif
              </p>
            </div>
          </div>

          {/* Presets */}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => applyPreset('none')} className="gap-1.5">
              <Lock className="h-3.5 w-3.5" /> Tutup Semua
            </Button>
            <Button size="sm" variant="outline" onClick={() => applyPreset('readonly')} className="gap-1.5">
              <Eye className="h-3.5 w-3.5" /> Read-Only
            </Button>
            <Button size="sm" variant="outline" onClick={() => applyPreset('editor')} className="gap-1.5">
              <Edit3 className="h-3.5 w-3.5" /> Editor
            </Button>
          </div>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari izin... (mis. penduduk, edit, hapus)"
            className="pl-10 h-10"
          />
        </div>
        <div className="flex rounded-lg border border-border p-1 bg-muted/50">
          {[
            { k: 'all', label: 'Semua' },
            { k: 'enabled', label: 'Aktif' },
            { k: 'disabled', label: 'Nonaktif' },
          ].map(t => (
            <button
              key={t.k}
              onClick={() => setFilter(t.k as any)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                filter === t.k ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Groups */}
      {Object.keys(grouped).length === 0 ? (
        <div className="card-premium rounded-2xl p-10 text-center">
          <Search className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">Tidak ada izin yang cocok.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([category, perms]) => {
          const meta = CATEGORY_META[category] || CATEGORY_META.general;
          const enabledCount = perms.filter(p => p.is_enabled).length;
          const allEnabled = enabledCount === perms.length;
          const noneEnabled = enabledCount === 0;

          return (
            <div key={category} className="rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-colors">
              {/* Category Header */}
              <div className="flex items-center justify-between gap-3 p-4 bg-muted/30 border-b border-border">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0", meta.bg)}>
                    <meta.icon className={cn("h-5 w-5", meta.color)} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      {meta.label}
                      <Badge variant="secondary" className="text-[10px] rounded-full">
                        {enabledCount}/{perms.length}
                      </Badge>
                    </h4>
                    <p className="text-xs text-muted-foreground truncate">{meta.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button size="sm" variant="ghost" className="h-8 text-xs"
                    onClick={() => toggleCategory(category, true)}
                    disabled={allEnabled}>
                    <Check className="h-3.5 w-3.5 mr-1" /> Semua
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 text-xs"
                    onClick={() => toggleCategory(category, false)}
                    disabled={noneEnabled}>
                    <X className="h-3.5 w-3.5 mr-1" /> Tidak
                  </Button>
                </div>
              </div>

              {/* Permission rows */}
              <div className="divide-y divide-border">
                {perms.map(perm => {
                  const type = getPermissionType(perm.permission);
                  const typeMeta = PERMISSION_TYPE_META[type] || { icon: Shield, label: type, color: 'text-gray-600' };
                  const TypeIcon = typeMeta.icon;
                  const saving = savingIds.has(perm.id);

                  return (
                    <div key={perm.id} className="flex items-center justify-between gap-3 p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-muted/50")}>
                          <TypeIcon className={cn("h-4 w-4", typeMeta.color)} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium">{perm.description || perm.permission}</p>
                            <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wider", typeMeta.color)}>
                              {typeMeta.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">{perm.permission}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
                        <Switch
                          checked={perm.is_enabled}
                          onCheckedChange={(s) => togglePermission(perm.id, s)}
                          disabled={saving}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default PermissionManager;
