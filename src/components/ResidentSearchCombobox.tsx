
import React, { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ResidentSearchComboboxProps {
  residents: any[];
  value: string;
  onSelect: (resident: any) => void;
  placeholder?: string;
}

const ResidentSearchCombobox = ({ 
  residents, 
  value, 
  onSelect, 
  placeholder = "Cari nama atau NIK..." 
}: ResidentSearchComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const filteredResidents = residents.filter(resident =>
    resident.nama.toLowerCase().includes(searchValue.toLowerCase()) ||
    resident.nik.includes(searchValue)
  );

  const selectedResident = residents.find(r => r.nik === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedResident 
            ? `${selectedResident.nama} (${selectedResident.nik})`
            : placeholder
          }
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" side="bottom" align="start">
        <Command>
          <CommandInput 
            placeholder={placeholder}
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandEmpty>Tidak ada data ditemukan.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {filteredResidents.slice(0, 50).map((resident) => (
                <CommandItem
                  key={resident.id}
                  value={`${resident.nama} ${resident.nik}`}
                  onSelect={() => {
                    onSelect(resident);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === resident.nik ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{resident.nama}</span>
                    <span className="text-sm text-muted-foreground">NIK: {resident.nik}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default ResidentSearchCombobox;
