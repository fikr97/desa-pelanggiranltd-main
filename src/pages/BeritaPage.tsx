import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import PublicLayout from '@/components/PublicLayout';
import {
  Calendar, Search, ArrowUpRight, Megaphone, BookOpen, Clock, Sparkles, Filter
} from 'lucide-react';
import { Link } from 'react-router-dom';

const BeritaPage = () => {
  const [search, setSearch] = useState('');

  const { data: beritaData, isLoading } = useQuery({
    queryKey: ['public-berita-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('berita')
        .select('*')
        .eq('status', 'published')
        .order('tanggal_publikasi', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  const filtered = useMemo(() => {
    if (!beritaData) return [];
    const q = search.trim().toLowerCase();
    if (!q) return beritaData;
    return beritaData.filter((b: any) =>
      b.judul?.toLowerCase().includes(q) ||
      b.isi?.toLowerCase().includes(q)
    );
  }, [beritaData, search]);

  const [featured, ...rest] = filtered || [];

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-60" />
        <div className="absolute inset-0 bg-grid mask-fade-radial opacity-20" />
        <div className="absolute top-20 -left-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl animate-blob" />
        <div className="absolute top-40 right-0 h-80 w-80 rounded-full bg-accent/20 blur-3xl animate-blob delay-2000" />

        <div className="container mx-auto px-4 pt-16 md:pt-20 pb-10 md:pb-14 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="badge-premium mb-4">
              <Megaphone className="h-3.5 w-3.5" /> Pusat Informasi
            </div>
            <h1 className="font-display font-bold text-4xl md:text-6xl tracking-tight leading-[1.05]">
              Berita &{' '}
              <span className="text-gradient">Pengumuman</span>
            </h1>
            <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Ikuti terus perkembangan dan kegiatan terbaru seputar desa. Semua informasi resmi dirangkum untuk Anda.
            </p>

            {/* Search */}
            <div className="mt-8 max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari berita atau pengumuman..."
                  className="input-modern h-14 pl-12 pr-5 rounded-full border-border/80 bg-background/80 backdrop-blur text-base shadow-lg"
                />
              </div>
              {search && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Menampilkan <span className="font-semibold text-foreground">{filtered.length}</span> hasil untuk "<span className="font-semibold text-foreground">{search}</span>"
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 pb-20">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[16/10] w-full rounded-3xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <>
            {/* Featured article */}
            {featured && !search && (
              <Link to={`/berita/${featured.slug}`} className="group block mb-12">
                <article className="card-premium rounded-3xl overflow-hidden grid md:grid-cols-2 gap-0">
                  <div className="relative aspect-[16/10] md:aspect-auto md:min-h-[380px] overflow-hidden bg-muted">
                    {featured.gambar ? (
                      <img
                        src={featured.gambar}
                        alt={featured.judul}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                        <BookOpen className="h-20 w-20 text-primary/30" />
                      </div>
                    )}
                    <span className="absolute top-5 left-5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur text-xs font-bold text-primary shadow">
                      <Sparkles className="h-3 w-3" /> Unggulan
                    </span>
                  </div>
                  <div className="p-8 md:p-10 flex flex-col justify-center">
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary mb-4">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(featured.tanggal_publikasi).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </div>
                    <h2 className="font-display font-bold text-2xl md:text-3xl lg:text-4xl leading-tight group-hover:text-primary transition-colors">
                      {featured.judul}
                    </h2>
                    <p className="mt-4 text-muted-foreground text-base leading-relaxed line-clamp-3">
                      {featured.isi?.substring(0, 280)}...
                    </p>
                    <div className="mt-6">
                      <Button className="btn-gradient btn-shine rounded-full h-11 px-6 font-semibold">
                        Baca Selengkapnya <ArrowUpRight className="ml-1.5 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </article>
              </Link>
            )}

            {/* Grid of articles */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-bold text-xl">
                {search ? 'Hasil Pencarian' : 'Berita Lainnya'}
              </h3>
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Filter className="h-4 w-4" /> {(search ? filtered : rest).length} artikel
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(search ? filtered : rest).map((berita: any, i: number) => (
                <Link key={berita.id} to={`/berita/${berita.slug}`} className="group">
                  <article className="card-premium rounded-3xl h-full flex flex-col overflow-hidden animate-fade-up"
                    style={{ animationDelay: `${i * 0.05}s` }}>
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
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur text-xs font-semibold text-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(berita.tanggal_publikasi).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
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
          </>
        ) : (
          <div className="card-premium rounded-3xl p-14 md:p-20 text-center">
            <div className="inline-flex p-4 rounded-2xl bg-muted mb-4">
              <BookOpen className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h3 className="font-display font-bold text-2xl mb-2">
              {search ? 'Tidak ditemukan' : 'Belum Ada Berita'}
            </h3>
            <p className="text-muted-foreground">
              {search ? 'Coba kata kunci lain atau lihat semua berita.' : 'Berita dan pengumuman akan ditampilkan di sini.'}
            </p>
            {search && (
              <Button onClick={() => setSearch('')} className="mt-5 rounded-full" variant="outline">
                Tampilkan semua
              </Button>
            )}
          </div>
        )}
      </section>
    </PublicLayout>
  );
};

export default BeritaPage;
