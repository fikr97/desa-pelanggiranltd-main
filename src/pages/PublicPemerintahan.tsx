import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import PublicLayout from '@/components/PublicLayout';
import { Badge } from '@/components/ui/badge';
import {
  Users, User, Award, Sparkles, Crown, ShieldCheck, Star
} from 'lucide-react';

const PublicPemerintahan = () => {
  const { data: perangkatDesaData, isLoading } = useQuery({
    queryKey: ['public-perangkat-desa'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('perangkat_desa')
        .select('*')
        .eq('status', 'Aktif')
        .order('urutan_display', { ascending: true });
      if (error) { console.error(error); return []; }
      return data || [];
    }
  });

  const kepalaDesaData = perangkatDesaData?.find((p: any) =>
    p.jabatan.toLowerCase().includes('kepala desa') ||
    p.jabatan.toLowerCase().includes('lurah')
  );

  const perangkatLainnya = perangkatDesaData?.filter((p: any) =>
    !p.jabatan.toLowerCase().includes('kepala desa') &&
    !p.jabatan.toLowerCase().includes('lurah')
  ) || [];

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-60" />
        <div className="absolute inset-0 bg-grid mask-fade-radial opacity-20" />
        <div className="absolute top-20 -left-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl animate-blob" />
        <div className="absolute top-40 right-0 h-80 w-80 rounded-full bg-accent/20 blur-3xl animate-blob delay-2000" />

        <div className="container mx-auto px-4 pt-16 md:pt-20 pb-10 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="badge-premium mb-4">
              <ShieldCheck className="h-3.5 w-3.5" /> Struktur Organisasi
            </div>
            <h1 className="font-display font-bold text-4xl md:text-6xl tracking-tight leading-[1.05]">
              Pemerintahan{' '}
              <span className="text-gradient">Desa</span>
            </h1>
            <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Mengenal para pelayan masyarakat yang menjalankan roda pemerintahan desa dengan penuh dedikasi dan integritas.
            </p>
          </div>
        </div>
      </section>

      {/* Kepala Desa Spotlight */}
      {kepalaDesaData && (
        <section className="container mx-auto px-4 pb-16">
          <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-primary via-fuchsia-600 to-accent text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.2),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.15),transparent_50%)]" />
            <div className="absolute top-0 right-0 h-80 w-80 rounded-full bg-white/10 blur-3xl animate-float" />

            <div className="relative grid md:grid-cols-2 gap-8 md:gap-10 p-8 md:p-14 items-center">
              {/* Foto */}
              <div className="relative flex justify-center md:justify-start order-2 md:order-1">
                <div className="relative">
                  <div className="absolute -inset-4 bg-white/20 blur-2xl rounded-full" />
                  <div className="relative aspect-square w-60 md:w-80 rounded-[2rem] overflow-hidden ring-4 ring-white/40 shadow-2xl bg-white/10">
                    {kepalaDesaData.foto ? (
                      <img src={kepalaDesaData.foto} alt={kepalaDesaData.nama} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="h-28 w-28 text-white/60" />
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-4 -right-4 bg-white text-foreground rounded-2xl px-4 py-3 shadow-xl flex items-center gap-2.5">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white">
                      <Crown className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Pemimpin</div>
                      <div className="text-sm font-bold">Desa</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="order-1 md:order-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-semibold tracking-wider uppercase mb-4">
                  <Award className="h-3.5 w-3.5" /> {kepalaDesaData.jabatan}
                </div>
                <h2 className="font-display font-bold text-3xl md:text-5xl leading-tight">
                  {kepalaDesaData.nama}
                </h2>
                {kepalaDesaData.nip && (
                  <p className="text-white/70 mt-2 text-sm">NIP: {kepalaDesaData.nip}</p>
                )}
                <p className="text-white/85 mt-5 text-base md:text-lg leading-relaxed max-w-xl">
                  Mengemban amanah memimpin desa menuju kemajuan dan kesejahteraan seluruh warga — dengan pelayanan terbaik dan tata kelola yang transparan.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur text-xs font-semibold">
                    <Star className="h-3.5 w-3.5" /> Aktif Menjabat
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur text-xs font-semibold">
                    <ShieldCheck className="h-3.5 w-3.5" /> Terverifikasi
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Perangkat Desa */}
      <section className="container mx-auto px-4 pb-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="badge-premium mb-3">
              <Users className="h-3.5 w-3.5" /> Perangkat Desa
            </div>
            <h2 className="font-display font-bold text-3xl md:text-4xl tracking-tight">
              Tim <span className="text-gradient">pelayan masyarakat</span>
            </h2>
            <p className="text-muted-foreground mt-2">
              {perangkatLainnya.length > 0
                ? `${perangkatLainnya.length} perangkat desa aktif melayani warga`
                : 'Perangkat desa akan ditampilkan di sini'}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="card-premium rounded-3xl aspect-[3/4] animate-shimmer" />
            ))}
          </div>
        ) : perangkatLainnya.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {perangkatLainnya.map((p: any, i: number) => (
              <div
                key={p.id}
                className="card-premium rounded-3xl overflow-hidden group animate-fade-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10">
                  {p.foto ? (
                    <img
                      src={p.foto}
                      alt={p.nama}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="h-20 w-20 text-primary/30" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="p-5 text-center">
                  <h4 className="font-display font-bold text-base leading-snug line-clamp-1">{p.nama}</h4>
                  <Badge variant="outline" className="mt-2 font-semibold text-[11px] border-primary/30 text-primary bg-primary/5 rounded-full">
                    {p.jabatan}
                  </Badge>
                  {p.nip && (
                    <p className="text-[11px] text-muted-foreground mt-2 truncate">NIP: {p.nip}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card-premium rounded-3xl p-14 text-center">
            <div className="inline-flex p-4 rounded-2xl bg-muted mb-4">
              <Users className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h3 className="font-display font-bold text-xl mb-2">Belum Ada Data Perangkat</h3>
            <p className="text-muted-foreground">Data perangkat desa akan ditampilkan di sini.</p>
          </div>
        )}
      </section>
    </PublicLayout>
  );
};

export default PublicPemerintahan;
