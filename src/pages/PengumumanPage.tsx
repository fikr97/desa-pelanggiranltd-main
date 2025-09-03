import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import PublicLayout from '@/components/PublicLayout';
import { Megaphone, Calendar, AlertCircle } from 'lucide-react';

const PengumumanPage = () => {
  const { data: pengumumanData, isLoading } = useQuery({
    queryKey: ['public-pengumuman'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('konten_website')
        .select('*')
        .eq('jenis', 'pengumuman')
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
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-4 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
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
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Pengumuman Desa
            </h1>
            <p className="text-lg text-gray-600">
              Pengumuman resmi dari Pemerintah Desa Pelanggiran Laut Tador
            </p>
          </div>

          {pengumumanData && pengumumanData.length > 0 ? (
            <div className="space-y-6">
              {pengumumanData.map((pengumuman, index) => (
                <Card key={pengumuman.id} className="border-l-4 border-l-orange-500">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-full">
                          <Megaphone className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <CardTitle className="text-xl text-gray-900">
                            {pengumuman.judul}
                          </CardTitle>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(pengumuman.created_at).toLocaleDateString('id-ID', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                      </div>
                      {index === 0 && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Terbaru
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {pengumuman.gambar && (
                      <div className="mb-4">
                        <img 
                          src={pengumuman.gambar} 
                          alt={pengumuman.judul}
                          className="w-full h-48 object-cover rounded-lg shadow-sm"
                        />
                      </div>
                    )}
                    <div className="prose prose-gray max-w-none">
                      <div 
                        className="text-gray-700 leading-relaxed whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: pengumuman.konten.replace(/\n/g, '<br>') }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <div className="text-gray-500">
                  <Megaphone className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-semibold mb-2">Belum Ada Pengumuman</h3>
                  <p>Pengumuman resmi dari desa akan ditampilkan di sini.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PublicLayout>
  );
};

export default PengumumanPage;