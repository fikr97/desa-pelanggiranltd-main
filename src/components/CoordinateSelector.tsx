import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Crosshair, MapPin, Search, LocateFixed } from 'lucide-react';

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
  const [mapCenter, setMapCenter] = useState({ lat: -6.200000, lng: 106.816666 }); // Default to Indonesia

  // Initialize coordinates when component mounts or value changes
  useEffect(() => {
    if (value) {
      setInputLat(typeof value.lat !== 'undefined' && value.lat !== '' ? String(value.lat) : '');
      setInputLng(typeof value.lng !== 'undefined' && value.lng !== '' ? String(value.lng) : '');
      
      // Update map center if valid coordinates are provided
      if (value.lat && value.lng && !isNaN(Number(value.lat)) && !isNaN(Number(value.lng))) {
        setMapCenter({ lat: Number(value.lat), lng: Number(value.lng) });
      }
    }
  }, [value]);

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setInputLat(String(latitude));
          setInputLng(String(longitude));
          onChange({ lat: String(latitude), lng: String(longitude) });
          setMapCenter({ lat: latitude, lng: longitude });
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
            setInputLat(lat);
            setInputLng(lon);
            onChange({ lat, lng: lon });
            setMapCenter({ lat: parseFloat(lat), lng: parseFloat(lon) });
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

  // Generate the map URL based on coordinates
  const generateMapUrl = () => {
    const zoom = 15; // Default zoom level
    let lat = inputLat && !isNaN(Number(inputLat)) ? Number(inputLat) : mapCenter.lat;
    let lng = inputLng && !isNaN(Number(inputLng)) ? Number(inputLng) : mapCenter.lng;
    
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01}%2C${lat - 0.01}%2C${lng + 0.01}%2C${lat + 0.01}&layer=mapnik`;
  };

  return (
    <div className="space-y-2">
      <Label>Geo-tagging (Koordinat)</Label>
      <div className="flex items-center gap-2">
        <Input
          value={inputLat}
          onChange={(e) => setInputLat(e.target.value)}
          placeholder="Latitude"
          type="text"
        />
        <Input
          value={inputLng}
          onChange={(e) => setInputLng(e.target.value)}
          placeholder="Longitude"
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
                <iframe
                  src={generateMapUrl()}
                  className="w-full h-full border-0"
                  title="Map Selector"
                />
                <div className="absolute top-4 left-4 bg-white p-2 rounded shadow">
                  <div className="text-xs">
                    <div>Lat: {inputLat || 'Belum dipilih'}</div>
                    <div>Lng: {inputLng || 'Belum dipilih'}</div>
                  </div>
                </div>
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
        Klik "Pilih dari Peta" untuk menandai lokasi secara langsung pada peta.
      </p>
    </div>
  );
};

export default CoordinateSelector;