import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Crosshair, Search, LocateFixed, Loader2 } from 'lucide-react';

interface CoordinateSelectorProps {
  value: string | { lat: number | string; lng: number | string } | null;
  onChange: (coords: string) => void;
  placeholder?: string;
}

const CoordinateSelector: React.FC<CoordinateSelectorProps> = ({ value, onChange, placeholder }) => {
  const [open, setOpen] = useState(false);
  const [inputLat, setInputLat] = useState<string>('');
  const [inputLng, setInputLng] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [mapUrl, setMapUrl] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Initialize coordinates when component mounts or value changes
  useEffect(() => {
    if (value) {
      if (typeof value === 'string' && value.includes(',')) {
        // Handle string format "lat,lng"
        const [lat, lng] = value.split(',').map(coord => coord.trim());
        if (lat && lng) {
          setInputLat(lat);
          setInputLng(lng);
        }
      } else if (typeof value === 'object' && value !== null) {
        // Handle object format
        setInputLat(String(value.lat || ''));
        setInputLng(String(value.lng || ''));
      }
    } else {
      setInputLat('');
      setInputLng('');
    }
  }, [value]);

  // Handle messages from the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only process messages from our coordinate map
      if (event.data && event.data.type === 'COORDINATE_SELECTED') {
        const { lat, lng } = event.data;
        setInputLat(lat);
        setInputLng(lng);
        onChange(`${lat}, ${lng}`);
        
        // Update the map URL to center on the selected coordinates
        updateMapUrl(parseFloat(lat), parseFloat(lng), false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onChange]);

  // Send coordinate updates to the iframe when input changes
  useEffect(() => {
    if (iframeRef.current && inputLat && inputLng && open) {
      const latNum = parseFloat(inputLat);
      const lngNum = parseFloat(inputLng);
      
      if (!isNaN(latNum) && !isNaN(lngNum)) {
        // Send the current coordinates to the map iframe
        iframeRef.current.contentWindow?.postMessage({
          type: 'UPDATE_COORDINATES',
          lat: latNum,
          lng: lngNum
        }, '*');
      }
    }
  }, [inputLat, inputLng, open]);

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsGettingLocation(true);
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsGettingLocation(false);
          
          const { latitude, longitude } = position.coords;
          const latStr = String(latitude.toFixed(6));
          const lngStr = String(longitude.toFixed(6));
          setInputLat(latStr);
          setInputLng(lngStr);
          onChange(`${latStr}, ${lngStr}`);
          updateMapUrl(latitude, longitude, false); // Don't auto-center again
        },
        (error) => {
          setIsGettingLocation(false);
          console.error('Error getting location:', error);
          
          let errorMessage = 'Gagal mendapatkan lokasi saat ini.';
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Izin akses lokasi ditolak. Silakan periksa pengaturan browser Anda.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Informasi lokasi tidak tersedia.';
              break;
            // Timeout tidak akan terjadi karena kita set timeout: Infinity
            default:
              errorMessage = 'Terjadi kesalahan saat mendapatkan lokasi.';
              break;
          }
          
          alert(errorMessage);
          // Fallback to default map
          updateMapUrl(-6.200000, 106.816666, false);
        },
        {
          enableHighAccuracy: true,
          timeout: Infinity, // Tidak ada batas waktu
          maximumAge: 0      // Tidak menggunakan cache
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
            const latStr = latNum.toFixed(6);
            const lngStr = lngNum.toFixed(6);
            
            setInputLat(latStr);
            setInputLng(lngStr);
            onChange(`${latStr}, ${lngStr}`);
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
    // Validate coordinates before confirming
    const latNum = parseFloat(inputLat);
    const lngNum = parseFloat(inputLng);
    
    if (isNaN(latNum) || isNaN(lngNum) || Math.abs(latNum) > 90 || Math.abs(lngNum) > 180) {
      alert('Koordinat tidak valid. Silakan masukkan koordinat yang benar.');
      return;
    }
    
    onChange(`${latNum.toFixed(6)}, ${lngNum.toFixed(6)}`);
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
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);
        
        if (!isNaN(latNum) && !isNaN(lngNum)) {
          // Format coordinates to 6 decimal places for consistency
          const formattedLat = latNum.toFixed(6);
          const formattedLng = lngNum.toFixed(6);
          
          setInputLat(formattedLat);
          setInputLng(formattedLng);
          onChange(`${formattedLat}, ${formattedLng}`);
          
          if (!isNaN(latNum) && !isNaN(lngNum)) {
            updateMapUrl(latNum, lngNum);
          }
        }
      }
    } else if (value === '') {
      setInputLat('');
      setInputLng('');
      onChange('');
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
              // When dialog opens, set the map to use default location or current coordinates
              if (inputLat && inputLng && !isNaN(parseFloat(inputLat)) && !isNaN(parseFloat(inputLng))) {
                // Use existing coordinates if available
                updateMapUrl(parseFloat(inputLat), parseFloat(inputLng), false);
              } else {
                // Use default coordinates
                updateMapUrl(-6.200000, 106.816666, true); // May attempt to use current location
              }
              // Reset loading state when dialog opens
              setIsGettingLocation(false);
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
                <Button variant="outline" onClick={handleUseCurrentLocation} type="button" disabled={isGettingLocation}>
                  {isGettingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
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