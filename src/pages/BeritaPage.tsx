import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import PublicLayout from '@/components/PublicLayout';
import { Calendar, User, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

const BeritaPage = () => {
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

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-10 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
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
              Berita & Pengumuman
            </h1>
            <p className="text-lg text-gray-600">
              Informasi terkini seputar kegiatan dan perkembangan desa
            </p>
          </div>

          {beritaData && beritaData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {beritaData.map((berita) => (
                <Card key={berita.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {berita.gambar && (
                    <div className="aspect-video w-full overflow-hidden">
                      <img 
                        src={berita.gambar} 
                        alt={berita.judul}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(berita.tanggal_publikasi).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    <CardTitle className="text-lg leading-tight line-clamp-2">
                      {berita.judul}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                      {berita.isi.substring(0, 150)}...
                    </p>
                    <div className="flex justify-between items-center">
                      <Badge variant="outline">{berita.status}</Badge>
                      <Link 
                        to={`/berita/${berita.slug}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        Baca Selengkapnya
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <div className="text-gray-500">
                  <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-semibold mb-2">Belum Ada Berita</h3>
                  <p>Berita dan pengumuman akan ditampilkan di sini.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PublicLayout>
  );
};

export default BeritaPage;