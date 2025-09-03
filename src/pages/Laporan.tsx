
import React, { useState } from 'react';
import { FileText, Download, Calendar, Filter, Eye, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Laporan = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('semua');
  const [filterJenis, setFilterJenis] = useState('semua');

  const laporanData = [
    {
      id: 'RPT001',
      nama: 'Laporan Penduduk Bulanan',
      jenis: 'Penduduk',
      periode: 'November 2024',
      tanggalBuat: '2024-12-01',
      status: 'Selesai',
      ukuranFile: '2.5 MB',
      format: 'PDF'
    },
    {
      id: 'RPT002',
      nama: 'Laporan Keuangan Desa',
      jenis: 'Keuangan',
      periode: 'November 2024',
      tanggalBuat: '2024-11-30',
      status: 'Proses',
      ukuranFile: '1.8 MB',
      format: 'Excel'
    },
    {
      id: 'RPT003',
      nama: 'Laporan Kegiatan Pembangunan',
      jenis: 'Pembangunan',
      periode: 'Oktober 2024',
      tanggalBuat: '2024-11-15',
      status: 'Selesai',
      ukuranFile: '4.2 MB',
      format: 'PDF'
    },
    {
      id: 'RPT004',
      nama: 'Laporan Bantuan Sosial',
      jenis: 'Bantuan',
      periode: 'November 2024',
      tanggalBuat: '2024-11-28',
      status: 'Draft',
      ukuranFile: '0.9 MB',
      format: 'Word'
    },
    {
      id: 'RPT005',
      nama: 'Laporan Administrasi Surat',
      jenis: 'Administrasi',
      periode: 'November 2024',
      tanggalBuat: '2024-12-02',
      status: 'Selesai',
      ukuranFile: '1.2 MB',
      format: 'PDF'
    }
  ];

  const jenisLaporan = [
    { value: 'penduduk', label: 'Laporan Penduduk' },
    { value: 'keuangan', label: 'Laporan Keuangan' },
    { value: 'pembangunan', label: 'Laporan Pembangunan' },
    { value: 'bantuan', label: 'Laporan Bantuan' },
    { value: 'administrasi', label: 'Laporan Administrasi' },
    { value: 'statistik', label: 'Laporan Statistik' }
  ];

  const filteredData = laporanData.filter(item => {
    const matchSearch = item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'semua' || item.status.toLowerCase() === filterStatus;
    const matchJenis = filterJenis === 'semua' || item.jenis.toLowerCase() === filterJenis;
    
    return matchSearch && matchStatus && matchJenis;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Selesai':
        return <Badge variant="default" className="bg-green-500">{status}</Badge>;
      case 'Proses':
        return <Badge variant="default" className="bg-yellow-500">{status}</Badge>;
      case 'Draft':
        return <Badge variant="secondary">{status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleDownload = (laporan: any) => {
    console.log('Download laporan:', laporan);
  };

  const handleView = (laporan: any) => {
    console.log('View laporan:', laporan);
  };

  const handlePrint = (laporan: any) => {
    console.log('Print laporan:', laporan);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Laporan</h1>
          <p className="text-muted-foreground">Kelola dan unduh laporan desa</p>
        </div>
        <Button className="flex items-center space-x-2">
          <FileText className="h-4 w-4" />
          <span>Buat Laporan Baru</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{laporanData.length}</p>
                <p className="text-sm text-muted-foreground">Total Laporan</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{laporanData.filter(l => l.status === 'Selesai').length}</p>
                <p className="text-sm text-muted-foreground">Laporan Selesai</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Filter className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{laporanData.filter(l => l.status === 'Proses').length}</p>
                <p className="text-sm text-muted-foreground">Dalam Proses</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Download className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{laporanData.filter(l => l.status === 'Draft').length}</p>
                <p className="text-sm text-muted-foreground">Draft</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter & Pencarian</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Cari laporan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <Select value={filterJenis} onValueChange={setFilterJenis}>
              <SelectTrigger>
                <SelectValue placeholder="Jenis Laporan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua Jenis</SelectItem>
                <SelectItem value="penduduk">Penduduk</SelectItem>
                <SelectItem value="keuangan">Keuangan</SelectItem>
                <SelectItem value="pembangunan">Pembangunan</SelectItem>
                <SelectItem value="bantuan">Bantuan</SelectItem>
                <SelectItem value="administrasi">Administrasi</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua Status</SelectItem>
                <SelectItem value="selesai">Selesai</SelectItem>
                <SelectItem value="proses">Proses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Reset Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Template Laporan Cepat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {jenisLaporan.map((jenis, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="font-medium">{jenis.label}</span>
                    </div>
                    <Button size="sm" variant="outline">
                      Buat
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Laporan ({filteredData.length} laporan)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredData.map((laporan, index) => (
              <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold">{laporan.nama}</h3>
                      {getStatusBadge(laporan.status)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">ID:</span> {laporan.id}
                      </div>
                      <div>
                        <span className="font-medium">Jenis:</span> {laporan.jenis}
                      </div>
                      <div>
                        <span className="font-medium">Periode:</span> {laporan.periode}
                      </div>
                      <div>
                        <span className="font-medium">Tanggal:</span> {laporan.tanggalBuat}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                      <span><span className="font-medium">Format:</span> {laporan.format}</span>
                      <span><span className="font-medium">Ukuran:</span> {laporan.ukuranFile}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => handleView(laporan)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handlePrint(laporan)}>
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDownload(laporan)}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Laporan;
