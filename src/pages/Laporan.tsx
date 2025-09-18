import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Archive } from 'lucide-react';

const reportCards = [
  {
    title: 'Arsip Surat Keluar',
    description: 'Lihat dan kelola semua surat yang telah diterbitkan.',
    icon: Archive,
    link: '/arsip-surat-keluar',
    enabled: true,
  },
  {
    title: 'Laporan Penduduk',
    description: 'Statistik dan laporan demografi penduduk.',
    icon: FileText,
    link: '#',
    enabled: false,
  },
  {
    title: 'Laporan Keuangan',
    description: 'Laporan pemasukan dan pengeluaran desa.',
    icon: FileText,
    link: '#',
    enabled: false,
  },
];

const Laporan = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Pusat Laporan</h1>
        <p className="text-muted-foreground">Pilih jenis laporan yang ingin Anda lihat.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportCards.map((card) => (
          <Link to={card.link} key={card.title} className={!card.enabled ? 'pointer-events-none' : ''}>
            <Card className={`hover:shadow-lg transition-shadow h-full ${!card.enabled ? 'bg-muted/50' : ''}`}>
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <card.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>{card.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{card.description}</p>
                {!card.enabled && (
                  <p className="text-sm text-amber-600 mt-2">Segera Hadir</p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Laporan;