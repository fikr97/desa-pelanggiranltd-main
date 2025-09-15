import React from 'react';
import { Users, User, UserRound, Building, FileText } from 'lucide-react';
import StatCard from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f97316', '#ec4899', '#f59e0b', '#6366f1'];

const Dashboard = () => {
  const { data: dashboardStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_dashboard_stats');
      if (error) {
        console.error('Error fetching dashboard stats:', error);
        throw new Error(error.message);
      }
      return data;
    },
  });

  const { data: recentSurat, isLoading: isLoadingSurat } = useQuery({
    queryKey: ['recent-surat'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('surat')
        .select('id, nomor_surat, judul_surat, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw new Error(error.message);
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Ringkasan statistik, demografi, dan aktivitas terbaru Desa Pelanggiran.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Penduduk"
          value={isLoadingStats ? '...' : dashboardStats?.total_penduduk?.toLocaleString() || '0'}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Laki-laki"
          value={isLoadingStats ? '...' : dashboardStats?.total_laki_laki?.toLocaleString() || '0'}
          icon={User}
          color="green"
        />
        <StatCard
          title="Perempuan"
          value={isLoadingStats ? '...' : dashboardStats?.total_perempuan?.toLocaleString() || '0'}
          icon={UserRound}
          color="yellow"
        />
        <StatCard
          title="Jumlah KK"
          value={isLoadingStats ? '...' : dashboardStats?.total_kk?.toLocaleString() || '0'}
          icon={Building}
          color="red"
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Demographic Charts */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Distribusi Demografi</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="usia">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="usia">Usia</TabsTrigger>
                <TabsTrigger value="pendidikan">Pendidikan</TabsTrigger>
                <TabsTrigger value="agama">Agama</TabsTrigger>
                <TabsTrigger value="pekerjaan">Pekerjaan</TabsTrigger>
              </TabsList>
              <div className="mt-4 pt-4">
                {isLoadingStats ? (
                  <div className="h-[350px] flex items-center justify-center text-muted-foreground">Memuat data grafik...</div>
                ) : (
                  <>
                    <TabsContent value="usia">
                      <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={dashboardStats?.age_groups} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                          <YAxis />
                          <Tooltip formatter={(value) => [value, 'Jumlah Jiwa']} />
                          <Bar dataKey="jumlah" fill="#3b82f6" name="Jumlah Jiwa" />
                        </BarChart>
                      </ResponsiveContainer>
                    </TabsContent>
                    <TabsContent value="pendidikan">
                       <ResponsiveContainer width="100%" height={350}>
                        <PieChart>
                          <Pie data={dashboardStats?.pendidikan} dataKey="jumlah" nameKey="pendidikan" cx="50%" cy="50%" outerRadius={120}>
                             {dashboardStats?.pendidikan?.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value, name) => [`${(value as number).toLocaleString()} jiwa`, name]} />
                          <Legend wrapperStyle={{ fontSize: '12px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </TabsContent>
                    <TabsContent value="agama">
                       <ResponsiveContainer width="100%" height={350}>
                        <PieChart>
                          <Pie data={dashboardStats?.agama} dataKey="jumlah" nameKey="agama" cx="50%" cy="50%" outerRadius={120}>
                            {dashboardStats?.agama?.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value, name) => [`${(value as number).toLocaleString()} jiwa`, name]} />
                          <Legend wrapperStyle={{ fontSize: '12px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </TabsContent>
                    <TabsContent value="pekerjaan">
                       <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={dashboardStats?.pekerjaan} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis type="category" dataKey="pekerjaan" width={150} tick={{ fontSize: 12 }} />
                          <Tooltip formatter={(value) => [`${(value as number).toLocaleString()} jiwa`, 'Jumlah']} />
                          <Bar dataKey="jumlah" fill="#f97316" name="Jumlah Jiwa" />
                        </BarChart>
                      </ResponsiveContainer>
                    </TabsContent>
                  </>
                )}
              </div>
            </Tabs>
          </CardContent>
        </Card>

        {/* Recent Surat */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Surat Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSurat ? (
              <div className="text-center text-muted-foreground">Memuat data surat...</div>
            ) : (
              <div className="space-y-4">
                {recentSurat?.map((surat) => (
                  <div key={surat.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                    <div>
                      <p className="font-semibold line-clamp-1">{surat.judul_surat}</p>
                      <p className="text-sm text-muted-foreground">{surat.nomor_surat}</p>
                    </div>
                    <Badge variant="outline">{new Date(surat.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</Badge>
                  </div>
                ))}
                 {recentSurat?.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">Belum ada surat yang dibuat.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
