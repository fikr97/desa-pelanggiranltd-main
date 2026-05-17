import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MapPin, ExternalLink } from 'lucide-react';

export interface KoordinatData {
  latitude: string;
  longitude: string;
}

interface KoordinatSectionProps {
  data: KoordinatData;
  onChange: (data: KoordinatData) => void;
  disabled?: boolean;
}

const KoordinatSection: React.FC<KoordinatSectionProps> = ({ data, onChange, disabled }) => {
  const hasCoords = data.latitude.trim() !== '' && data.longitude.trim() !== '';
  const mapsUrl = hasCoords
    ? `https://www.google.com/maps?q=${data.latitude},${data.longitude}`
    : '';

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Latitude</Label>
          <Input
            placeholder="Contoh: 1.234567"
            value={data.latitude}
            onChange={e => onChange({ ...data, latitude: e.target.value })}
            disabled={disabled}
            type="text"
            inputMode="decimal"
          />
        </div>
        <div>
          <Label>Longitude</Label>
          <Input
            placeholder="Contoh: 103.456789"
            value={data.longitude}
            onChange={e => onChange({ ...data, longitude: e.target.value })}
            disabled={disabled}
            type="text"
            inputMode="decimal"
          />
        </div>
      </div>

      {hasCoords && (
        <div className="space-y-2">
          <Button variant="outline" size="sm" asChild>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
              <MapPin className="h-4 w-4 mr-1" /> Lihat di Google Maps <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </Button>
          {/* Embedded map preview */}
          <div className="rounded-lg overflow-hidden border h-48">
            <iframe
              title="Lokasi Koordinat"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://maps.google.com/maps?q=${data.latitude},${data.longitude}&z=17&output=embed`}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Koordinat: {data.latitude}, {data.longitude}
          </p>
        </div>
      )}
    </div>
  );
};

export default KoordinatSection;
