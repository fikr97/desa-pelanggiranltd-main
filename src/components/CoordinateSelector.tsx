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
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Initialize coordinates when component mounts or value changes
  useEffect(() => {
    if (value) {
      setInputLat(typeof value.lat !== 'undefined' && value.lat !== '' ? String(value.lat) : '');
      setInputLng(typeof value.lng !== 'undefined' && value.lng !== '' ? String(value.lng) : '');
      
      // Update map if valid coordinates are provided
      if (value.lat && value.lng && !isNaN(Number(value.lat)) && !isNaN(Number(value.lng))) {
        const latNum = Number(value.lat);
        const lngNum = Number(value.lng);
        updateMapUrl(latNum, lngNum);
      }
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
          updateMapUrl(latitude, longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Gagal mendapatkan lokasi saat ini. Pastikan Anda mengizinkan akses lokasi.');
        }
      );
    } else {
      alert('Geolocation tidak didukung oleh browser ini.');
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
            updateMapUrl(latNum, lngNum);
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

  const updateMapUrl = (lat: number, lng: number) => {
    // Create a simple HTML page with Leaflet that allows map clicking
    const mapHtml = encodeURIComponent(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Coordinate Selector</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>
          body, html { margin: 0; padding: 0; height: 100%; width: 100%; }
          #map { height: 100%; width: 100%; }
          .coordinate-display {
            position: absolute;
            top: 10px;
            right: 10px;
            background: white;
            padding: 10px;
            border-radius: 4px;
            z-index: 1000;
            font-family: Arial, sans-serif;
            font-size: 14px;
          }
          .click-instruction {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 255, 255, 0.9);
            padding: 10px;
            border-radius: 4px;
            z-index: 1000;
            font-family: Arial, sans-serif;
            font-size: 16px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <div class="coordinate-display">
          Klik pada peta untuk memilih koordinat
        </div>
        <div class="click-instruction" id="clickInstruction">
          Klik di sini
        </div>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
          const map = L.map('map').setView([${lat}, ${lng}], 15);
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }).addTo(map);
          
          // Add a marker at the initial location
          let marker = L.marker([${lat}, ${lng}]).addTo(map);
          
          map.on('click', function(e) {
            // Remove the existing marker and add a new one
            map.removeLayer(marker);
            marker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(map);
            
            // Update coordinates display
            document.getElementById('clickInstruction').textContent = 
              'Lat: ' + e.latlng.lat.toFixed(6) + ', Lng: ' + e.latlng.lng.toFixed(6);
            
            // Send the coordinates to the parent window
            parent.postMessage({
              type: 'COORDINATE_SELECTED',
              lat: e.latlng.lat.toFixed(6),
              lng: e.latlng.lng.toFixed(6)
            }, '*');
          });
        </script>
      </body>
      </html>
    `);
    
    setMapUrl(`data:text/html;charset=utf-8,${mapHtml}`);
    setIsMapLoaded(true);
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
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" type="button">
              <Crosshair className="h-4 w-4 mr-2" />
              Pilih dari Peta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] w-full p-0">
            <DialogHeader className="p-4 pb-2">
              <DialogTitle>Pilih Lokasi dari Peta</DialogTitle>
            </DialogHeader>
            <div className="p-4 space-y-3">
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari lokasi..."
                  className="flex-grow"
                />
                <Button variant="outline" type="submit">
                  <Search className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={handleUseCurrentLocation} type="button">
                  <LocateFixed className="h-4 w-4" />
                </Button>
              </form>
              <div className="border rounded-lg h-[500px] relative overflow-hidden">
                {isMapLoaded && (
                  <iframe
                    ref={iframeRef}
                    src={mapUrl}
                    className="w-full h-full border-0"
                    title="Map Selector"
                  />
                )}
                {!isMapLoaded && (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <p className="text-gray-500">Memuat peta...</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
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