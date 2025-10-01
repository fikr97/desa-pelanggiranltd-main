
import React, { useState, useMemo } from 'react';
import { Users, UserCheck, Building, GraduationCap, Briefcase, Heart } from 'lucide-react';
import StatCard from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ResidentListDialog from '@/components/ResidentListDialog';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const Statistik = () => {
  // Filter states
  const [selectedAgeRange, setSelectedAgeRange] = useState<string>('all');
  const [customAgeMin, setCustomAgeMin] = useState<number>(0);
  const [customAgeMax, setCustomAgeMax] = useState<number>(100);
  const [selectedDusun, setSelectedDusun] = useState<string[]>([]);
  const [selectedPekerjaan, setSelectedPekerjaan] = useState<string>('all');

  // Dialog states for showing resident lists
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogResidents, setDialogResidents] = useState<any[]>([]);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogDescription, setDialogDescription] = useState('');

  // Fetch comprehensive statistics - Fixed to get ALL data
  const { data: stats, isLoading } = useQuery({
    queryKey: ['comprehensive-stats'],
    queryFn: async () => {
      console.log('Fetching ALL penduduk data for comprehensive statistics...');
      
      // Get ALL penduduk data using the same method as Penduduk page
      let allData: any[] = [];
      let from = 0;
      const limit = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('penduduk')
          .select('*')
          .range(from, from + limit - 1)
          .order('nama', { ascending: true });

        if (error) {
          console.error('Error fetching penduduk data:', error);
          throw error;
        }

        if (data) {
          allData = [...allData, ...data];
          console.log(`Fetched ${data.length} records, total so far: ${allData.length}`);
          
          if (data.length < limit) {
            hasMore = false;
          } else {
            from += limit;
          }
        } else {
          hasMore = false;
        }
      }

      console.log(`Total fetched for statistics: ${allData.length} records`);

      if (!allData || allData.length === 0) return null;

      // Basic counts using ALL data with detailed logging
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

      // Find records with invalid/missing gender for debugging
      const invalidGender = allData.filter(p => {
        const gender = p.jenis_kelamin?.toLowerCase()?.trim();
        return !gender || (
          gender !== 'laki-laki' && 
          gender !== 'l' && 
          gender !== 'laki' && 
          gender !== 'perempuan' && 
          gender !== 'p' && 
          gender !== 'wanita'
        );
      });

      console.log('Gender distribution:', {
        total: totalPenduduk,
        lakiLaki,
        perempuan,
        invalidGender: invalidGender.length,
        sum: lakiLaki + perempuan,
        difference: totalPenduduk - (lakiLaki + perempuan)
      });

      if (invalidGender.length > 0) {
        console.log('Records with invalid gender:', invalidGender.map(p => ({
          nama: p.nama,
          jenis_kelamin: p.jenis_kelamin
        })));
      }
      
      // Unique KK count from ALL data
      const uniqueKK = new Set(allData.map(p => p.no_kk).filter(Boolean)).size;

      // Age distribution from ALL data
      const today = new Date();
      const ageGroups = {
        '0-17': 0,
        '18-30': 0,
        '31-45': 0,
        '46-60': 0,
        '60+': 0
      };

      allData.forEach(p => {
        if (p.tanggal_lahir) {
          const birthDate = new Date(p.tanggal_lahir);
          const age = today.getFullYear() - birthDate.getFullYear();
          
          if (age <= 17) ageGroups['0-17']++;
          else if (age <= 30) ageGroups['18-30']++;
          else if (age <= 45) ageGroups['31-45']++;
          else if (age <= 60) ageGroups['46-60']++;
          else ageGroups['60+']++;
        }
      });

      // Education distribution from ALL data
      const pendidikanCount: { [key: string]: number } = {};
      allData.forEach(p => {
        if (p.pendidikan) {
          pendidikanCount[p.pendidikan] = (pendidikanCount[p.pendidikan] || 0) + 1;
        }
      });

      // Religion distribution from ALL data
      const agamaCount: { [key: string]: number } = {};
      allData.forEach(p => {
        if (p.agama) {
          agamaCount[p.agama] = (agamaCount[p.agama] || 0) + 1;
        }
      });

      // Marital status distribution from ALL data
      const statusKawinCount: { [key: string]: number } = {};
      allData.forEach(p => {
        if (p.status_kawin) {
          statusKawinCount[p.status_kawin] = (statusKawinCount[p.status_kawin] || 0) + 1;
        }
      });

      // Job distribution from ALL data (top 10)
      const pekerjaanCount: { [key: string]: number } = {};
      allData.forEach(p => {
        if (p.pekerjaan && p.pekerjaan.trim()) {
          const pekerjaan = p.pekerjaan.trim();
          pekerjaanCount[pekerjaan] = (pekerjaanCount[pekerjaan] || 0) + 1;
        }
      });

      // Dusun distribution from ALL data - Fixed to handle ALL dusun variations including nulls
      const dusunCount: { [key: string]: number } = {};
      allData.forEach(p => {
        // Handle both null/empty dusun and actual dusun values
        let dusunName = p.dusun;
        
        if (!dusunName || dusunName.trim() === '') {
          dusunName = 'Tidak Diketahui';
        } else {
          dusunName = dusunName.trim();
        }
        
        dusunCount[dusunName] = (dusunCount[dusunName] || 0) + 1;
      });

      // Get all unique dusun names and sort them properly
      const allDusunNames = Object.keys(dusunCount).sort((a, b) => {
        // Put "Tidak Diketahui" at the end
        if (a === 'Tidak Diketahui') return 1;
        if (b === 'Tidak Diketahui') return -1;
        
        // Sort numbered dusun (Dusun I, Dusun II, etc.) properly
        if (a.startsWith('Dusun ') && b.startsWith('Dusun ')) {
          const numA = a.replace('Dusun ', '');
          const numB = b.replace('Dusun ', '');
          
          // Handle Roman numerals
          const romanToNum = (roman: string) => {
            const romanNumerals: { [key: string]: number } = {
              'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 
              'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10,
              'XI': 11, 'XII': 12, 'XIII': 13, 'XIV': 14, 'XV': 15
            };
            return romanNumerals[roman] || 999;
          };
          
          return romanToNum(numA) - romanToNum(numB);
        }
        
        // Default alphabetical sort
        return a.localeCompare(b);
      });

      console.log('All Dusun found (sorted):', allDusunNames);
      console.log('Total dusun count:', Object.keys(dusunCount).length);
      console.log('Dusun distribution:', dusunCount);

      console.log('Complete statistics calculated from ALL data:', {
        totalPenduduk,
        lakiLaki,
        perempuan,
        uniqueKK,
        ageGroups,
        pendidikanCount,
        agamaCount,
        statusKawinCount,
        pekerjaanCount,
        dusunCount: Object.keys(dusunCount).length + ' dusun found',
        allDusunNames
      });

      return {
        totalPenduduk,
        lakiLaki,
        perempuan,
        jumlahKK: uniqueKK,
        ageGroups,
        pendidikanCount,
        agamaCount,
        statusKawinCount,
        pekerjaanCount,
        dusunCount,
        allData,
        invalidGender,
        allDusunNames
      };
    }
  });

  // Memoized filtered data
  const filteredData = useMemo(() => {
    if (!stats) return null;

    // Filter age data based on selected range or custom range
    let ageChartData;
    if (selectedAgeRange === 'custom') {
      // Calculate custom age range from raw data
      const today = new Date();
      let customAgeCount = 0;
      
      stats.allData.forEach(p => {
        if (p.tanggal_lahir) {
          const birthDate = new Date(p.tanggal_lahir);
          const age = today.getFullYear() - birthDate.getFullYear();
          if (age >= customAgeMin && age <= customAgeMax) {
            customAgeCount++;
          }
        }
      });

      ageChartData = [{
        range: `${customAgeMin}-${customAgeMax}`,
        jumlah: customAgeCount
      }];
    } else if (selectedAgeRange !== 'all') {
      ageChartData = Object.entries(stats.ageGroups)
        .filter(([range]) => range === selectedAgeRange)
        .map(([range, count]) => ({
          range,
          jumlah: count
        }));
    } else {
      ageChartData = Object.entries(stats.ageGroups).map(([range, count]) => ({
        range,
        jumlah: count
      }));
    }

    // Filter dusun data based on selection
    let dusunChartData = Object.entries(stats.dusunCount).map(([dusun, count]) => ({
      dusun,
      jumlah: count
    }));

    if (selectedDusun.length > 0) {
      dusunChartData = dusunChartData.filter(item => selectedDusun.includes(item.dusun));
    }

    // Filter pekerjaan data - Fixed orientation for bar chart
    let pekerjaanData = Object.entries(stats.pekerjaanCount)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([pekerjaan, count]) => ({
        pekerjaan: pekerjaan.length > 15 ? pekerjaan.substring(0, 15) + '...' : pekerjaan,
        fullPekerjaan: pekerjaan,
        jumlah: count
      }));

    if (selectedPekerjaan !== 'all') {
      pekerjaanData = pekerjaanData.filter(item => item.fullPekerjaan === selectedPekerjaan);
    }

    return {
      ageChartData,
      dusunChartData,
      pekerjaanData
    };
  }, [stats, selectedAgeRange, customAgeMin, customAgeMax, selectedDusun, selectedPekerjaan]);

  // Format data for charts
  const genderChartData = stats ? [
    { name: 'Laki-laki', value: stats.lakiLaki },
    { name: 'Perempuan', value: stats.perempuan }
  ] : [];

  const agamaChartData = stats ? Object.entries(stats.agamaCount).map(([agama, count]) => ({
    agama,
    jumlah: count
  })) : [];

  // Get unique values for filters - Use the sorted dusun names from stats
  const ageRanges = ['0-17', '18-30', '31-45', '46-60', '60+'];
  const allDusun = stats?.allDusunNames || [];
  const allPekerjaan = stats ? Object.keys(stats.pekerjaanCount).sort() : [];

  // Handle dusun selection
  const handleDusunToggle = (dusun: string) => {
    setSelectedDusun(prev => 
      prev.includes(dusun) 
        ? prev.filter(d => d !== dusun)
        : [...prev, dusun]
    );
  };

  const handleSelectAllDusun = () => {
    setSelectedDusun(allDusun);
  };

  const handleClearDusun = () => {
    setSelectedDusun([]);
  };

  // Chart click handlers
  const handleAgeChartClick = (data: any) => {
    if (!stats?.allData) return;
    
    const today = new Date();
    let filteredResidents: any[] = [];
    
    if (data.range.includes('-')) {
      const [min, max] = data.range.split('-').map(Number);
      filteredResidents = stats.allData.filter(p => {
        if (p.tanggal_lahir) {
          const birthDate = new Date(p.tanggal_lahir);
          const age = today.getFullYear() - birthDate.getFullYear();
          if (max === undefined) return age >= min; // For "60+" case
          return age >= min && age <= max;
        }
        return false;
      });
    }
    
    setDialogResidents(filteredResidents);
    setDialogTitle(`Penduduk Usia ${data.range} Tahun`);
    setDialogDescription(`Daftar ${filteredResidents.length} penduduk dengan rentang usia ${data.range} tahun`);
    setDialogOpen(true);
  };

  const handleGenderChartClick = (data: any) => {
    if (!stats?.allData) return;
    
    const filteredResidents = stats.allData.filter(p => {
      const gender = p.jenis_kelamin?.toLowerCase()?.trim();
      if (data.name === 'Laki-laki') {
        return gender === 'laki-laki' || gender === 'l' || gender === 'laki';
      } else {
        return gender === 'perempuan' || gender === 'p' || gender === 'wanita';
      }
    });
    
    setDialogResidents(filteredResidents);
    setDialogTitle(`Penduduk ${data.name}`);
    setDialogDescription(`Daftar ${filteredResidents.length} penduduk berjenis kelamin ${data.name.toLowerCase()}`);
    setDialogOpen(true);
  };

  const handleAgamaChartClick = (data: any) => {
    if (!stats?.allData) return;
    
    const filteredResidents = stats.allData.filter(p => p.agama === data.agama);
    
    setDialogResidents(filteredResidents);
    setDialogTitle(`Penduduk Beragama ${data.agama}`);
    setDialogDescription(`Daftar ${filteredResidents.length} penduduk yang beragama ${data.agama}`);
    setDialogOpen(true);
  };

  const handleDusunChartClick = (data: any) => {
    if (!stats?.allData) return;
    
    const filteredResidents = stats.allData.filter(p => {
      const dusunName = p.dusun?.trim() || 'Tidak Diketahui';
      return dusunName === data.dusun;
    });
    
    setDialogResidents(filteredResidents);
    setDialogTitle(`Penduduk ${data.dusun}`);
    setDialogDescription(`Daftar ${filteredResidents.length} penduduk yang tinggal di ${data.dusun}`);
    setDialogOpen(true);
  };

  const handlePekerjaanChartClick = (data: any) => {
    if (!stats?.allData) return;
    
    const filteredResidents = stats.allData.filter(p => p.pekerjaan === data.fullPekerjaan);
    
    setDialogResidents(filteredResidents);
    setDialogTitle(`Penduduk dengan Pekerjaan ${data.fullPekerjaan}`);
    setDialogDescription(`Daftar ${filteredResidents.length} penduduk yang bekerja sebagai ${data.fullPekerjaan}`);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Memuat data statistik...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient">Statistik Penduduk</h1>
        <p className="text-muted-foreground mt-2">
          Data statistik dan demografi penduduk desa - Total: {stats?.totalPenduduk?.toLocaleString() || '0'} jiwa
          {stats?.invalidGender && stats.invalidGender.length > 0 && (
            <span className="text-orange-600 ml-2">
              ({stats.invalidGender.length} data dengan jenis kelamin tidak valid)
            </span>
          )}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Penduduk"
          value={stats?.totalPenduduk?.toLocaleString() || '0'}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Laki-laki"
          value={stats?.lakiLaki?.toLocaleString() || '0'}
          icon={UserCheck}
          color="green"
        />
        <StatCard
          title="Perempuan"
          value={stats?.perempuan?.toLocaleString() || '0'}
          icon={UserCheck}
          color="yellow"
        />
        <StatCard
          title="Jumlah KK"
          value={stats?.jumlahKK?.toLocaleString() || '0'}
          icon={Building}
          color="red"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Age Distribution with Custom Range Filter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Distribusi Usia</span>
              <div className="flex items-center space-x-2">
                <Select value={selectedAgeRange} onValueChange={setSelectedAgeRange}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Pilih rentang usia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Usia</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                    {ageRanges.map(range => (
                      <SelectItem key={range} value={range}>{range} tahun</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardTitle>
            {selectedAgeRange === 'custom' && (
              <div className="flex items-center space-x-2 mt-2">
                <div className="flex items-center space-x-1">
                  <Label htmlFor="ageMin" className="text-sm">Min:</Label>
                  <Input
                    id="ageMin"
                    type="number"
                    value={customAgeMin}
                    onChange={(e) => setCustomAgeMin(Number(e.target.value))}
                    className="w-16"
                    min={0}
                    max={100}
                  />
                </div>
                <div className="flex items-center space-x-1">
                  <Label htmlFor="ageMax" className="text-sm">Max:</Label>
                  <Input
                    id="ageMax"
                    type="number"
                    value={customAgeMax}
                    onChange={(e) => setCustomAgeMax(Number(e.target.value))}
                    className="w-16"
                    min={0}
                    max={100}
                  />
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={filteredData?.ageChartData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="jumlah" fill="#0088FE" onClick={handleAgeChartClick} style={{ cursor: 'pointer' }} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gender Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribusi Jenis Kelamin</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={genderChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  onClick={handleGenderChartClick}
                  style={{ cursor: 'pointer' }}
                 >
                   {genderChartData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Religion Distribution as Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Distribusi Agama</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={agamaChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="agama" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="jumlah" fill="#00C49F" onClick={handleAgamaChartClick} style={{ cursor: 'pointer' }} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Dusun Distribution with Filter - Fixed to show all 15 dusun */}
        <Card>
          <CardHeader>
            <CardTitle>Distribusi per Dusun ({allDusun.length} dusun)</CardTitle>
            <div className="flex flex-wrap gap-2 mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSelectAllDusun}
              >
                Pilih Semua
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearDusun}
              >
                Hapus Semua
              </Button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2 max-h-24 overflow-y-auto">
              {allDusun.map(dusun => (
                <Button
                  key={dusun}
                  variant={selectedDusun.includes(dusun) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleDusunToggle(dusun)}
                  className="text-xs"
                >
                  {dusun} ({stats?.dusunCount[dusun] || 0})
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={filteredData?.dusunChartData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dusun" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="jumlah" fill="#00C49F" onClick={handleDusunChartClick} style={{ cursor: 'pointer' }} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Jobs with Filter - Fixed Chart Orientation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Distribusi Pekerjaan</span>
            <Select value={selectedPekerjaan} onValueChange={setSelectedPekerjaan}>
              <SelectTrigger className="w-60">
                <SelectValue placeholder="Pilih pekerjaan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">10 Pekerjaan Terbanyak</SelectItem>
                {allPekerjaan.map(pekerjaan => (
                  <SelectItem key={pekerjaan} value={pekerjaan}>
                    {pekerjaan} ({stats?.pekerjaanCount[pekerjaan]} orang)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={filteredData?.pekerjaanData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="pekerjaan" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="jumlah" fill="#FFBB28" onClick={handlePekerjaanChartClick} style={{ cursor: 'pointer' }} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Resident List Dialog */}
      <ResidentListDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        residents={dialogResidents}
        title={dialogTitle}
        description={dialogDescription}
      />
    </div>
  );
};

export default Statistik;
