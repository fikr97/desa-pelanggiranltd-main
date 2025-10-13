import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Crosshair, Search, LocateFixed } from 'lucide-react';

interface CoordinateSelectorProps {
  value: { lat: number | string; lng: number | string };
  onChange: (coords: { lat: number | string; lng: number | string }) => void;
  placeholder?: string;
}

const CoordinateSelector: React.FC<CoordinateSelectorProps> = ({ value, onChange, placeholder }) => {
  const [open, setOpen] = useState(false);
  const [inputLat, setInputLat] = useState<string>(typeof value?.lat !== 'undefined' && value.lat !== '' ? String(value.lat) : '');
  const [inputLng, setInputLng] = useState<string>(typeof value?.lng !== 'undefined' && value.lng !== '' ? String(value.lng) : '');
  const [searchQuery, setSearchQuery] = useState('');
  const [mapUrl, setMapUrl] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Initialize coordinates when component mounts or value changes
  useEffect(() => {
    if (value) {
      setInputLat(typeof value.lat !== 'undefined' && value.lat !== '' ? String(value.lat) : '');
      setInputLng(typeof value.lng !== 'undefined' && value.lng !== '' ? String(value.lng) : '');
    }
  }, [value]);

  // Handle messages from the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'COORDINATE_SELECTED') {
        const { lat, lng } = event.data;
        setInputLat(lat);
        setInputLng(lng);
        onChange({ lat, lng });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onChange]);

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const latStr = String(latitude);
          const lngStr = String(longitude);
          setInputLat(latStr);
          setInputLng(lngStr);
          onChange({ lat: latStr, lng: lngStr });
          updateMapUrl(latitude, longitude, false); // Don't auto-center again
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Gagal mendapatkan lokasi saat ini. Pastikan Anda mengizinkan akses lokasi.');
          // Fallback to default map
          updateMapUrl(-6.200000, 106.816666, false);
        }
      );
    } else {
      alert('Geolocation tidak didukung oleh browser ini.');
      // Fallback to default map
      updateMapUrl(-6.200000, 106.816666, false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Use OpenStreetMap Nominatim API to search for the location
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`)
        .then(response => response.json())
        .then(data => {
          if (data && data.length > 0) {
            const { lat, lon } = data[0];
            const latNum = parseFloat(lat);
            const lngNum = parseFloat(lon);
            setInputLat(lat);
            setInputLng(lon);
            onChange({ lat, lng: lon });
            updateMapUrl(latNum, lngNum, false);
          } else {
            alert('Lokasi tidak ditemukan.');
          }
        })
        .catch(error => {
          console.error('Error searching location:', error);
          alert('Gagal mencari lokasi.');
        });
    }
  };

  const handleConfirm = () => {
    onChange({ lat: inputLat, lng: inputLng });
    setOpen(false);
  };

  const updateMapUrl = (lat: number, lng: number, useCurrentLocation: boolean = false) => {
    // Use the separate HTML file with proper Leaflet integration
    setMapUrl(`/coordinate-map.html?lat=${lat}&lng=${lng}${useCurrentLocation ? '&useCurrentLocation=true' : ''}`);
  };

  // Handle coordinate input change
  const handleCoordinateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.includes(',')) {
      const [lat, lng] = value.split(',').map(coord => coord.trim());
      if (lat && lng) {
        setInputLat(lat);
        setInputLng(lng);
        onChange({ lat, lng });
        if (!isNaN(Number(lat)) && !isNaN(Number(lng))) {
          updateMapUrl(Number(lat), Number(lng));
        }
      }
    } else if (value === '') {
      setInputLat('');
      setInputLng('');
      onChange({ lat: '', lng: '' });
    }
  };

  return (
    <div className="space-y-2">
      <Label>Geo-tagging (Koordinat)</Label>
      <div className="space-y-2">
        <Input
          value={inputLat && inputLng ? `${inputLat}, ${inputLng}` : ''}
          onChange={handleCoordinateInputChange}
          placeholder="Contoh: -6.200000, 106.816666"
          type="text"
        />
        <Dialog 
          open={open} 
          onOpenChange={(newOpen) => {
            if (newOpen) {
              // When dialog opens, set the map to use current location if possible
              if (navigator.geolocation) {
                updateMapUrl(-6.200000, 106.816666, true); // Use current location
              } else {
                updateMapUrl(-6.200000, 106.816666, false); // Default to Indonesia
              }
            }
            setOpen(newOpen);
          }}
        >
          <DialogTrigger asChild>
            <Button variant="outline" type="button">
              <Crosshair className="h-4 w-4 mr-2" />
              Pilih dari Peta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-[95vh] p-0 overflow-hidden flex flex-col">
            <DialogHeader className="p-4 pb-2">
              <DialogTitle>Pilih Lokasi dari Peta</DialogTitle>
            </DialogHeader>
            <div className="flex-1 flex flex-col p-0 space-y-3 overflow-hidden">
              <div className="p-4 border-b flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari lokasi..."
                  className="flex-grow"
                />
                <Button variant="outline" onClick={handleSearch} type="button">
                  <Search className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={handleUseCurrentLocation} type="button">
                  <LocateFixed className="h-4 w-4" />
                </Button>
              </div>
              <div className="border-t flex-1 relative overflow-hidden">
                <iframe
                  ref={iframeRef}
                  src={mapUrl}
                  className="w-full h-full border-0"
                  title="Map Selector"
                />
              </div>
              <div className="p-4 border-t flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)} type="button">Batal</Button>
                <Button onClick={handleConfirm} type="button">Gunakan Lokasi Ini</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <p className="text-xs text-muted-foreground">
        Masukkan koordinat atau klik "Pilih dari Peta" untuk menandai lokasi secara langsung.
      </p>
    </div>
  );
};

export default CoordinateSelector;