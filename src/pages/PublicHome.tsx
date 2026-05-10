import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Building2, MapPin, Phone, Mail, Users, Calendar as CalendarIcon,
  TrendingUp, Award, Sparkles, ArrowUpRight, Clock, FileText, Camera,
  Shield, Zap, HeartHandshake, CheckCircle2, Home, Megaphone, BookOpen,
  Trophy, Star, ChevronRight, Globe, Layers, Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import PublicLayout from '@/components/PublicLayout';

const PublicHome = () => {
  // ----- Queries -----
  const { data: infoDesaData } = useQuery({
    queryKey: ['public-info-desa'],
    queryFn: async () => {
      const { data, error } = await supabase.from('info_desa').select('*').single();
      if (error && error.code !== 'PGRST116') console.error(error);
      return data;
    }
  });

  const { data: beritaData } = useQuery({
    queryKey: ['public-berita'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('berita')
        .select('*')
        .eq('status', 'published')
        .order('tanggal_publikasi', { ascending: false })
        .limit(3);
      if (error) { console.error(error); return []; }
      return data || [];
    }
  });

  const { data: galeriData } = useQuery({
    queryKey: ['public-galeri'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('galeri')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(6);
      if (error) { console.error(error); return []; }
      return data || [];
    }
  });

  const { data: kepalaDesaData } = useQuery({
    queryKey: ['public-kepala-desa'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('perangkat_desa')
        .select('*')
        .eq('status', 'Aktif')
        .ilike('jabatan', '%kepala desa%')
        .single();
      if (error && error.code !== 'PGRST116') console.error(error);
      return data;
    }
  });

  const { data: statistikData } = useQuery({
    queryKey: ['public-statistik'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc('get_public_population_stats');
        if (error) throw error;
        const stats = data as { total: number; laki: number; perempuan: number; kk: number };
        return {
          total: stats?.total || 0,
          laki: stats?.laki || 0,
          perempuan: stats?.perempuan || 0,
          kk: stats?.kk || 0,
        };
      } catch (e) {
        console.error(e);
        return { total: 0, laki: 0, perempuan: 0, kk: 0 };
      }
    }
  });

  const fmt = (n: number | undefined) => (n || 0).toLocaleString('id-ID');
  const lokasi = infoDesaData?.nama_kecamatan
    ? `${infoDesaData.nama_kecamatan}, ${infoDesaData.nama_kabupaten || ''}`.replace(/, $/, '')
    : 'Wilayah Indonesia';

  // ----- Features / Bento -----
  const features = [
    { icon: Home, title: 'Profil & Sejarah', desc: 'Kenali desa, sejarah, visi misi, dan kondisi geografisnya.', href: '/profil-desa', color: 'from-blue-500 to-indigo-600' },
    { icon: Users, title: 'Struktur Pemerintahan', desc: 'Lihat perangkat desa dan lembaga pendukung secara transparan.', href: '/pemerintahan', color: 'from-fuchsia-500 to-purple-600' },
    { icon: Megaphone, title: 'Berita & Pengumuman', desc: 'Info terkini dan pengumuman resmi dari pemerintah desa.', href: '/berita', color: 'from-emerald-500 to-teal-600' },
    { icon: Camera, title: 'Galeri Desa', desc: 'Dokumentasi kegiatan dan potensi desa dalam foto & video.', href: '/galeri', color: 'from-amber-500 to-orange-600' },
    { icon: CalendarIcon, title: 'Agenda Kegiatan', desc: 'Jadwal kegiatan, rapat, dan acara desa yang akan datang.', href: '/agenda', color: 'from-rose-500 to-pink-600' },
    { icon: FileText, title: 'Layanan Surat Online', desc: 'Ajukan surat keterangan tanpa perlu antri di kantor desa.', href: '/surat-online', color: 'from-cyan-500 to-sky-600' },
  ];

  const trustPoints = [
    { icon: Shield, label: 'Data Aman & Terenkripsi' },
    { icon: Zap, label: 'Layanan 24/7 Online' },
    { icon: HeartHandshake, label: 'Transparan & Akuntabel' },
    { icon: CheckCircle2, label: 'Terverifikasi Pemerintah' },
  ];

  return (
    <PublicLayout>
      {/* ============================================================= */}
      {/* HERO SECTION                                                    */}
      {/* ============================================================= */}
      <section className="relative overflow-hidden">
        {/* Animated backgrounds */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/30" />
        <div className="absolute inset-0 bg-mesh opacity-70" />
        <div className="absolute inset-0 bg-grid mask-fade-radial opacity-[0.25]" />

        {/* Floating blobs */}
        <div className="absolute top-20 -left-24 h-80 w-80 rounded-full bg-primary/25 blur-3xl animate-blob" />
        <div className="absolute top-40 right-0 h-96 w-96 rounded-full bg-accent/25 blur-3xl animate-blob delay-2000" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl animate-blob delay-1000" />

        <div className="container mx-auto px-4 pt-16 md:pt-24 pb-20 md:pb-28 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-strong text-xs md:text-sm font-medium animate-fade-up">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-foreground/80">
                <MapPin className="inline h-3 w-3 mr-1 text-primary" />
                {lokasi}
              </span>
              <span className="hidden sm:inline text-border">|</span>
              <span className="hidden sm:inline text-foreground/80">
                Sistem Informasi Desa Digital
              </span>
            </div>

            {/* Heading */}
            <h1 className="mt-6 font-display font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight animate-fade-up delay-100">
              Selamat Datang di{' '}
              <span className="relative inline-block">
                <span className="text-gradient">{infoDesaData?.nama_desa || 'Desa Kami'}</span>
                <svg className="absolute left-0 -bottom-2 w-full" height="10" viewBox="0 0 200 10" preserveAspectRatio="none">
                  <path d="M0 5 Q50 0 100 5 T200 5" stroke="url(#underline-gradient)" strokeWidth="3" fill="none" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="underline-gradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="hsl(var(--primary))" />
                      <stop offset="100%" stopColor="hsl(var(--accent))" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </h1>

            <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-up delay-200">
              Portal resmi desa dengan teknologi modern untuk layanan administrasi, informasi, dan interaksi warga.
              Cepat, transparan, dan selalu tersedia kapanpun Anda butuhkan.
            </p>

            {/* CTA */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-up delay-300">
              <Link to="/berita">
                <Button size="lg" className="btn-gradient btn-shine rounded-full px-7 h-12 text-sm font-semibold">
                  Jelajahi Desa
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/pemerintahan">
                <Button size="lg" variant="outline" className="rounded-full px-7 h-12 text-sm font-semibold border-border/80 hover:border-primary/50 hover:bg-primary/5 backdrop-blur">
                  <Users className="mr-2 h-4 w-4" />
                  Lihat Pemerintahan
                </Button>
              </Link>
            </div>

            {/* Trust Points */}
            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto animate-fade-up delay-400">
              {trustPoints.map((tp) => (
                <div key={tp.label} className="flex items-center gap-2 px-3 py-2.5 rounded-xl glass text-xs md:text-sm text-foreground/80 justify-center">
                  <tp.icon className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="font-medium">{tp.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hero stats card cluster */}
          <div className="relative mt-16 md:mt-20 animate-fade-up delay-500">
            <div className="max-w-5xl mx-auto">
              <div className="relative rounded-3xl overflow-hidden border border-border/60 bg-gradient-to-br from-background to-muted/50 shadow-[0_24px_70px_-24px_hsl(243_75%_40%/0.22)] p-6 md:p-10">
                <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 h-56 w-56 rounded-full bg-accent/15 blur-3xl pointer-events-none" />

                <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                  <div>
                    <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-primary mb-3">
                      <Activity className="h-3.5 w-3.5" /> Data Desa Realtime
                    </div>
                    <h2 className="font-display font-bold text-2xl md:text-3xl">Statistik Desa</h2>
                    <p className="text-muted-foreground text-sm mt-1">Informasi kependudukan yang diperbarui secara berkala</p>
                  </div>
                  <Link to="/pemerintahan">
                    <Button variant="ghost" className="rounded-full text-sm font-semibold hover:bg-primary/5">
                      Selengkapnya <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  {[
                    { label: 'Total Penduduk', value: fmt(statistikData?.total), icon: Users, color: 'text-primary', bg: 'bg-primary/10', gradient: 'from-primary/20 to-primary/5' },
                    { label: 'Kepala Keluarga', value: fmt(statistikData?.kk), icon: Home, color: 'text-fuchsia-600', bg: 'bg-fuchsia-500/10', gradient: 'from-fuchsia-500/20 to-fuchsia-500/5' },
                    { label: 'Laki-laki', value: fmt(statistikData?.laki), icon: TrendingUp, color: 'text-cyan-600', bg: 'bg-cyan-500/10', gradient: 'from-cyan-500/20 to-cyan-500/5' },
                    { label: 'Perempuan', value: fmt(statistikData?.perempuan), icon: Trophy, color: 'text-rose-600', bg: 'bg-rose-500/10', gradient: 'from-rose-500/20 to-rose-500/5' },
                  ].map((s, i) => (
                    <div
                      key={s.label}
                      className={`relative group rounded-2xl p-5 border border-border/60 bg-gradient-to-br ${s.gradient} overflow-hidden hover:border-primary/40 hover:-translate-y-1 transition-all duration-300`}
                      style={{ animationDelay: `${i * 0.08}s` }}
                    >
                      <div className={`inline-flex p-2.5 rounded-xl ${s.bg} mb-3`}>
                        <s.icon className={`h-5 w-5 ${s.color}`} />
                      </div>
                      <div className="font-display font-bold text-2xl md:text-3xl tracking-tight">{s.value}</div>
                      <div className="text-xs md:text-sm text-muted-foreground mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================= */}
      {/* FEATURES / BENTO GRID                                           */}
      {/* ============================================================= */}
      <section className="relative py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="badge-premium mb-4">
              <Layers className="h-3.5 w-3.5" /> Fitur Platform
            </div>
            <h2 className="font-display font-bold text-3xl md:text-5xl tracking-tight">
              Semua dalam <span className="text-gradient">satu platform</span>
            </h2>
            <p className="text-muted-foreground mt-4 text-base md:text-lg">
              Akses informasi, layanan, dan kegiatan desa dengan mudah — dari mana saja, kapan saja.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <Link to={f.href} key={f.title} className="group">
                <div className="card-premium h-full p-6 md:p-7 rounded-3xl relative">
                  <div className={`inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br ${f.color} text-white shadow-lg mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
                    <f.icon className="h-7 w-7" />
                  </div>
                  <h3 className="font-display font-bold text-xl mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  <div className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary opacity-80 group-hover:opacity-100 group-hover:gap-2 transition-all">
                    Buka halaman <ArrowUpRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================= */}
      {/* KEPALA DESA SPOTLIGHT                                           */}
      {/* ============================================================= */}
      {(kepalaDesaData || infoDesaData?.nama_kepala_desa) && (
        <section className="relative py-20 md:py-28">
          <div className="container mx-auto px-4">
            <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-primary via-fuchsia-600 to-accent text-white">
              {/* Decorative */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.2),transparent_50%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.15),transparent_50%)]" />
              <div className="absolute top-0 right-0 h-80 w-80 rounded-full bg-white/10 blur-3xl animate-float" />
              <div className="absolute bottom-0 left-0 h-60 w-60 rounded-full bg-white/10 blur-3xl animate-float-slow" />

              <div className="relative grid md:grid-cols-2 gap-8 md:gap-12 p-8 md:p-14 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-semibold tracking-wider uppercase mb-4">
                    <Award className="h-3.5 w-3.5" /> Kepala Desa
                  </div>
                  <h2 className="font-display font-bold text-3xl md:text-5xl leading-tight">
                    {kepalaDesaData?.nama || infoDesaData?.nama_kepala_desa || 'Kepala Desa'}
                  </h2>
                  {kepalaDesaData?.jabatan && (
                    <p className="text-white/85 mt-2 text-lg">{kepalaDesaData.jabatan}</p>
                  )}
                  {kepalaDesaData?.nip && (
                    <p className="text-white/70 mt-1 text-sm">NIP: {kepalaDesaData.nip}</p>
                  )}
                  <p className="text-white/85 mt-5 text-base md:text-lg leading-relaxed max-w-xl">
                    "Bersama membangun desa yang maju, transparan, dan berdaya saing — demi kesejahteraan seluruh warga {infoDesaData?.nama_desa || 'desa'}."
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link to="/pemerintahan">
                      <Button className="rounded-full bg-white text-primary hover:bg-white/90 font-semibold h-11 px-6">
                        Lihat Struktur <ArrowUpRight className="ml-1.5 h-4 w-4" />
                      </Button>
                    </Link>
                    <Link to="/visi-misi">
                      <Button variant="outline" className="rounded-full border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white font-semibold h-11 px-6">
                        Visi & Misi
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="relative flex justify-center md:justify-end">
                  <div className="relative">
                    <div className="absolute -inset-4 bg-white/20 blur-2xl rounded-full" />
                    <div className="relative aspect-square w-64 md:w-80 rounded-[2rem] overflow-hidden ring-4 ring-white/40 shadow-2xl bg-white/10 backdrop-blur-sm">
                      {kepalaDesaData?.foto ? (
                        <img src={kepalaDesaData.foto} alt={kepalaDesaData.nama} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Users className="h-28 w-28 text-white/60" />
                        </div>
                      )}
                    </div>
                    {/* Floating badge */}
                    <div className="absolute -bottom-4 -left-4 bg-white text-foreground rounded-2xl px-4 py-3 shadow-xl flex items-center gap-2.5">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white">
                        <Star className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Pemimpin</div>
                        <div className="text-sm font-bold">Amanah & Melayani</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================= */}
      {/* BERITA TERBARU                                                  */}
      {/* ============================================================= */}
      <section className="relative py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
            <div className="max-w-xl">
              <div className="badge-premium mb-4">
                <Megaphone className="h-3.5 w-3.5" /> Berita Terkini
              </div>
              <h2 className="font-display font-bold text-3xl md:text-5xl tracking-tight">
                Informasi <span className="text-gradient">terbaru</span> dari desa
              </h2>
              <p className="text-muted-foreground mt-3 text-base md:text-lg">
                Tetap terhubung dengan kegiatan, pengumuman, dan perkembangan desa.
              </p>
            </div>
            <Link to="/berita">
              <Button className="rounded-full btn-gradient btn-shine h-11 px-6 font-semibold">
                Semua Berita <ArrowUpRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {beritaData && beritaData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {beritaData.map((berita, i) => (
                <Link key={berita.id} to={`/berita/${berita.slug}`} className="group">
                  <article className="card-premium rounded-3xl h-full flex flex-col overflow-hidden">
                    <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                      {berita.gambar ? (
                        <img
                          src={berita.gambar}
                          alt={berita.judul}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                          <BookOpen className="h-16 w-16 text-primary/30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      {i === 0 && (
                        <span className="absolute top-4 left-4 badge-premium !bg-white !border-white !text-primary">
                          <Sparkles className="h-3 w-3" /> Terbaru
                        </span>
                      )}
                      <span className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur text-xs font-semibold text-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(berita.tanggal_publikasi).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="font-display font-bold text-lg leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {berita.judul}
                      </h3>
                      <p className="mt-3 text-sm text-muted-foreground line-clamp-3 leading-relaxed flex-1">
                        {berita.isi?.substring(0, 180)}...
                      </p>
                      <div className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all">
                        Baca selengkapnya <ArrowUpRight className="h-4 w-4" />
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          ) : (
            <div className="card-premium rounded-3xl p-14 text-center">
              <div className="inline-flex p-4 rounded-2xl bg-muted mb-4">
                <BookOpen className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <h3 className="font-display font-bold text-xl mb-2">Belum ada berita</h3>
              <p className="text-muted-foreground">Berita dan pengumuman akan ditampilkan di sini.</p>
            </div>
          )}
        </div>
      </section>

      {/* ============================================================= */}
      {/* GALERI SHOWCASE                                                 */}
      {/* ============================================================= */}
      {galeriData && galeriData.length > 0 && (
        <section className="relative py-20 md:py-28 bg-gradient-to-b from-transparent to-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
              <div className="max-w-xl">
                <div className="badge-premium mb-4">
                  <Camera className="h-3.5 w-3.5" /> Galeri Desa
                </div>
                <h2 className="font-display font-bold text-3xl md:text-5xl tracking-tight">
                  Momen terbaik <span className="text-gradient-aurora">dari desa</span>
                </h2>
                <p className="text-muted-foreground mt-3 text-base md:text-lg">
                  Dokumentasi kegiatan, acara, dan kehidupan warga dalam gambar.
                </p>
              </div>
              <Link to="/galeri">
                <Button variant="outline" className="rounded-full h-11 px-6 font-semibold border-border/80 hover:border-primary/50 hover:bg-primary/5">
                  Semua Galeri <ArrowUpRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Asymmetric grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-2 gap-3 md:gap-4 h-[420px] md:h-[560px]">
              {galeriData.slice(0, 6).map((item, idx) => {
                const classes = [
                  'col-span-2 row-span-2',
                  'col-span-1 row-span-1',
                  'col-span-1 row-span-1',
                  'col-span-1 row-span-1',
                  'col-span-1 row-span-1',
                  'col-span-2 row-span-1 md:col-span-2',
                ];
                return (
                  <Link
                    to="/galeri"
                    key={item.id}
                    className={`group relative rounded-2xl md:rounded-3xl overflow-hidden ${classes[idx] || ''} animate-fade-up`}
                    style={{ animationDelay: `${idx * 0.07}s` }}
                  >
                    <img
                      src={item.url_media}
                      alt={item.judul}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 p-4 md:p-5 flex flex-col justify-end">
                      <p className="text-white font-display font-semibold text-sm md:text-base line-clamp-2 drop-shadow">
                        {item.judul}
                      </p>
                      <div className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-white/80">
                        <CalendarIcon className="h-3 w-3" />
                        {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    <div className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all">
                      <ArrowUpRight className="h-4 w-4 text-primary" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ============================================================= */}
      {/* CONTACT / INFO DESA                                             */}
      {/* ============================================================= */}
      <section className="relative py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="badge-premium mb-4">
                <MapPin className="h-3.5 w-3.5" /> Kontak & Alamat
              </div>
              <h2 className="font-display font-bold text-3xl md:text-5xl tracking-tight leading-tight">
                Kunjungi kantor desa atau <span className="text-gradient">hubungi kami</span>
              </h2>
              <p className="text-muted-foreground mt-4 text-base md:text-lg max-w-lg">
                Tim pemerintah desa siap melayani kebutuhan warga. Datang langsung atau hubungi kami melalui kanal berikut.
              </p>

              <div className="mt-8 space-y-4">
                {infoDesaData?.alamat_kantor && (
                  <div className="flex items-start gap-4 p-4 rounded-2xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Alamat Kantor</p>
                      <p className="font-medium mt-0.5">{infoDesaData.alamat_kantor}</p>
                    </div>
                  </div>
                )}
                {infoDesaData?.telepon && (
                  <a href={`tel:${infoDesaData.telepon}`} className="flex items-start gap-4 p-4 rounded-2xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors">
                    <div className="h-11 w-11 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <Phone className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Telepon</p>
                      <p className="font-medium mt-0.5">{infoDesaData.telepon}</p>
                    </div>
                  </a>
                )}
                {infoDesaData?.email && (
                  <a href={`mailto:${infoDesaData.email}`} className="flex items-start gap-4 p-4 rounded-2xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors">
                    <div className="h-11 w-11 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Email</p>
                      <p className="font-medium mt-0.5">{infoDesaData.email}</p>
                    </div>
                  </a>
                )}
                {infoDesaData?.website && (
                  <a href={infoDesaData.website} target="_blank" rel="noreferrer" className="flex items-start gap-4 p-4 rounded-2xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors">
                    <div className="h-11 w-11 rounded-xl bg-fuchsia-500/10 flex items-center justify-center flex-shrink-0">
                      <Globe className="h-5 w-5 text-fuchsia-600" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Website</p>
                      <p className="font-medium mt-0.5 truncate">{infoDesaData.website}</p>
                    </div>
                  </a>
                )}
              </div>
            </div>

            {/* Info card cluster */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 to-accent/20 blur-3xl rounded-3xl" />
              <Card className="relative card-premium rounded-3xl border-0 overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative h-40 bg-gradient-to-br from-primary via-fuchsia-600 to-accent overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.3),transparent_60%)]" />
                    <div className="absolute inset-0 bg-grid opacity-20" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 flex items-center gap-4">
                      {infoDesaData?.logo_desa ? (
                        <img src={infoDesaData.logo_desa} alt="Logo" className="w-16 h-16 object-contain bg-white rounded-2xl p-2 ring-4 ring-white/50 shadow-xl" />
                      ) : (
                        <div className="w-16 h-16 flex items-center justify-center bg-white rounded-2xl shadow-xl">
                          <Building2 className="h-8 w-8 text-primary" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-display font-bold text-lg text-white">{infoDesaData?.nama_desa || 'Desa'}</h3>
                        <p className="text-xs text-white/85">{infoDesaData?.nama_kecamatan ? `Kec. ${infoDesaData.nama_kecamatan}` : ''}</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-border">
                    <div className="p-5">
                      <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Kode Desa</p>
                      <p className="font-display font-bold text-xl mt-1">{infoDesaData?.kode_desa || '-'}</p>
                    </div>
                    <div className="p-5">
                      <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Kode Pos</p>
                      <p className="font-display font-bold text-xl mt-1">{infoDesaData?.kode_pos || '-'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-border border-t border-border">
                    <div className="p-5">
                      <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Kecamatan</p>
                      <p className="font-semibold mt-1 truncate">{infoDesaData?.nama_kecamatan || '-'}</p>
                    </div>
                    <div className="p-5">
                      <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Kabupaten</p>
                      <p className="font-semibold mt-1 truncate">{infoDesaData?.nama_kabupaten || '-'}</p>
                    </div>
                  </div>
                  <div className="p-5 bg-muted/30 border-t border-border">
                    <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Provinsi</p>
                    <p className="font-semibold mt-1">{infoDesaData?.nama_provinsi || '-'}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default PublicHome;
