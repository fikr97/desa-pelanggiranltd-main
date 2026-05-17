import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MapPin, ExternalLink, Locate, Loader2 } from 'lucide-react';

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
  const [tracking, setTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watchRef = useRef<number | null>(null);

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('Browser tidak mendukung GPS');
      return;
    }
    setError(null);
    setTracking(true);
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        onChange({
          latitude: pos.coords.latitude.toFixed(7),
          longitude: pos.coords.longitude.toFixed(7),
        });
      },
      (err) => {
        setError(err.code === 1 ? 'Izin lokasi ditolak' : 'Gagal mendapatkan lokasi');
        setTracking(false);
      },
      { enableHighAccuracy: true, maximumAge: 0 }
    );
  };

  const stopTracking = () => {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    setTracking(false);
  };

  useEffect(() => () => { if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current); }, []);

  const hasCoords = data.latitude.trim() !== '' && data.longitude.trim() !== '';
  const mapsUrl = hasCoords ? `https://www.google.com/maps?q=${data.latitude},${data.longitude}` : '';

  return (
    <div className="space-y-3">
      {/* Auto tracking button */}
      <Button
        type="button"
        variant={tracking ? 'destructive' : 'default'}
        size="sm"
        onClick={tracking ? stopTracking : startTracking}
        disabled={disabled}
      >
        {tracking ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Locate className="h-4 w-4 mr-1" />}
        {tracking ? 'Stop Tracking' : 'Auto Tracking GPS'}
      </Button>
      {tracking && <p className="text-xs text-green-600 animate-pulse">● Melacak lokasi realtime...</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Latitude</Label>
          <Input
            placeholder="Contoh: 1.234567"
            value={data.latitude}
            onChange={e => onChange({ ...data, latitude: e.target.value })}
            disabled={disabled}
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
          <p className="text-xs text-muted-foreground">Koordinat: {data.latitude}, {data.longitude}</p>
        </div>
      )}
    </div>
  );
};

export default KoordinatSection;
