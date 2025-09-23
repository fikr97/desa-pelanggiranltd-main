import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, User, Users, Home } from 'lucide-react';

interface WilayahPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wilayah: any;
}

const WilayahPreviewDialog = ({ open, onOpenChange, wilayah }: WilayahPreviewDialogProps) => {
  // Fetch parent wilayah data if exists
  const { data: parentWilayah } = useQuery({
    queryKey: ['parent-wilayah', wilayah?.parent_id],
    queryFn: async () => {
      if (!wilayah?.parent_id) return null;
      
      const { data, error } = await supabase
        .from('wilayah')
        .select('kode, nama, jenis')
        .eq('id', wilayah.parent_id)
        .single();
      
      if (error) {
        console.error('Error fetching parent wilayah:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!wilayah?.parent_id
  });

  if (!wilayah) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Detail Wilayah
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Informasi Wilayah</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Kode Wilayah</p>
                  <p className="font-medium">{wilayah.kode || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nama Wilayah</p>
                  <p className="font-medium">{wilayah.nama || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Jenis Wilayah</p>
                  <Badge variant="outline">{wilayah.jenis || '-'}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant={wilayah.status === 'Aktif' ? 'default' : 'secondary'}>
                    {wilayah.status || '-'}
                  </Badge>
                </div>
              </div>
              
              {wilayah.kepala && (
                <div className="pt-2">
                  <p className="text-sm font-medium text-muted-foreground">Kepala Wilayah</p>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{wilayah.kepala}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Data Statistik</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Home className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Jumlah KK</p>
                    <p className="text-xl font-bold">{wilayah.jumlah_kk || 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Jumlah Penduduk</p>
                    <p className="text-xl font-bold">{wilayah.jumlah_penduduk || 0}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {parentWilayah && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Wilayah Induk</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{parentWilayah.nama}</p>
                    <p className="text-sm text-muted-foreground">
                      {parentWilayah.kode} • {parentWilayah.jenis}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Informasi Tambahan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tanggal Dibuat</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p>{wilayah.created_at ? new Date(wilayah.created_at).toLocaleDateString('id-ID') : '-'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Terakhir Diperbarui</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p>{wilayah.updated_at ? new Date(wilayah.updated_at).toLocaleDateString('id-ID') : '-'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WilayahPreviewDialog;