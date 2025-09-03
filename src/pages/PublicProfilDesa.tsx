
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, MapPin } from 'lucide-react';
import PublicLayout from '@/components/PublicLayout';

const PublicProfilDesa = () => {
  // Fetch info desa
  const { data: infoDesaData } = useQuery({
    queryKey: ['public-info-desa'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('info_desa')
        .select('*')
        .single();
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching info desa:', error);
      }
      return data;
    }
  });

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Profil Desa</h1>
          <p className="text-muted-foreground">Informasi lengkap tentang desa kami</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informasi Umum */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <span>Informasi Umum</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">Nama Desa</h3>
                  <p className="text-muted-foreground">{infoDesaData?.nama_desa || '-'}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Kode Desa</h3>
                  <p className="text-muted-foreground">{infoDesaData?.kode_desa || '-'}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Alamat Lengkap</h3>
                  <p className="text-muted-foreground">
                    {infoDesaData?.alamat_kantor || '-'}
                    <br />
                    Kecamatan {infoDesaData?.nama_kecamatan || '-'}
                    <br />
                    {infoDesaData?.nama_kabupaten || '-'}, {infoDesaData?.nama_provinsi || '-'}
                    <br />
                    Kode Pos: {infoDesaData?.kode_pos || '-'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Kontak */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>Kontak</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold">Telepon</h3>
                  <p className="text-muted-foreground">{infoDesaData?.telepon || '-'}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Email</h3>
                  <p className="text-muted-foreground">{infoDesaData?.email || '-'}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Website</h3>
                  {infoDesaData?.website ? (
                    <a 
                      href={infoDesaData.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {infoDesaData.website}
                    </a>
                  ) : (
                    <p className="text-muted-foreground">-</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Logo Desa</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                {infoDesaData?.logo_desa ? (
                  <img 
                    src={infoDesaData.logo_desa} 
                    alt="Logo Desa" 
                    className="w-32 h-32 mx-auto object-contain bg-gray-50 rounded-lg p-4" 
                  />
                ) : (
                  <div className="w-32 h-32 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                    <Building2 className="h-16 w-16 text-gray-400" />
                  </div>
                )}
                <h3 className="font-semibold mt-4">{infoDesaData?.nama_desa || 'Nama Desa'}</h3>
                <p className="text-sm text-muted-foreground">
                  {infoDesaData?.nama_kecamatan ? `Kec. ${infoDesaData.nama_kecamatan}` : ''}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default PublicProfilDesa;
