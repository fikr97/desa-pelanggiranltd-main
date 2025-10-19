import React, { useState, useRef, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface MultiSelectFilterProps {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  label: string;
}

const MultiSelectFilter: React.FC<MultiSelectFilterProps> = ({
  options,
  value = [],
  onChange,
  placeholder = "Pilih opsi...",
  label
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleOptionToggle = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter(item => item !== option));
    } else {
      onChange([...value, option]);
    }
  };

  const handleSelectAll = () => {
    if (value.length === options.length) {
      onChange([]);
    } else {
      onChange([...options]);
    }
  };

  const handleClear = () => {
    onChange([]);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        type="button"
        variant="outline"
        className="w-full justify-between text-left h-9"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">
          {value.length === 0
            ? placeholder
            : `${value.length} ${label} dipilih`}
        </span>
        <X 
          className="h-4 w-4 opacity-50" 
          onClick={(e) => {
            e.stopPropagation();
            handleClear();
          }}
        />
      </Button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-input rounded-md shadow-lg max-h-60 overflow-auto">
          <div className="p-2 border-b">
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={handleSelectAll}
              >
                {value.length === options.length ? 'Bersihkan Semua' : 'Pilih Semua'}
              </Button>
              <div className="flex-1" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={handleClear}
              >
                Bersihkan
              </Button>
            </div>
            <input
              type="text"
              placeholder={`Cari ${label}...`}
              className="w-full mt-2 p-1 text-sm border rounded h-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          <div className="p-1">
            {filteredOptions.map((option) => (
              <div
                key={option}
                className="flex items-center gap-2 p-2 hover:bg-accent rounded-sm cursor-pointer"
                onClick={() => handleOptionToggle(option)}
              >
                <Checkbox
                  checked={value.includes(option)}
                  onCheckedChange={() => handleOptionToggle(option)}
                />
                <span className="text-sm">{option}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelectFilter;