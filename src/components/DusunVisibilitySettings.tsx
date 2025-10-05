import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DusunVisibilitySettingsProps {
  formId?: string;
  visibility: string;
  dusunSelected: string[];
  onVisibilityChange: (value: string) => void;
  onDusunSelectedChange: (dusunList: string[]) => void;
}

const DusunVisibilitySettings: React.FC<DusunVisibilitySettingsProps> = ({
  formId,
  visibility,
  dusunSelected,
  onVisibilityChange,
  onDusunSelectedChange
}) => {
  const [allDusuns, setAllDusuns] = useState<string[]>([]);
  const [selectedDusun, setSelectedDusun] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    fetchDusuns();
  }, []);

  const fetchDusuns = async () => {
    try {
      const { data, error } = await supabase
        .from('wilayah')
        .select('nama')
        .eq('jenis', 'Dusun')
        .order('nama');

      if (error) throw error;

      setAllDusuns(data.map(item => item.nama));
    } catch (error) {
      console.error('Error fetching dusuns:', error);
      toast({
        title: 'Gagal memuat daftar dusun',
        description: 'Terjadi kesalahan saat memuat daftar dusun',
        variant: 'destructive',
      });
    }
  };

  const addDusun = () => {
    if (selectedDusun && !dusunSelected.includes(selectedDusun)) {
      onDusunSelectedChange([...dusunSelected, selectedDusun]);
      setSelectedDusun('');
    }
  };

  const removeDusun = (dusunToRemove: string) => {
    onDusunSelectedChange(dusunSelected.filter(d => d !== dusunToRemove));
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Visibilitas Formulir</CardTitle>
        <CardDescription>
          Atur apakah formulir ini akan ditampilkan ke semua dusun atau hanya ke dusun tertentu
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Visibilitas</Label>
          <RadioGroup 
            value={visibility} 
            onValueChange={onVisibilityChange}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="semua" id="semua" />
              <Label htmlFor="semua">Tampilkan ke Semua Dusun</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="tertentu" id="tertentu" />
              <Label htmlFor="tertentu">Tampilkan ke Dusun Tertentu</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="semua_data" id="semua_data" />
              <Label htmlFor="semua_data">Kadus Bisa Lihat & Isi Semua Data</Label>
            </div>
          </RadioGroup>
        </div>

        {visibility === 'tertentu' && (
          <div className="space-y-3">
            <Label>Pilih Dusun</Label>
            <div className="flex gap-2">
              <Select value={selectedDusun} onValueChange={setSelectedDusun}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Pilih dusun..." />
                </SelectTrigger>
                <SelectContent>
                  {allDusuns
                    .filter(d => !dusunSelected.includes(d))
                    .map((dusun) => (
                      <SelectItem key={dusun} value={dusun}>
                        {dusun}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button type="button" onClick={addDusun} disabled={!selectedDusun}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {dusunSelected.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {dusunSelected.map((dusun) => (
                  <Badge key={dusun} variant="secondary" className="flex items-center gap-1">
                    {dusun}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-1 ml-1"
                      onClick={() => removeDusun(dusun)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
        
        {visibility === 'semua_data' && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Catatan:</strong> Dalam mode ini, kadus dapat melihat dan mengisi semua data dari semua dusun, 
              seperti akses admin khusus untuk form ini.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DusunVisibilitySettings;