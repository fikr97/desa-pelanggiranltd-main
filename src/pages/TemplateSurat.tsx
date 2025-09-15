
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Edit, Trash2, Eye, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import TemplateDesigner from '@/components/TemplateDesigner';
import SuratGenerator from '@/components/SuratGenerator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const TemplateSurat = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [isDesignerOpen, setIsDesignerOpen] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  // Fetch templates
  const { data: templates, refetch } = useQuery({
    queryKey: ['surat-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('surat_template')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const filteredTemplates = templates?.filter(template =>
    template.nama_template.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.deskripsi?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleDeleteTemplate = async (id: string, templateUrl: string) => {
    try {
      // Hapus file DOCX dari storage jika ada
      if (templateUrl && templateUrl.includes('surat-docx')) {
        const fileName = templateUrl.split('/').pop();
        if (fileName) {
          const filePath = `templates/${fileName}`;
          const { error: storageError } = await supabase.storage
            .from('surat-docx')
            .remove([filePath]);
          
          if (storageError) {
            console.error('Error deleting file from storage:', storageError);
          }
        }
      }

      // Hapus template dari database
      const { error } = await supabase
        .from('surat_template')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Template surat dan file DOCX berhasil dihapus',
      });
      refetch();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: 'Gagal',
        description: 'Terjadi kesalahan saat menghapus template',
        variant: 'destructive',
      });
    }
  };

  const handleCreateNew = () => {
    setSelectedTemplate(null);
    setIsDesignerOpen(true);
  };

  const handleEditTemplate = (template: any) => {
    setSelectedTemplate(template);
    setIsDesignerOpen(true);
  };

  const handleGenerateSurat = (template: any) => {
    setSelectedTemplate(template);
    setIsGeneratorOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Surat Menyurat</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Kelola template surat desa dengan sistem placeholder dinamis</p>
          </div>
          {profile?.role === 'admin' && (
            <Button onClick={handleCreateNew} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Buat Template Baru
            </Button>
          )}
        </div>

        <div className="w-full">
          <Input
            placeholder="Cari template surat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md"
          />
        </div>

        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Belum ada template surat</h3>
            <p className="text-muted-foreground mb-4">
              Mulai dengan membuat template surat pertama Anda
            </p>
            {profile?.role === 'admin' && (
              <Button onClick={handleCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Buat Template Baru
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Template Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-foreground truncate">
                            {template.nama_template}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {template.deskripsi || 'Tidak ada deskripsi'}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-xs font-medium">
                              {template.kode_surat}
                            </span>
                            <Badge variant={template.status === 'Aktif' ? 'default' : 'secondary'} className="text-xs">
                              {template.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 lg:flex-nowrap lg:flex-shrink-0">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleGenerateSurat(template)}
                        className="flex-1 lg:flex-none"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Buat Surat</span>
                        <span className="sm:hidden">Buat</span>
                      </Button>
                      {profile?.role === 'admin' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditTemplate(template)}
                            className="flex-1 lg:flex-none"
                          >
                            <Edit className="h-4 w-4" />
                            <span className="ml-2 hidden sm:inline">Edit</span>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 lg:flex-none text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="ml-2 hidden sm:inline">Hapus</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tindakan ini tidak dapat dibatalkan. Ini akan menghapus template surat secara permanen dan file DOCX terkait dari server.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteTemplate(template.id, template.konten_template)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Hapus
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Template Designer Dialog */}
        <Dialog open={isDesignerOpen} onOpenChange={setIsDesignerOpen}>
          <DialogContent className="max-w-7xl h-[90vh] p-0">
            <DialogHeader className="px-6 py-4 border-b">
              <DialogTitle>
                {selectedTemplate ? 'Edit Template Surat' : 'Buat Template Surat Baru'}
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="flex-1 px-6">
              <div className="py-4">
                <TemplateDesigner
                  template={selectedTemplate}
                  onSave={() => {
                    setIsDesignerOpen(false);
                    refetch();
                    toast({
                      title: 'Berhasil',
                      description: 'Template surat berhasil disimpan',
                    });
                  }}
                  onCancel={() => setIsDesignerOpen(false)}
                />
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Surat Generator Dialog */}
        <Dialog open={isGeneratorOpen} onOpenChange={setIsGeneratorOpen}>
          <DialogContent className="max-w-6xl h-[90vh] p-0">
            <DialogHeader className="px-6 py-4 border-b">
              <DialogTitle>Buat Surat: {selectedTemplate?.nama_template}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="flex-1 px-6">
              <div className="py-4">
                <SuratGenerator
                  template={selectedTemplate}
                  onSave={() => {
                    setIsGeneratorOpen(false);
                    toast({
                      title: 'Berhasil',
                      description: 'Surat berhasil dibuat',
                    });
                  }}
                  onCancel={() => setIsGeneratorOpen(false)}
                />
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default TemplateSurat;
