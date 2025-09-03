import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import PublicLayout from '@/components/PublicLayout';
import { Calendar, Image as ImageIcon, Play, X } from 'lucide-react';

const GaleriPage = () => {
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  
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

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-10 w-64" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Skeleton key={i} className="aspect-square w-full" />
              ))}
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Galeri Foto & Video
            </h1>
            <p className="text-lg text-gray-600">
              Dokumentasi kegiatan dan potensi Desa Pelanggiran Laut Tador
            </p>
          </div>

          {galeriData && galeriData.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {galeriData.map((item) => (
                <Card 
                  key={item.id} 
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
                  onClick={() => setSelectedMedia(item)}
                >
                  <div className="aspect-square relative overflow-hidden">
                    {item.tipe_media === 'video' ? (
                      <div className="relative w-full h-full bg-gray-900">
                        <video 
                          src={item.url_media}
                          className="w-full h-full object-cover"
                          muted
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Play className="h-12 w-12 text-white" />
                        </div>
                      </div>
                    ) : (
                      <img 
                        src={item.url_media} 
                        alt={item.judul}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge variant={item.tipe_media === 'video' ? 'default' : 'secondary'}>
                        {item.tipe_media === 'video' ? 'Video' : 'Foto'}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm line-clamp-2 mb-1">
                      {item.judul}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      {new Date(item.created_at).toLocaleDateString('id-ID')}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <div className="text-gray-500">
                  <ImageIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-semibold mb-2">Belum Ada Media</h3>
                  <p>Foto dan video akan ditampilkan di sini.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Media Modal */}
      <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
        <DialogContent className="max-w-4xl w-full p-0">
          <DialogTitle className="sr-only">
            {selectedMedia?.judul || 'Media'}
          </DialogTitle>
          {selectedMedia && (
            <div className="relative">
              <Button
                variant="outline"
                size="icon"
                className="absolute top-2 right-2 z-10"
                onClick={() => setSelectedMedia(null)}
              >
                <X className="h-4 w-4" />
              </Button>
              
              {selectedMedia.tipe_media === 'video' ? (
                <video 
                  src={selectedMedia.url_media}
                  controls
                  className="w-full max-h-[80vh] object-contain"
                  autoPlay
                />
              ) : (
                <img 
                  src={selectedMedia.url_media} 
                  alt={selectedMedia.judul}
                  className="w-full max-h-[80vh] object-contain"
                />
              )}
              
              <div className="p-4 bg-white">
                <h3 className="font-semibold text-lg mb-2">{selectedMedia.judul}</h3>
                {selectedMedia.deskripsi && (
                  <p className="text-gray-600 mb-2">{selectedMedia.deskripsi}</p>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  {new Date(selectedMedia.created_at).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                  <Badge variant="outline" className="ml-auto">
                    {selectedMedia.tipe_media}
                  </Badge>
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