import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import PublicLayout from '@/components/PublicLayout';
import { Calendar, ArrowLeft, Share2 } from 'lucide-react';

const BeritaDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  
  const { data: berita, isLoading } = useQuery({
    queryKey: ['berita-detail', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('berita')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!slug
  });

  const { data: beritaLainnya } = useQuery({
    queryKey: ['berita-lainnya', berita?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('berita')
        .select('id, judul, slug, tanggal_publikasi, gambar')
        .eq('status', 'published')
        .neq('id', berita?.id)
        .order('tanggal_publikasi', { ascending: false })
        .limit(4);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!berita?.id
  });

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-64 w-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (!berita) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Berita Tidak Ditemukan</h1>
            <p className="text-gray-600 mb-6">Berita yang Anda cari tidak dapat ditemukan.</p>
            <Link to="/berita">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali ke Daftar Berita
              </Button>
            </Link>
          </div>
        </div>
      </PublicLayout>
    );
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: berita.judul,
        text: berita.isi.substring(0, 100),
        url: window.location.href,
      });
    } else {
      // Fallback: copy URL to clipboard
      navigator.clipboard.writeText(window.location.href);
      // You could show a toast here
    }
  };

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <div className="mb-6">
            <Link to="/berita">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali ke Berita
              </Button>
            </Link>
          </div>

          {/* Main Article */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  {new Date(berita.tanggal_publikasi).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{berita.status}</Badge>
                  <Button variant="outline" size="sm" onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Bagikan
                  </Button>
                </div>
              </div>
              <CardTitle className="text-3xl font-bold leading-tight">
                {berita.judul}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {berita.gambar && (
                <div className="mb-6">
                  <img 
                    src={berita.gambar} 
                    alt={berita.judul}
                    className="w-full h-64 md:h-96 object-cover rounded-lg shadow-md"
                  />
                </div>
              )}
              <div className="prose prose-lg max-w-none">
                <div 
                  className="text-gray-700 leading-relaxed whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: berita.isi.replace(/\n/g, '<br>') }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Related News */}
          {beritaLainnya && beritaLainnya.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Berita Lainnya</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {beritaLainnya.map((item) => (
                    <Link key={item.id} to={`/berita/${item.slug}`}>
                      <Card className="hover:shadow-md transition-shadow">
                        <div className="flex gap-4 p-4">
                          {item.gambar && (
                            <div className="w-20 h-20 flex-shrink-0">
                              <img 
                                src={item.gambar} 
                                alt={item.judul}
                                className="w-full h-full object-cover rounded"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm line-clamp-2 mb-2">
                              {item.judul}
                            </h4>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Calendar className="h-3 w-3" />
                              {new Date(item.tanggal_publikasi).toLocaleDateString('id-ID')}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PublicLayout>
  );
};

export default BeritaDetailPage;