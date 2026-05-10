import React from 'react';
import {
  Users, User, UserRound, Building, FileText, ClipboardList, Megaphone,
  TrendingUp, Sparkles, Activity, ArrowUpRight, Clock
} from 'lucide-react';
import StatCard from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const COLORS = ['#4F46E5', '#06B6D4', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#F97316'];

const Dashboard = () => {
  const { profile } = useAuth();
  const hour = new Date().getHours();
  const greeting = hour < 11 ? 'Selamat Pagi' : hour < 15 ? 'Selamat Siang' : hour < 19 ? 'Selamat Sore' : 'Selamat Malam';

  const { data: dashboardStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_dashboard_stats');
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const { data: recentSurat, isLoading: isLoadingSurat } = useQuery({
    queryKey: ['recent-surat'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('surat')
        .select('id, nomor_surat, judul_surat, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const fmt = (n: number | undefined) => (n || 0).toLocaleString('id-ID');

  return (
    <div className="space-y-6 md:space-y-8">
      {/* HERO BANNER */}
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary via-fuchsia-600 to-accent text-white p-6 md:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.2),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.15),transparent_50%)]" />
        <div className="absolute top-0 right-0 h-72 w-72 rounded-full bg-white/10 blur-3xl animate-float" />
        <div className="absolute bottom-0 left-1/4 h-60 w-60 rounded-full bg-white/5 blur-3xl animate-float-slow" />

        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-semibold tracking-wider uppercase mb-3">
              <Sparkles className="h-3.5 w-3.5" /> Dashboard Admin
            </div>
            <h1 className="font-display font-bold text-3xl md:text-5xl tracking-tight leading-tight">
              {greeting},{' '}
              <span className="text-white">
                {profile?.nama?.split(' ')[0] || 'Admin'}!
              </span>
            </h1>
            <p className="text-white/85 mt-3 text-sm md:text-base max-w-xl">
              Berikut ringkasan statistik dan aktivitas terkini sistem informasi desa Anda.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/penduduk">
              <Button className="rounded-full bg-white text-primary hover:bg-white/90 font-semibold h-11 px-5">
                <Users className="mr-2 h-4 w-4" /> Kelola Penduduk
              </Button>
            </Link>
            <Link to="/statistik">
              <Button variant="outline" className="rounded-full border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white font-semibold h-11 px-5">
                <TrendingUp className="mr-2 h-4 w-4" /> Statistik
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <StatCard
          title="Total Penduduk"
          value={isLoadingStats ? '...' : fmt(dashboardStats?.total_penduduk)}
          icon={Users}
          color="blue"
          subtitle="Seluruh warga terdaftar"
        />
        <StatCard
          title="Laki-laki"
          value={isLoadingStats ? '...' : fmt(dashboardStats?.total_laki_laki)}
          icon={User}
          color="cyan"
          subtitle="Penduduk laki-laki"
        />
        <StatCard
          title="Perempuan"
          value={isLoadingStats ? '...' : fmt(dashboardStats?.total_perempuan)}
          icon={UserRound}
          color="purple"
          subtitle="Penduduk perempuan"
        />
        <StatCard
          title="Kepala Keluarga"
          value={isLoadingStats ? '...' : fmt(dashboardStats?.total_kk)}
          icon={Building}
          color="green"
          subtitle="KK terdaftar"
        />
      </section>

      {/* CHARTS + SIDE */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Charts card */}
        <Card className="lg:col-span-2 rounded-2xl border-border/70 shadow-sm overflow-hidden">
          <CardHeader className="border-b border-border/70 bg-muted/30">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                Distribusi Demografi
              </CardTitle>
              <Badge variant="secondary" className="rounded-full text-[11px]">
                Data realtime
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <Tabs defaultValue="usia">
              <TabsList className="w-full grid grid-cols-4 h-10 rounded-xl">
                <TabsTrigger value="usia" className="rounded-lg">Usia</TabsTrigger>
                <TabsTrigger value="pendidikan" className="rounded-lg">Pendidikan</TabsTrigger>
                <TabsTrigger value="agama" className="rounded-lg">Agama</TabsTrigger>
                <TabsTrigger value="pekerjaan" className="rounded-lg">Pekerjaan</TabsTrigger>
              </TabsList>

              <div className="mt-4 pt-2">
                {isLoadingStats ? (
                  <div className="h-[360px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
                      <p>Memuat data grafik...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <TabsContent value="usia" className="mt-0">
                      <ResponsiveContainer width="100%" height={360}>
                        <BarChart data={dashboardStats?.age_groups} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                          <defs>
                            <linearGradient id="bar-usia" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#4F46E5" />
                              <stop offset="100%" stopColor="#06B6D4" />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                          <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip
                            contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }}
                            formatter={(value) => [value, 'Jumlah Jiwa']}
                          />
                          <Bar dataKey="jumlah" fill="url(#bar-usia)" radius={[8, 8, 0, 0]} name="Jumlah Jiwa" />
                        </BarChart>
                      </ResponsiveContainer>
                    </TabsContent>
                    <TabsContent value="pendidikan" className="mt-0">
                      <ResponsiveContainer width="100%" height={360}>
                        <PieChart>
                          <Pie data={dashboardStats?.pendidikan} dataKey="jumlah" nameKey="pendidikan"
                            cx="50%" cy="50%" outerRadius={130} innerRadius={70} paddingAngle={2}>
                            {dashboardStats?.pendidikan?.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }}
                            formatter={(value, name) => [`${(value as number).toLocaleString()} jiwa`, name]}
                          />
                          <Legend wrapperStyle={{ fontSize: '12px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </TabsContent>
                    <TabsContent value="agama" className="mt-0">
                      <ResponsiveContainer width="100%" height={360}>
                        <PieChart>
                          <Pie data={dashboardStats?.agama} dataKey="jumlah" nameKey="agama"
                            cx="50%" cy="50%" outerRadius={130} innerRadius={70} paddingAngle={2}>
                            {dashboardStats?.agama?.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }}
                            formatter={(value, name) => [`${(value as number).toLocaleString()} jiwa`, name]}
                          />
                          <Legend wrapperStyle={{ fontSize: '12px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </TabsContent>
                    <TabsContent value="pekerjaan" className="mt-0">
                      <ResponsiveContainer width="100%" height={360}>
                        <BarChart data={dashboardStats?.pekerjaan} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                          <defs>
                            <linearGradient id="bar-pekerjaan" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#F97316" />
                              <stop offset="100%" stopColor="#EC4899" />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 12 }} />
                          <YAxis type="category" dataKey="pekerjaan" width={150} tick={{ fontSize: 12 }} />
                          <Tooltip
                            contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }}
                            formatter={(value) => [`${(value as number).toLocaleString()} jiwa`, 'Jumlah']}
                          />
                          <Bar dataKey="jumlah" fill="url(#bar-pekerjaan)" radius={[0, 8, 8, 0]} name="Jumlah Jiwa" />
                        </BarChart>
                      </ResponsiveContainer>
                    </TabsContent>
                  </>
                )}
              </div>
            </Tabs>
          </CardContent>
        </Card>

        {/* Recent Surat */}
        <Card className="rounded-2xl border-border/70 shadow-sm overflow-hidden">
          <CardHeader className="border-b border-border/70 bg-muted/30">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-emerald-600" />
              </div>
              Surat Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {isLoadingSurat ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                <div className="w-6 h-6 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
                Memuat data...
              </div>
            ) : (
              <div className="space-y-2">
                {recentSurat?.map((surat, i) => (
                  <Link
                    key={surat.id}
                    to="/template-surat"
                    className="flex items-start justify-between gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex gap-3 min-w-0 flex-1">
                      <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-500/15 to-teal-500/15 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                          {surat.judul_surat}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 font-mono truncate">
                          {surat.nomor_surat}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(surat.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all flex-shrink-0" />
                  </Link>
                ))}
                {(!recentSurat || recentSurat.length === 0) && (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                    Belum ada surat dibuat
                  </div>
                )}
                {recentSurat && recentSurat.length > 0 && (
                  <Link to="/template-surat" className="block mt-2">
                    <Button variant="outline" size="sm" className="w-full rounded-xl">
                      Lihat Semua <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* QUICK ACTIONS */}
      <section>
        <div className="mb-4">
          <h3 className="font-display font-bold text-xl">Tindakan Cepat</h3>
          <p className="text-sm text-muted-foreground">Akses cepat ke menu penting</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Users, label: 'Tambah Penduduk', to: '/penduduk', grad: 'from-blue-500 to-indigo-600' },
            { icon: FileText, label: 'Buat Surat', to: '/template-surat', grad: 'from-emerald-500 to-teal-600' },
            { icon: ClipboardList, label: 'Form Tugas', to: '/form-tugas', grad: 'from-cyan-500 to-sky-600' },
            { icon: Megaphone, label: 'Kelola Konten', to: '/admin/content', grad: 'from-rose-500 to-fuchsia-600' },
          ].map(a => (
            <Link key={a.label} to={a.to} className="group">
              <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-5 hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                <div className={`inline-flex h-12 w-12 rounded-xl bg-gradient-to-br ${a.grad} text-white items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <a.icon className="h-6 w-6" />
                </div>
                <p className="font-semibold mt-3">{a.label}</p>
                <div className="inline-flex items-center gap-1 mt-1 text-xs text-muted-foreground group-hover:text-primary group-hover:gap-2 transition-all">
                  Buka <ArrowUpRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
