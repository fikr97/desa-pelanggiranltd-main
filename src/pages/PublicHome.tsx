import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, MapPin, Phone, Mail, Globe, Users, Calendar as CalendarIcon, Image, 
         TrendingUp, Award, Heart, Eye, Star, Clock, FileText, Camera } from 'lucide-react';
import { Link } from 'react-router-dom';
import PublicLayout from '@/components/PublicLayout';
import { Calendar } from "@/components/ui/calendar"

const PublicHome = () => {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

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

  // Fetch berita terbaru
  const { data: beritaData } = useQuery({
    queryKey: ['public-berita'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('berita')
        .select('*')
        .eq('status', 'published')
        .order('tanggal_publikasi', { ascending: false })
        .limit(3);
      if (error) {
        console.error('Error fetching berita:', error);
        return [];
      }
      return data || [];
    }
  });

  // Fetch galeri
  const { data: galeriData } = useQuery({
    queryKey: ['public-galeri'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('galeri')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(6);
      if (error) {
        console.error('Error fetching galeri:', error);
        return [];
      }
      return data || [];
    }
  });

  // Fetch kepala desa dari perangkat desa
  const { data: kepalaDesaData } = useQuery({
    queryKey: ['public-kepala-desa'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('perangkat_desa')
        .select('*')
        .eq('status', 'Aktif')
        .ilike('jabatan', '%kepala desa%')
        .single();
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching kepala desa:', error);
      }
      return data;
    }
  });

  // Fetch statistik penduduk menggunakan secure function
  const { data: statistikData } = useQuery({
    queryKey: ['public-statistik'],
    queryFn: async () => {
      try {
        console.log('Fetching population statistics using secure function...');
        
        // Use the secure function instead of direct database access
        const { data, error } = await supabase.rpc('get_public_population_stats');

        if (error) {
          console.error('Error fetching statistics from secure function:', error);
          throw error;
        }

        if (data) {
          console.log('Statistics received from secure function:', data);
          
          // Type cast the data to the expected structure
          const stats = data as { total: number; laki: number; perempuan: number; kk: number };
          
          return {
            total: stats.total || 0,
            laki: stats.laki || 0,
            perempuan: stats.perempuan || 0,
            kk: stats.kk || 0
          };
        } else {
          return { total: 0, laki: 0, perempuan: 0, kk: 0 };
        }
      } catch (error) {
        console.error('Error fetching statistics:', error);
        return { total: 0, laki: 0, perempuan: 0, kk: 0 };
      }
    }
  });

  return (
    <PublicLayout>
      {/* Enhanced Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-accent text-primary-foreground">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,hsl(var(--primary-glow))_0%,transparent_50%)] animate-pulse"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,hsl(var(--accent))_0%,transparent_50%)] animate-pulse delay-1000"></div>
        </div>
        
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8 flex-1">
              {infoDesaData?.logo_desa ? (
                <div className="relative">
                  <div className="absolute inset-0 bg-primary-foreground/20 rounded-full blur-xl animate-pulse"></div>
                  <img 
                    src={infoDesaData.logo_desa} 
                    alt="Logo Desa" 
                    className="relative w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-2xl" 
                  />
                </div>
              ) : (
                <div className="relative w-24 h-24 md:w-32 md:h-32 flex items-center justify-center bg-primary-foreground/10 rounded-full backdrop-blur-sm">
                  <Building2 className="h-12 w-12 md:h-16 md:w-16 text-primary-foreground" />
                </div>
              )}
              <div className="text-center md:text-left">
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 leading-tight">
                  <span className="bg-gradient-to-r from-primary-foreground to-primary-foreground/80 bg-clip-text text-transparent">
                    {infoDesaData?.nama_desa || 'Nama Desa'}
                  </span>
                </h1>
                <p className="text-xl md:text-2xl opacity-90 mb-2">
                  {infoDesaData?.nama_kecamatan ? `${infoDesaData.nama_kecamatan}` : 'Kecamatan'}
                </p>
                <p className="text-lg opacity-80">
                  {infoDesaData?.nama_kabupaten ? `${infoDesaData.nama_kabupaten}, ${infoDesaData.nama_provinsi}` : 'Kabupaten, Provinsi'}
                </p>
                <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-4">
                  <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30">
                    <MapPin className="h-3 w-3 mr-1" />
                    Kode Desa: {infoDesaData?.kode_desa || '-'}
                  </Badge>
                  <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30">
                    <Building2 className="h-3 w-3 mr-1" />
                    Kode Pos: {infoDesaData?.kode_pos || '-'}
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* Statistics Cards in Hero */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-1 lg:gap-6">
              <div className="glass p-6 rounded-xl text-center transform hover:scale-105 transition-all duration-300">
                <Users className="h-8 w-8 mx-auto mb-2 text-accent" />
                <div className="text-2xl font-bold">{statistikData?.total || 0}</div>
                <div className="text-sm opacity-80">Total Penduduk</div>
              </div>
              <div className="glass p-6 rounded-xl text-center transform hover:scale-105 transition-all duration-300">
                <Building2 className="h-8 w-8 mx-auto mb-2 text-accent" />
                <div className="text-2xl font-bold">{statistikData?.kk || 0}</div>
                <div className="text-sm opacity-80">Kepala Keluarga</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Animated Wave */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
          <svg className="relative block w-full h-12" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path 
              d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z" 
              fill="hsl(var(--background))"
              className="animate-pulse"
            />
          </svg>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Enhanced Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 -mt-16">
          <Card className="card-elegant transform hover:scale-105 transition-all duration-300 border-0">
            <CardContent className="p-6 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-full -translate-y-2 translate-x-2"></div>
              <MapPin className="h-10 w-10 text-primary mx-auto mb-4 relative z-10" />
              <h3 className="font-bold text-lg mb-2">Alamat Kantor</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {infoDesaData?.alamat_kantor || 'Alamat belum tersedia'}
              </p>
              <div className="mt-4 p-2 bg-primary/5 rounded-lg">
                <Badge variant="outline" className="text-xs">Kantor Desa</Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-elegant transform hover:scale-105 transition-all duration-300 border-0">
            <CardContent className="p-6 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full -translate-y-2 translate-x-2"></div>
              <Phone className="h-10 w-10 text-emerald-600 mx-auto mb-4 relative z-10" />
              <h3 className="font-bold text-lg mb-2">Kontak Resmi</h3>
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {infoDesaData?.telepon || 'Telepon belum tersedia'}
                </p>
                {infoDesaData?.email && (
                  <p className="text-xs text-muted-foreground">
                    {infoDesaData.email}
                  </p>
                )}
              </div>
              <div className="mt-4 p-2 bg-emerald-50 rounded-lg">
                <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-700">24/7 Service</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elegant transform hover:scale-105 transition-all duration-300 border-0">
            <CardContent className="p-6 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-full -translate-y-2 translate-x-2"></div>
              <Award className="h-10 w-10 text-purple-600 mx-auto mb-4 relative z-10" />
              <h3 className="font-bold text-lg mb-2">Kepala Desa</h3>
              <p className="text-sm font-semibold mb-1">
                {kepalaDesaData?.nama || infoDesaData?.nama_kepala_desa || 'Belum tersedia'}
              </p>
              {kepalaDesaData?.nip && (
                <p className="text-xs text-muted-foreground mb-2">
                  NIP: {kepalaDesaData.nip}
                </p>
              )}
              <div className="mt-4 p-2 bg-purple-50 rounded-lg">
                <Badge variant="outline" className="text-xs border-purple-200 text-purple-700">Pemimpin</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elegant transform hover:scale-105 transition-all duration-300 border-0">
            <CardContent className="p-6 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full -translate-y-2 translate-x-2"></div>
              <TrendingUp className="h-10 w-10 text-blue-600 mx-auto mb-4 relative z-10" />
              <h3 className="font-bold text-lg mb-2">Statistik Desa</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-blue-50 p-2 rounded">
                  <div className="font-bold text-blue-600">{statistikData?.laki || 0}</div>
                  <div className="text-blue-500">Laki-laki</div>
                </div>
                <div className="bg-pink-50 p-2 rounded">
                  <div className="font-bold text-pink-600">{statistikData?.perempuan || 0}</div>
                  <div className="text-pink-500">Perempuan</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Enhanced Berita Terbaru */}
          <div className="lg:col-span-2">
            <Card className="card-elegant border-0 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <span className="text-xl font-bold">Berita & Pengumuman</span>
                      <p className="text-sm text-muted-foreground font-normal">Informasi terkini dari desa</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    <Clock className="h-3 w-3 mr-1" />
                    Terbaru
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {beritaData && beritaData.length > 0 ? (
                  <div className="space-y-0">
                    {beritaData.map((berita, index) => (
                      <div key={berita.id} className={`p-6 hover:bg-muted/50 transition-all duration-300 ${index < beritaData.length - 1 ? 'border-b' : ''}`}>
                        <div className="flex flex-col lg:flex-row gap-4">
                          {berita.gambar && (
                            <div className="lg:w-48 lg:flex-shrink-0">
                              <img 
                                src={berita.gambar} 
                                alt={berita.judul}
                                className="w-full h-32 lg:h-24 object-cover rounded-lg shadow-md"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg mb-2 line-clamp-2 hover:text-primary transition-colors">
                              {berita.judul}
                            </h3>
                            <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                              {berita.isi.substring(0, 200)}...
                            </p>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  <CalendarIcon className="h-3 w-3 mr-1" />
                                  {new Date(berita.tanggal_publikasi).toLocaleDateString('id-ID')}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  <Eye className="h-3 w-3 mr-1" />
                                  Hot
                                </Badge>
                              </div>
                              <Link to={`/berita/${berita.slug}`}>
                                <Button variant="ghost" size="sm" className="button-elegant text-xs px-4">
                                  Baca Selengkapnya →
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <FileText className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground text-lg mb-2">Belum ada berita</p>
                    <p className="text-muted-foreground/60 text-sm">Pantau terus untuk informasi terbaru</p>
                  </div>
                )}
                <div className="p-6 bg-muted/30 border-t">
                  <Link to="/berita">
                    <Button className="w-full button-elegant" size="lg">
                      <FileText className="h-4 w-4 mr-2" />
                      Lihat Semua Berita & Pengumuman
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Sidebar */}
          <div className="space-y-8">
            {/* Featured Galeri */}
            <Card className="card-elegant border-0 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-accent/5 to-primary/5 border-b">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-accent/10 rounded-lg">
                      <Camera className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <span className="font-bold">Galeri Desa</span>
                      <p className="text-sm text-muted-foreground font-normal">Dokumentasi kegiatan</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-accent/10 text-accent">
                    <Star className="h-3 w-3 mr-1" />
                    Terpilih
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {galeriData && galeriData.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {galeriData.slice(0, 4).map((item, index) => (
                        <div key={item.id} className="group relative overflow-hidden rounded-lg aspect-square">
                          <img 
                            src={item.url_media} 
                            alt={item.judul}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="absolute bottom-2 left-2 right-2">
                              <p className="text-white text-xs font-medium line-clamp-2">{item.judul}</p>
                            </div>
                          </div>
                          {index === 0 && (
                            <div className="absolute top-2 right-2">
                              <Badge className="bg-accent text-accent-foreground text-xs">
                                <Heart className="h-3 w-3 mr-1" />
                                Popular
                              </Badge>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <Link to="/galeri">
                      <Button className="w-full button-elegant">
                        <Image className="h-4 w-4 mr-2" />
                        Jelajahi Semua Foto
                      </Button>
                    </Link>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Camera className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">Belum ada foto dalam galeri</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enhanced Navigation Menu */}
            <Card className="card-elegant border-0 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <span className="font-bold">Navigasi Cepat</span>
                    <p className="text-sm text-muted-foreground font-normal">Akses informasi desa</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <Link to="/profil-desa">
                    <Button variant="ghost" className="w-full justify-start hover:bg-primary/5 hover:text-primary transition-all duration-200 group">
                      <Building2 className="h-4 w-4 mr-3 group-hover:scale-110 transition-transform" />
                      <div className="text-left">
                        <div className="font-medium">Profil Desa</div>
                        <div className="text-xs text-muted-foreground">Sejarah & visi misi</div>
                      </div>
                    </Button>
                  </Link>
                  <Link to="/pemerintahan">
                    <Button variant="ghost" className="w-full justify-start hover:bg-accent/5 hover:text-accent transition-all duration-200 group">
                      <Users className="h-4 w-4 mr-3 group-hover:scale-110 transition-transform" />
                      <div className="text-left">
                        <div className="font-medium">Pemerintahan Desa</div>
                        <div className="text-xs text-muted-foreground">Struktur organisasi</div>
                      </div>
                    </Button>
                  </Link>
                  <Link to="/berita">
                    <Button variant="ghost" className="w-full justify-start hover:bg-emerald-500/5 hover:text-emerald-600 transition-all duration-200 group">
                      <FileText className="h-4 w-4 mr-3 group-hover:scale-110 transition-transform" />
                      <div className="text-left">
                        <div className="font-medium">Berita Terkini</div>
                        <div className="text-xs text-muted-foreground">Info & pengumuman</div>
                      </div>
                    </Button>
                  </Link>
                  <Link to="/galeri">
                    <Button variant="ghost" className="w-full justify-start hover:bg-purple-500/5 hover:text-purple-600 transition-all duration-200 group">
                      <Camera className="h-4 w-4 mr-3 group-hover:scale-110 transition-transform" />
                      <div className="text-left">
                        <div className="font-medium">Galeri Kegiatan</div>
                        <div className="text-xs text-muted-foreground">Dokumentasi foto</div>
                      </div>
                    </Button>
                  </Link>
                  {infoDesaData?.website && (
                    <a href={infoDesaData.website} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" className="w-full justify-start hover:bg-blue-500/5 hover:text-blue-600 transition-all duration-200 group">
                        <Globe className="h-4 w-4 mr-3 group-hover:scale-110 transition-transform" />
                        <div className="text-left">
                          <div className="font-medium">Website Resmi</div>
                          <div className="text-xs text-muted-foreground">Link eksternal</div>
                        </div>
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Modern Calendar */}
            <Card className="card-elegant border-0 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <span className="font-bold">Kalender</span>
                    <p className="text-sm text-muted-foreground font-normal">Hari ini: {new Date().toLocaleDateString('id-ID')}</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-lg border-0 shadow-sm bg-muted/20"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Enhanced Footer */}
      <footer className="relative bg-gradient-to-r from-muted via-muted/90 to-muted mt-20 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,hsl(var(--primary))_0%,transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,hsl(var(--accent))_0%,transparent_50%)]"></div>
        </div>
        
        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Kontak Section */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                {infoDesaData?.logo_desa ? (
                  <img 
                    src={infoDesaData.logo_desa} 
                    alt="Logo Desa" 
                    className="w-12 h-12 object-contain" 
                  />
                ) : (
                  <div className="w-12 h-12 flex items-center justify-center bg-primary/10 rounded-lg">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-xl text-foreground">{infoDesaData?.nama_desa || 'Nama Desa'}</h3>
                  <p className="text-muted-foreground text-sm">Sistem Informasi Desa</p>
                </div>
              </div>
              
              <h4 className="font-semibold text-lg mb-4 text-foreground">Kontak Kami</h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-3 p-3 bg-card rounded-lg">
                  <MapPin className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Alamat Kantor</p>
                    <p className="text-muted-foreground">{infoDesaData?.alamat_kantor || 'Alamat belum tersedia'}</p>
                  </div>
                </div>
                {infoDesaData?.telepon && (
                  <div className="flex items-center space-x-3 p-3 bg-card rounded-lg">
                    <Phone className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">Telepon</p>
                      <p className="text-muted-foreground">{infoDesaData.telepon}</p>
                    </div>
                  </div>
                )}
                {infoDesaData?.email && (
                  <div className="flex items-center space-x-3 p-3 bg-card rounded-lg">
                    <Mail className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">Email</p>
                      <p className="text-muted-foreground">{infoDesaData.email}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Info Desa Section */}
            <div>
              <h4 className="font-semibold text-lg mb-4 text-foreground">Informasi Desa</h4>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-card rounded-lg">
                  <p className="font-medium text-foreground">Kode Desa</p>
                  <p className="text-muted-foreground">{infoDesaData?.kode_desa || '-'}</p>
                </div>
                <div className="p-3 bg-card rounded-lg">
                  <p className="font-medium text-foreground">Kode Pos</p>
                  <p className="text-muted-foreground">{infoDesaData?.kode_pos || '-'}</p>
                </div>
                <div className="p-3 bg-card rounded-lg">
                  <p className="font-medium text-foreground">Kecamatan</p>
                  <p className="text-muted-foreground">{infoDesaData?.nama_kecamatan || '-'}</p>
                </div>
                <div className="p-3 bg-card rounded-lg">
                  <p className="font-medium text-foreground">Kabupaten</p>
                  <p className="text-muted-foreground">{infoDesaData?.nama_kabupaten || '-'}</p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div>
              <h4 className="font-semibold text-lg mb-4 text-foreground">Statistik Penduduk</h4>
              <div className="space-y-3">
                <div className="p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-primary">Total Penduduk</p>
                      <p className="text-xl font-bold text-primary">{statistikData?.total || 0}</p>
                    </div>
                    <Users className="h-8 w-8 text-primary/60" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <p className="text-lg font-bold text-blue-600">{statistikData?.laki || 0}</p>
                    <p className="text-xs text-blue-600">Laki-laki</p>
                  </div>
                  <div className="p-3 bg-pink-50 rounded-lg text-center">
                    <p className="text-lg font-bold text-pink-600">{statistikData?.perempuan || 0}</p>
                    <p className="text-xs text-pink-600">Perempuan</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="border-t border-border pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="text-sm text-muted-foreground text-center md:text-left">
                <p className="font-medium">SIDesa - Sistem Informasi Desa</p>
                <p>© {new Date().getFullYear()} Ihsanul Fikri. All rights reserved.</p>
              </div>
              
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary">
                  <Globe className="h-3 w-3 mr-1" />
                  Sistem Terpadu
                </Badge>
                <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-700">
                  <Heart className="h-3 w-3 mr-1" />
                  Made with Love
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </PublicLayout>
  );
};

export default PublicHome;