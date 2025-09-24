import React, { useState } from 'react';
import { Button } from './ui/button';
import { Upload } from 'lucide-react';
import ImportDataDialog from './ImportDataDialog';

interface ImportDataButtonProps {
  formDef: any;
  residents: any[];
  className?: string;
}

const ImportDataButton: React.FC<ImportDataButtonProps> = ({ formDef, residents, className }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Button 
        variant="outline" 
        onClick={() => setIsDialogOpen(true)}
        className={className || "w-full"}
      >
        <Upload className="h-4 w-4 mr-2" />
        Impor Data
      </Button>
      
      <ImportDataDialog
        formDef={formDef}
        residents={residents}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  );
};

export default ImportDataButton;