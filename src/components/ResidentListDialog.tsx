import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface Resident {
  id: string;
  nama: string;
  nik: string;
  jenis_kelamin?: string;
  dusun?: string;
  pekerjaan?: string;
  agama?: string;
  tanggal_lahir?: string;
}

interface ResidentListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  residents: Resident[];
  title: string;
  description?: string;
}

const ResidentListDialog = ({ 
  open, 
  onOpenChange, 
  residents, 
  title, 
  description 
}: ResidentListDialogProps) => {
  const getAge = (birthDate: string) => {
    if (!birthDate) return '-';
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    return `${age} tahun`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline">
              Total: {residents.length} orang
            </Badge>
          </div>

          <ScrollArea className="h-[60vh] w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>NIK</TableHead>
                  <TableHead>JK</TableHead>
                  <TableHead>Usia</TableHead>
                  <TableHead>Dusun</TableHead>
                  <TableHead>Pekerjaan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {residents.map((resident, index) => (
                  <TableRow key={resident.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="font-medium">{resident.nama}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{resident.nik}</TableCell>
                    <TableCell>
                      <Badge variant={resident.jenis_kelamin?.toLowerCase().includes('laki') ? 'default' : 'secondary'}>
                        {resident.jenis_kelamin === 'Laki-laki' || resident.jenis_kelamin?.toLowerCase().includes('laki') ? 'L' : 'P'}
                      </Badge>
                    </TableCell>
                    <TableCell>{getAge(resident.tanggal_lahir || '')}</TableCell>
                    <TableCell className="text-sm">{resident.dusun || '-'}</TableCell>
                    <TableCell className="text-sm">{resident.pekerjaan || '-'}</TableCell>
                  </TableRow>
                ))}
                {residents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Tidak ada data penduduk
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResidentListDialog;