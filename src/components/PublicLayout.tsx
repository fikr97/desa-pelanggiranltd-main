import React, { useState } from 'react';
import { Building2, Menu, ChevronDown, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { Link } from 'react-router-dom';

interface PublicLayoutProps {
  children: React.ReactNode;
}

const PublicLayout = ({ children }: PublicLayoutProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  const { data: infoDesaData } = useQuery({
    queryKey: ['public-info-desa-layout'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('info_desa')
        .select('nama_desa, logo_desa')
        .single();
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching info desa:', error);
      }
      return data;
    }
  });

  const toggleSubmenu = (menu: string) => {
    setOpenSubmenu(openSubmenu === menu ? null : menu);
  };

  const MobileMenuItem = ({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) => (
    <Link to={href} onClick={onClick} className="block px-4 py-3 text-foreground hover:bg-accent rounded-md transition-colors">
      {children}
    </Link>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 overflow-x-hidden">
      {/* Sticky Header dengan Navigation */}
      <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo dan Nama Desa */}
            <Link to="/" className="flex items-center space-x-4 flex-shrink-0">
              {infoDesaData?.logo_desa ? (
                <img 
                  src={infoDesaData.logo_desa} 
                  alt="Logo Desa" 
                  className="w-10 h-10 object-contain" 
                />
              ) : (
                <Building2 className="h-10 w-10 text-blue-600" />
              )}
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-foreground">
                  {infoDesaData?.nama_desa || 'Portal Desa'}
                </h1>
                <p className="text-sm text-muted-foreground">Sistem Informasi Desa</p>
              </div>
            </Link>

            {/* Desktop Navigation Menu */}
            <div className="hidden lg:block">
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <Link to="/">
                      <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                        Beranda
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                    <NavigationMenuTrigger>Profil Desa</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                        <li className="row-span-3">
                          <NavigationMenuLink asChild>
                            <Link
                              className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                              to="/profil-desa"
                            >
                              <Building2 className="h-6 w-6" />
                              <div className="mb-2 mt-4 text-lg font-medium">
                                Profil Desa
                              </div>
                              <p className="text-sm leading-tight text-muted-foreground">
                                Informasi lengkap tentang desa, sejarah, dan karakteristik wilayah.
                              </p>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                        <ListItem href="/sejarah" title="Sejarah Desa">
                          Sejarah pembentukan dan perkembangan desa
                        </ListItem>
                        <ListItem href="/visi-misi" title="Visi & Misi">
                          Visi, misi, dan tujuan pembangunan desa
                        </ListItem>
                        <ListItem href="/geografis" title="Kondisi Geografis">
                          Letak geografis dan batas wilayah desa
                        </ListItem>
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                    <NavigationMenuTrigger>Pemerintahan</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                        <ListItem href="/pemerintahan" title="Struktur Pemerintahan">
                          Susunan organisasi pemerintahan desa
                        </ListItem>
                        <ListItem href="/perangkat-desa" title="Perangkat Desa">
                          Profil lengkap perangkat desa
                        </ListItem>
                        <ListItem href="/lembaga-desa" title="Lembaga Desa">
                          BPD, LPM, PKK, dan lembaga lainnya
                        </ListItem>
                        <ListItem href="/tupoksi" title="Tugas & Fungsi">
                          Tugas pokok dan fungsi perangkat desa
                        </ListItem>
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                    <NavigationMenuTrigger>Informasi</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                        <ListItem href="/berita" title="Berita Desa">
                          Berita terkini seputar kegiatan desa
                        </ListItem>
                        <ListItem href="/pengumuman" title="Pengumuman">
                          Pengumuman resmi dari pemerintah desa
                        </ListItem>
                        <ListItem href="/agenda" title="Agenda Kegiatan">
                          Jadwal kegiatan dan acara desa
                        </ListItem>
                        <ListItem href="/galeri" title="Galeri Foto">
                          Dokumentasi kegiatan dan potensi desa
                        </ListItem>
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                    <NavigationMenuTrigger>Layanan</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                        <ListItem href="/pelayanan" title="Pelayanan Publik">
                          Informasi pelayanan administrasi desa
                        </ListItem>
                        <ListItem href="/surat-online" title="Surat Online">
                          Permohonan surat keterangan online
                        </ListItem>
                        <ListItem href="/persyaratan" title="Persyaratan Surat">
                          Persyaratan untuk berbagai jenis surat
                        </ListItem>
                        <ListItem href="/kontak" title="Kontak">
                          Informasi kontak dan lokasi kantor desa
                        </ListItem>
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                    <Link to="/admin">
                      <NavigationMenuLink className={cn(navigationMenuTriggerStyle(), "bg-primary text-primary-foreground hover:bg-primary/90")}>
                        Login
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[350px] p-0">
                  <div className="flex flex-col h-full">
                    <div className="p-6 border-b">
                      <div className="flex items-center space-x-2">
                        {infoDesaData?.logo_desa ? (
                          <img 
                            src={infoDesaData.logo_desa} 
                            alt="Logo Desa" 
                            className="w-8 h-8 object-contain" 
                          />
                        ) : (
                          <Building2 className="h-8 w-8 text-blue-600" />
                        )}
                        <div>
                          <h2 className="font-semibold text-lg">
                            {infoDesaData?.nama_desa || 'Portal Desa'}
                          </h2>
                          <p className="text-sm text-muted-foreground">Menu Navigasi</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4">
                      <nav className="space-y-2">
                        <MobileMenuItem href="/" onClick={() => setIsOpen(false)}>
                          Beranda
                        </MobileMenuItem>

                        {/* Profil Desa */}
                        <Collapsible open={openSubmenu === 'profil'} onOpenChange={() => toggleSubmenu('profil')}>
                          <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 text-left text-foreground hover:bg-accent rounded-md transition-colors">
                            <span>Profil Desa</span>
                            {openSubmenu === 'profil' ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </CollapsibleTrigger>
                          <CollapsibleContent className="ml-4 mt-2 space-y-1">
                            <MobileMenuItem href="/profil-desa" onClick={() => setIsOpen(false)}>
                              Profil Lengkap
                            </MobileMenuItem>
                            <MobileMenuItem href="/sejarah" onClick={() => setIsOpen(false)}>
                              Sejarah Desa
                            </MobileMenuItem>
                            <MobileMenuItem href="/visi-misi" onClick={() => setIsOpen(false)}>
                              Visi & Misi
                            </MobileMenuItem>
                            <MobileMenuItem href="/geografis" onClick={() => setIsOpen(false)}>
                              Kondisi Geografis
                            </MobileMenuItem>
                          </CollapsibleContent>
                        </Collapsible>

                        {/* Pemerintahan */}
                        <Collapsible open={openSubmenu === 'pemerintahan'} onOpenChange={() => toggleSubmenu('pemerintahan')}>
                          <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 text-left text-foreground hover:bg-accent rounded-md transition-colors">
                            <span>Pemerintahan</span>
                            {openSubmenu === 'pemerintahan' ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </CollapsibleTrigger>
                          <CollapsibleContent className="ml-4 mt-2 space-y-1">
                            <MobileMenuItem href="/pemerintahan" onClick={() => setIsOpen(false)}>
                              Struktur Pemerintahan
                            </MobileMenuItem>
                            <MobileMenuItem href="/perangkat-desa" onClick={() => setIsOpen(false)}>
                              Perangkat Desa
                            </MobileMenuItem>
                            <MobileMenuItem href="/lembaga-desa" onClick={() => setIsOpen(false)}>
                              Lembaga Desa
                            </MobileMenuItem>
                            <MobileMenuItem href="/tupoksi" onClick={() => setIsOpen(false)}>
                              Tugas & Fungsi
                            </MobileMenuItem>
                          </CollapsibleContent>
                        </Collapsible>

                        {/* Informasi */}
                        <Collapsible open={openSubmenu === 'informasi'} onOpenChange={() => toggleSubmenu('informasi')}>
                          <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 text-left text-foreground hover:bg-accent rounded-md transition-colors">
                            <span>Informasi</span>
                            {openSubmenu === 'informasi' ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </CollapsibleTrigger>
                          <CollapsibleContent className="ml-4 mt-2 space-y-1">
                            <MobileMenuItem href="/berita" onClick={() => setIsOpen(false)}>
                              Berita Desa
                            </MobileMenuItem>
                            <MobileMenuItem href="/pengumuman" onClick={() => setIsOpen(false)}>
                              Pengumuman
                            </MobileMenuItem>
                            <MobileMenuItem href="/agenda" onClick={() => setIsOpen(false)}>
                              Agenda Kegiatan
                            </MobileMenuItem>
                            <MobileMenuItem href="/galeri" onClick={() => setIsOpen(false)}>
                              Galeri Foto
                            </MobileMenuItem>
                          </CollapsibleContent>
                        </Collapsible>

                        {/* Layanan */}
                        <Collapsible open={openSubmenu === 'layanan'} onOpenChange={() => toggleSubmenu('layanan')}>
                          <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 text-left text-foreground hover:bg-accent rounded-md transition-colors">
                            <span>Layanan</span>
                            {openSubmenu === 'layanan' ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </CollapsibleTrigger>
                          <CollapsibleContent className="ml-4 mt-2 space-y-1">
                            <MobileMenuItem href="/pelayanan" onClick={() => setIsOpen(false)}>
                              Pelayanan Publik
                            </MobileMenuItem>
                            <MobileMenuItem href="/surat-online" onClick={() => setIsOpen(false)}>
                              Surat Online
                            </MobileMenuItem>
                            <MobileMenuItem href="/persyaratan" onClick={() => setIsOpen(false)}>
                              Persyaratan Surat
                            </MobileMenuItem>
                            <MobileMenuItem href="/kontak" onClick={() => setIsOpen(false)}>
                              Kontak
                            </MobileMenuItem>
                          </CollapsibleContent>
                        </Collapsible>

                        <div className="border-t pt-4 mt-4">
                          <MobileMenuItem href="/admin" onClick={() => setIsOpen(false)}>
                            <div className="flex items-center space-x-2 bg-primary text-primary-foreground rounded-md p-2">
                              <span>Portal Admin</span>
                            </div>
                          </MobileMenuItem>
                        </div>
                      </nav>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full overflow-x-hidden">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-background mt-auto">
        <div className="container mx-auto py-6 px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Ihsanul Fikri. All rights reserved.</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/privacy-policy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms-of-service" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & { title: string }
>(({ className, title, children, href, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          ref={ref}
          to={href || "#"}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  )
});
ListItem.displayName = "ListItem";

export default PublicLayout;
