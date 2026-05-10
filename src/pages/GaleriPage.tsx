import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import PublicLayout from '@/components/PublicLayout';
import {
  Calendar, Image as ImageIcon, Play, X, Camera, Sparkles, Images, Video
} from 'lucide-react';

const GaleriPage = () => {
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'foto' | 'video'>('all');

  const { data: galeriData, isLoading } = useQuery({
    queryKey: ['public-galeri-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('galeri')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  const filtered = useMemo(() => {
    if (!galeriData) return [];
    if (filter === 'all') return galeriData;
    if (filter === 'video') return galeriData.filter((g: any) => g.tipe_media === 'video');
    return galeriData.filter((g: any) => g.tipe_media !== 'video');
  }, [galeriData, filter]);

  const fotoCount = galeriData?.filter((g: any) => g.tipe_media !== 'video').length || 0;
  const videoCount = galeriData?.filter((g: any) => g.tipe_media === 'video').length || 0;

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
              <Camera className="h-3.5 w-3.5" /> Dokumentasi Visual
            </div>
            <h1 className="font-display font-bold text-4xl md:text-6xl tracking-tight leading-[1.05]">
              Galeri <span className="text-gradient-aurora">Desa</span>
            </h1>
            <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Kumpulan momen, kegiatan, dan potensi desa dalam foto dan video. Setiap gambar menceritakan kisah kami.
            </p>

            {/* Tabs */}
            <div className="mt-8 inline-flex items-center gap-1 p-1.5 rounded-full glass border border-border/60 shadow-lg">
              {[
                { key: 'all', label: 'Semua', count: galeriData?.length || 0, icon: Sparkles },
                { key: 'foto', label: 'Foto', count: fotoCount, icon: Images },
                { key: 'video', label: 'Video', count: videoCount, icon: Video },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setFilter(t.key as any)}
                  className={`inline-flex items-center gap-2 px-4 md:px-5 h-10 rounded-full text-sm font-semibold transition-all ${
                    filter === t.key
                      ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <t.icon className="h-4 w-4" />
                  {t.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === t.key ? 'bg-white/25' : 'bg-muted'}`}>
                    {t.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="container mx-auto px-4 pb-20">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-2xl" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 [&>*]:mb-4">
            {filtered.map((item: any, i: number) => {
              // Vary heights to create masonry effect
              const heights = ['aspect-[3/4]', 'aspect-square', 'aspect-[4/5]', 'aspect-[3/4]', 'aspect-square', 'aspect-[4/3]'];
              const aspect = heights[i % heights.length];
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedMedia(item)}
                  className="group relative block w-full break-inside-avoid rounded-2xl overflow-hidden card-premium animate-fade-up"
                  style={{ animationDelay: `${(i % 8) * 0.04}s` }}
                >
                  <div className={`relative ${aspect} overflow-hidden`}>
                    {item.tipe_media === 'video' ? (
                      <div className="relative w-full h-full bg-[#0a0a14]">
                        <video src={item.url_media} className="w-full h-full object-cover" muted />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="h-14 w-14 rounded-full bg-white/95 backdrop-blur flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                            <Play className="h-6 w-6 text-primary ml-0.5" fill="currentColor" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={item.url_media}
                        alt={item.judul}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute top-3 right-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        item.tipe_media === 'video'
                          ? 'bg-rose-500 text-white'
                          : 'bg-white/90 text-foreground backdrop-blur'
                      }`}>
                        {item.tipe_media === 'video' ? <><Video className="h-3 w-3" /> Video</> : <><ImageIcon className="h-3 w-3" /> Foto</>}
                      </span>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                      <p className="text-white font-display font-semibold text-sm leading-tight line-clamp-2 drop-shadow">
                        {item.judul}
                      </p>
                      <div className="mt-1 text-xs text-white/80 flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        {new Date(item.created_at).toLocaleDateString('id-ID')}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="card-premium rounded-3xl p-14 md:p-20 text-center">
            <div className="inline-flex p-4 rounded-2xl bg-muted mb-4">
              <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h3 className="font-display font-bold text-2xl mb-2">Belum Ada Media</h3>
            <p className="text-muted-foreground">Foto dan video akan ditampilkan di sini.</p>
          </div>
        )}
      </section>

      {/* Lightbox */}
      <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
        <DialogContent className="max-w-5xl w-full p-0 overflow-hidden rounded-3xl border-0 bg-[#0a0a14]">
          <DialogTitle className="sr-only">{selectedMedia?.judul || 'Media'}</DialogTitle>
          {selectedMedia && (
            <div className="relative">
              <Button
                variant="outline"
                size="icon"
                className="absolute top-4 right-4 z-10 rounded-full bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur"
                onClick={() => setSelectedMedia(null)}
              >
                <X className="h-4 w-4" />
              </Button>

              {selectedMedia.tipe_media === 'video' ? (
                <video src={selectedMedia.url_media} controls autoPlay className="w-full max-h-[75vh] object-contain bg-black" />
              ) : (
                <img src={selectedMedia.url_media} alt={selectedMedia.judul} className="w-full max-h-[75vh] object-contain bg-black" />
              )}

              <div className="p-6 md:p-8 bg-gradient-to-r from-[#0a0a14] via-[#12122a] to-[#0a0a14] text-white">
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 backdrop-blur mb-3">
                  {selectedMedia.tipe_media === 'video' ? 'Video' : 'Foto'}
                </div>
                <h3 className="font-display font-bold text-xl md:text-2xl leading-tight">{selectedMedia.judul}</h3>
                {selectedMedia.deskripsi && (
                  <p className="mt-2 text-white/70 text-sm leading-relaxed">{selectedMedia.deskripsi}</p>
                )}
                <div className="mt-4 flex items-center gap-2 text-sm text-white/70">
                  <Calendar className="h-4 w-4" />
                  {new Date(selectedMedia.created_at).toLocaleDateString('id-ID', {
                    year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PublicLayout>
  );
};

export default GaleriPage;
