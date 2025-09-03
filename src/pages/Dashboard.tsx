import React from 'react';
import { Users, UserCheck, Building, FileText, TrendingUp, Calendar } from 'lucide-react';
import StatCard from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  // Fetch total penduduk - Fixed to get ALL data with better gender handling
  const { data: pendudukStats } = useQuery({
    queryKey: ['penduduk-stats'],
    queryFn: async () => {
      console.log('Fetching ALL penduduk statistics for dashboard...');
      
      // Get ALL penduduk data using the same method as other pages
      let allData: any[] = [];
      let from = 0;
      const limit = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('penduduk')
          .select('*')
          .range(from, from + limit - 1);

        if (error) {
          console.error('Error fetching penduduk data for dashboard:', error);
          throw error;
        }

        if (data) {
          allData = [...allData, ...data];
          console.log(`Dashboard: Fetched ${data.length} records, total so far: ${allData.length}`);
          
          if (data.length < limit) {
            hasMore = false;
          } else {
            from += limit;
          }
        } else {
          hasMore = false;
        }
      }

      console.log(`Dashboard: Total penduduk fetched: ${allData.length}`);

      // Calculate statistics from ALL data with improved gender handling
      const totalPenduduk = allData.length;
      
      // Fixed gender calculation with better handling of null/empty values
      const lakiLaki = allData.filter(p => {
        const gender = p.jenis_kelamin?.toLowerCase()?.trim();
        return gender === 'laki-laki' || gender === 'l' || gender === 'laki';
      }).length;
      
      const perempuan = allData.filter(p => {
        const gender = p.jenis_kelamin?.toLowerCase()?.trim();
        return gender === 'perempuan' || gender === 'p' || gender === 'wanita';
      }).length;

      // Get unique KK count from ALL data
      const uniqueKK = new Set(allData.map(p => p.no_kk).filter(Boolean)).size;

      console.log('Dashboard statistics calculated:', { 
        totalPenduduk, 
        lakiLaki, 
        perempuan, 
        uniqueKK,
        sum: lakiLaki + perempuan,
        difference: totalPenduduk - (lakiLaki + perempuan)
      });

      return {
        totalPenduduk,
        lakiLaki,
        perempuan,
        jumlahKK: uniqueKK
      };
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Selamat datang di Sistem Informasi Desa</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Penduduk"
          value={pendudukStats?.totalPenduduk?.toLocaleString() || '0'}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Laki-laki"
          value={pendudukStats?.lakiLaki?.toLocaleString() || '0'}
          icon={UserCheck}
          color="green"
        />
        <StatCard
          title="Perempuan"
          value={pendudukStats?.perempuan?.toLocaleString() || '0'}
          icon={UserCheck}
          color="yellow"
        />
        <StatCard
          title="Jumlah KK"
          value={pendudukStats?.jumlahKK?.toLocaleString() || '0'}
          icon={Building}
          color="red"
        />
      </div>

      {/* Additional Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Aktivitas Hari Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">0</div>
            <p className="text-sm text-muted-foreground">
              Transaksi hari ini
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Menu Cepat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
              <Users className="h-8 w-8 text-primary mb-2" />
              <span className="text-sm font-medium">Data Penduduk</span>
            </div>
            <div className="flex flex-col items-center p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
              <Building className="h-8 w-8 text-primary mb-2" />
              <span className="text-sm font-medium">Data Wilayah</span>
            </div>
            <div className="flex flex-col items-center p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
              <Calendar className="h-8 w-8 text-primary mb-2" />
              <span className="text-sm font-medium">Laporan</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
