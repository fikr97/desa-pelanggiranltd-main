import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import PublicLayout from '@/components/PublicLayout';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';

const AgendaPage = () => {
  const { data: agendaData, isLoading } = useQuery({
    queryKey: ['public-agenda'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('konten_website')
        .select('*')
        .eq('jenis', 'agenda')
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-4 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  // Function to determine if an event is upcoming, ongoing, or past
  const getEventStatus = (eventDate: string) => {
    const today = new Date();
    const event = new Date(eventDate);
    
    if (event.toDateString() === today.toDateString()) {
      return { status: 'ongoing', label: 'Hari Ini', variant: 'default' };
    } else if (event > today) {
      return { status: 'upcoming', label: 'Akan Datang', variant: 'secondary' };
    } else {
      return { status: 'past', label: 'Selesai', variant: 'outline' };
    }
  };

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Agenda Kegiatan Desa
            </h1>
            <p className="text-lg text-gray-600">
              Jadwal kegiatan dan acara yang akan berlangsung di desa
            </p>
          </div>

          {agendaData && agendaData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agendaData.map((agenda) => {
                const eventStatus = getEventStatus(agenda.created_at);
                
                return (
                  <Card key={agenda.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-blue-600" />
                          <div>
                            <CardTitle className="text-lg leading-tight">
                              {agenda.judul}
                            </CardTitle>
                          </div>
                        </div>
                        <Badge variant={eventStatus.variant as any}>
                          {eventStatus.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(agenda.created_at).toLocaleDateString('id-ID', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {agenda.gambar && (
                        <div className="mb-4">
                          <img 
                            src={agenda.gambar} 
                            alt={agenda.judul}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        </div>
                      )}
                      <div className="space-y-3">
                        <p className="text-gray-700 text-sm line-clamp-3">
                          {agenda.konten}
                        </p>
                        
                        {/* Additional event details could be parsed from content or stored separately */}
                        <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Informasi lengkap dalam konten</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <div className="text-gray-500">
                  <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-semibold mb-2">Belum Ada Agenda</h3>
                  <p>Agenda kegiatan desa akan ditampilkan di sini.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PublicLayout>
  );
};

export default AgendaPage;