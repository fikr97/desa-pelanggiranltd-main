
import React from 'react';
import { Card } from '@/components/ui/card';
import { User, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PerangkatDesaForm from './PerangkatDesaForm';

interface PerangkatDesa {
  id: string;
  nama: string;
  jabatan: string;
  nip?: string;
  foto?: string;
  bertanggung_jawab_kepada?: string;
  urutan_display?: number;
}

interface OrganizationalChartProps {
  perangkatDesa: PerangkatDesa[];
  onSave: (data: Partial<PerangkatDesa>, id?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const OrganizationalChart = ({ perangkatDesa, onSave, onDelete }: OrganizationalChartProps) => {
  // Function to build organizational hierarchy
  const buildHierarchy = (perangkatList: PerangkatDesa[]) => {
    const hierarchy: { [key: string]: PerangkatDesa[] } = {};
    
    perangkatList.forEach(perangkat => {
      const parentId = perangkat.bertanggung_jawab_kepada || 'root';
      if (!hierarchy[parentId]) {
        hierarchy[parentId] = [];
      }
      hierarchy[parentId].push(perangkat);
    });
    
    // Sort each level by urutan_display
    Object.keys(hierarchy).forEach(key => {
      hierarchy[key].sort((a, b) => (a.urutan_display || 0) - (b.urutan_display || 0));
    });
    
    return hierarchy;
  };

  const renderHierarchy = (parentId: string, hierarchy: { [key: string]: PerangkatDesa[] }, level: number = 0) => {
    const children = hierarchy[parentId] || [];
    if (children.length === 0) return null;

    return (
      <div className={`space-y-4 ${level > 0 ? 'ml-8 border-l-2 border-muted pl-4' : ''}`}>
        {children.map((perangkat, index) => (
          <div key={perangkat.id}>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-muted-foreground">
                      {perangkat.urutan_display || index + 1}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-sm truncate">{perangkat.nama}</h4>
                    <p className="text-xs text-muted-foreground">{perangkat.jabatan}</p>
                    {perangkat.nip && (
                      <p className="text-xs text-muted-foreground">NIP: {perangkat.nip}</p>
                    )}
                  </div>
                </div>
                <PerangkatDesaForm 
                  perangkat={perangkat}
                  perangkatList={perangkatDesa}
                  onSave={(data) => onSave(data, perangkat.id)}
                  onDelete={onDelete}
                  trigger={
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  }
                />
              </div>
            </Card>
            {renderHierarchy(perangkat.id, hierarchy, level + 1)}
          </div>
        ))}
      </div>
    );
  };

  const hierarchy = buildHierarchy(perangkatDesa);

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-center mb-6 text-gray-800">Struktur Organisasi Perangkat Desa</h3>
      
      {renderHierarchy('root', hierarchy)}
      
      {/* Show orphaned items that don't have valid parent references */}
      {perangkatDesa.filter(p => 
        p.bertanggung_jawab_kepada && 
        !perangkatDesa.find(parent => parent.id === p.bertanggung_jawab_kepada)
      ).length > 0 && (
        <div className="mt-8 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <h4 className="text-md font-medium mb-4 text-amber-700">
            Perangkat dengan referensi tidak valid
          </h4>
          <div className="space-y-4">
            {perangkatDesa
              .filter(p => 
                p.bertanggung_jawab_kepada && 
                !perangkatDesa.find(parent => parent.id === p.bertanggung_jawab_kepada)
              )
              .map((perangkat) => (
                <Card key={perangkat.id} className="p-4 bg-card border-yellow-500/30 dark:border-yellow-400/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-amber-600">
                          {perangkat.urutan_display || '?'}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-sm truncate">{perangkat.nama}</h4>
                        <p className="text-xs text-muted-foreground">{perangkat.jabatan}</p>
                        {perangkat.nip && (
                          <p className="text-xs text-muted-foreground">NIP: {perangkat.nip}</p>
                        )}
                      </div>
                    </div>
                    <PerangkatDesaForm 
                      perangkat={perangkat}
                      perangkatList={perangkatDesa}
                      onSave={(data) => onSave(data, perangkat.id)}
                      onDelete={onDelete}
                      trigger={
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      }
                    />
                  </div>
                </Card>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationalChart;
