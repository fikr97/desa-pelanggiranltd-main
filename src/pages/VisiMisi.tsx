import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import PublicLayout from '@/components/PublicLayout';
import { Target, Eye, Calendar } from 'lucide-react';

const VisiMisi = () => {
  const { data: kontenVisiMisi, isLoading } = useQuery({
    queryKey: ['konten-visi-misi'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('konten_website')
        .select('*')
        .eq('jenis', 'visi_misi')
        .eq('status', 'published')
        .order('urutan', { ascending: true });
      
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
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-64 w-full" />
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
              Visi & Misi Desa
            </h1>
            <p className="text-lg text-gray-600">
              Komitmen dan arah pembangunan Desa Pelanggiran Laut Tador
            </p>
          </div>

          {kontenVisiMisi && kontenVisiMisi.length > 0 ? (
            <div className="space-y-8">
              {kontenVisiMisi.map((konten, index) => (
                <Card key={konten.id} className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                    <CardTitle className="text-2xl text-gray-900 flex items-center gap-2">
                      {konten.judul.toLowerCase().includes('visi') ? (
                        <Eye className="h-6 w-6 text-green-600" />
                      ) : (
                        <Target className="h-6 w-6 text-blue-600" />
                      )}
                      {konten.judul}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(konten.created_at).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {konten.gambar && (
                      <div className="mb-6">
                        <img 
                          src={konten.gambar} 
                          alt={konten.judul}
                          className="w-full h-64 object-cover rounded-lg shadow-md"
                        />
                      </div>
                    )}
                    <div className="prose prose-lg max-w-none">
                      <div 
                        className="text-gray-700 leading-relaxed whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: konten.konten.replace(/\n/g, '<br>') }}
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
                  <h3 className="text-xl font-semibold mb-2">Konten Belum Tersedia</h3>
                  <p>Informasi visi dan misi desa sedang dalam proses penyusunan.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PublicLayout>
  );
};

export default VisiMisi;