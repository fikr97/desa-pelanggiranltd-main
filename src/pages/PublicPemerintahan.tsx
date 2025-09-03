
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, User } from 'lucide-react';
import PublicLayout from '@/components/PublicLayout';

const PublicPemerintahan = () => {
  // Fetch perangkat desa
  const { data: perangkatDesaData } = useQuery({
    queryKey: ['public-perangkat-desa'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('perangkat_desa')
        .select('*')
        .eq('status', 'Aktif')
        .order('urutan_display', { ascending: true });
      if (error) {
        console.error('Error fetching perangkat desa:', error);
        return [];
      }
      return data || [];
    }
  });

  // Group perangkat by hierarchy
  const kepalaDesaData = perangkatDesaData?.find(p => 
    p.jabatan.toLowerCase().includes('kepala desa') || 
    p.jabatan.toLowerCase().includes('lurah')
  );

  const perangkatLainnya = perangkatDesaData?.filter(p => 
    !p.jabatan.toLowerCase().includes('kepala desa') && 
    !p.jabatan.toLowerCase().includes('lurah')
  ) || [];

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Pemerintahan Desa</h1>
          <p className="text-muted-foreground">Struktur organisasi dan perangkat desa</p>
        </div>

        {/* Kepala Desa */}
        {kepalaDesaData && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Kepala Desa</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
                <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {kepalaDesaData.foto ? (
                    <img 
                      src={kepalaDesaData.foto} 
                      alt={kepalaDesaData.nama}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <User className="h-16 w-16 text-gray-400" />
                  )}
                </div>
                <div className="text-center md:text-left">
                  <h3 className="text-2xl font-bold mb-2">{kepalaDesaData.nama}</h3>
                  <Badge variant="default" className="mb-2">{kepalaDesaData.jabatan}</Badge>
                  {kepalaDesaData.nip && (
                    <p className="text-sm text-muted-foreground">NIP: {kepalaDesaData.nip}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Perangkat Desa Lainnya */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Perangkat Desa</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {perangkatLainnya.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {perangkatLainnya.map((perangkat) => (
                  <div key={perangkat.id} className="text-center">
                    <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      {perangkat.foto ? (
                        <img 
                          src={perangkat.foto} 
                          alt={perangkat.nama}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <User className="h-12 w-12 text-gray-400" />
                      )}
                    </div>
                    <h4 className="font-semibold mb-1">{perangkat.nama}</h4>
                    <Badge variant="outline" className="text-xs mb-1">
                      {perangkat.jabatan}
                    </Badge>
                    {perangkat.nip && (
                      <p className="text-xs text-muted-foreground">NIP: {perangkat.nip}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Belum ada data perangkat desa
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
};

export default PublicPemerintahan;
