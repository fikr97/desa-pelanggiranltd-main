import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import PublicLayout from '@/components/PublicLayout';
import { Button } from '@/components/ui/button';
import {
  Building2, MapPin, Mail, Phone, Globe, Hash, Layers, Landmark,
  ArrowUpRight, Sparkles, ExternalLink, BookOpen, Target, Map
} from 'lucide-react';
import { Link } from 'react-router-dom';

const PublicProfilDesa = () => {
  const { data: infoDesaData } = useQuery({
    queryKey: ['public-info-desa'],
    queryFn: async () => {
      const { data, error } = await supabase.from('info_desa').select('*').single();
      if (error && error.code !== 'PGRST116') console.error(error);
      return data;
    }
  });

  const profileItems = [
    { label: 'Nama Desa', value: infoDesaData?.nama_desa, icon: Building2, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Kode Desa', value: infoDesaData?.kode_desa, icon: Hash, color: 'text-fuchsia-600', bg: 'bg-fuchsia-500/10' },
    { label: 'Kode Pos', value: infoDesaData?.kode_pos, icon: Hash, color: 'text-amber-600', bg: 'bg-amber-500/10' },
    { label: 'Kecamatan', value: infoDesaData?.nama_kecamatan, icon: Layers, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
    { label: 'Kabupaten', value: infoDesaData?.nama_kabupaten, icon: Landmark, color: 'text-cyan-600', bg: 'bg-cyan-500/10' },
    { label: 'Provinsi', value: infoDesaData?.nama_provinsi, icon: Map, color: 'text-rose-600', bg: 'bg-rose-500/10' },
  ];

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-60" />
        <div className="absolute inset-0 bg-grid mask-fade-radial opacity-20" />
        <div className="absolute top-20 -left-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl animate-blob" />
        <div className="absolute top-40 right-0 h-80 w-80 rounded-full bg-accent/20 blur-3xl animate-blob delay-2000" />

        <div className="container mx-auto px-4 pt-16 md:pt-20 pb-10 relative z-10">
          <div className="max-w-3xl">
            <div className="badge-premium mb-4">
              <Building2 className="h-3.5 w-3.5" /> Profil Lengkap
            </div>
            <h1 className="font-display font-bold text-4xl md:text-6xl tracking-tight leading-[1.05]">
              Profil{' '}
              <span className="text-gradient">{infoDesaData?.nama_desa || 'Desa'}</span>
            </h1>
            <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-2xl">
              Mengenal lebih dekat identitas, wilayah, dan informasi resmi {infoDesaData?.nama_desa || 'desa'} — sebagai dasar dari setiap layanan dan kegiatan yang dilakukan.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/sejarah">
                <Button className="btn-gradient btn-shine rounded-full h-11 px-6 font-semibold">
                  <BookOpen className="mr-2 h-4 w-4" /> Sejarah Desa
                </Button>
              </Link>
              <Link to="/visi-misi">
                <Button variant="outline" className="rounded-full h-11 px-6 font-semibold border-border hover:bg-primary/5 hover:border-primary/40">
                  <Target className="mr-2 h-4 w-4" /> Visi & Misi
                </Button>
              </Link>
              <Link to="/geografis">
                <Button variant="outline" className="rounded-full h-11 px-6 font-semibold border-border hover:bg-primary/5 hover:border-primary/40">
                  <Map className="mr-2 h-4 w-4" /> Kondisi Geografis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main */}
      <section className="container mx-auto px-4 pb-20">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Info Cards */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="font-display font-bold text-2xl md:text-3xl mb-6">Informasi Administratif</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {profileItems.map((item) => (
                  <div key={item.label} className="card-premium p-5 rounded-2xl flex items-start gap-4">
                    <div className={`h-12 w-12 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0`}>
                      <item.icon className={`h-6 w-6 ${item.color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">{item.label}</p>
                      <p className="font-display font-bold text-lg mt-0.5 truncate">{item.value || '-'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alamat */}
            <div className="card-premium rounded-3xl p-6 md:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
              <div className="flex items-start gap-4 relative">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center flex-shrink-0 shadow-lg">
                  <MapPin className="h-7 w-7" />
                </div>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wider font-semibold text-primary">Alamat Kantor Desa</p>
                  <p className="font-display font-bold text-xl md:text-2xl mt-1 leading-tight">
                    {infoDesaData?.alamat_kantor || 'Alamat belum tersedia'}
                  </p>
                  <p className="text-muted-foreground mt-2">
                    Kecamatan {infoDesaData?.nama_kecamatan || '-'}, {infoDesaData?.nama_kabupaten || '-'}, {infoDesaData?.nama_provinsi || '-'}
                    {infoDesaData?.kode_pos ? ` — ${infoDesaData.kode_pos}` : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Kontak */}
            <div>
              <h2 className="font-display font-bold text-2xl md:text-3xl mb-6">Kontak Resmi</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {infoDesaData?.telepon && (
                  <a href={`tel:${infoDesaData.telepon}`} className="card-premium p-5 rounded-2xl flex items-center gap-4 group">
                    <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <Phone className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Telepon</p>
                      <p className="font-semibold truncate">{infoDesaData.telepon}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                  </a>
                )}
                {infoDesaData?.email && (
                  <a href={`mailto:${infoDesaData.email}`} className="card-premium p-5 rounded-2xl flex items-center gap-4 group">
                    <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Email</p>
                      <p className="font-semibold truncate">{infoDesaData.email}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                  </a>
                )}
                {infoDesaData?.website && (
                  <a href={infoDesaData.website} target="_blank" rel="noreferrer" className="card-premium p-5 rounded-2xl flex items-center gap-4 group sm:col-span-2">
                    <div className="h-12 w-12 rounded-xl bg-fuchsia-500/10 flex items-center justify-center flex-shrink-0">
                      <Globe className="h-6 w-6 text-fuchsia-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Website</p>
                      <p className="font-semibold truncate">{infoDesaData.website}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar: Logo card */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 to-accent/20 blur-3xl rounded-3xl" />
              <div className="relative card-premium rounded-3xl overflow-hidden">
                <div className="relative aspect-square bg-gradient-to-br from-primary via-fuchsia-600 to-accent flex items-center justify-center p-10">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.3),transparent_60%)]" />
                  <div className="absolute inset-0 bg-grid opacity-15" />
                  {infoDesaData?.logo_desa ? (
                    <img src={infoDesaData.logo_desa} alt="Logo Desa" className="relative w-48 h-48 object-contain drop-shadow-2xl" />
                  ) : (
                    <Building2 className="relative h-32 w-32 text-white/80" />
                  )}
                </div>
                <div className="p-6 text-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
                    <Sparkles className="h-3 w-3" /> Identitas Resmi
                  </div>
                  <h3 className="font-display font-bold text-xl">{infoDesaData?.nama_desa || 'Nama Desa'}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {infoDesaData?.nama_kecamatan ? `Kec. ${infoDesaData.nama_kecamatan}` : ''}
                  </p>
                  <Link to="/pemerintahan" className="block mt-5">
                    <Button variant="outline" className="w-full rounded-full font-semibold hover:bg-primary/5 hover:border-primary/40">
                      Lihat Pemerintahan <ArrowUpRight className="ml-1.5 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default PublicProfilDesa;
