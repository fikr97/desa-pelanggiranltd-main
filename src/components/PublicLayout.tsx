import React, { useState, useEffect } from 'react';
import {
  Building2, Menu, ChevronDown, ChevronRight, Sparkles, ArrowUpRight,
  MapPin, Mail, Phone, Globe, Heart, Instagram, Facebook, Youtube
} from 'lucide-react';
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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const { data: infoDesaData } = useQuery({
    queryKey: ['public-info-desa-layout'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('info_desa')
        .select('nama_desa, logo_desa, alamat_kantor, telepon, email, website, nama_kecamatan, nama_kabupaten, nama_provinsi')
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
    <Link
      to={href}
      onClick={onClick}
      className="block px-4 py-3 text-foreground/80 hover:text-foreground hover:bg-primary/5 rounded-xl transition-colors font-medium"
    >
      {children}
    </Link>
  );

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden flex flex-col">
      {/* ============================================================= */}
      {/* ANNOUNCEMENT BAR                                                */}
      {/* ============================================================= */}
      <div className="relative w-full overflow-hidden bg-gradient-to-r from-primary via-fuchsia-600 to-accent text-white text-xs md:text-sm">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)] animate-gradient-x" />
        <div className="container mx-auto px-4 py-2 flex items-center justify-center gap-2 relative">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          <span className="font-medium tracking-wide">
            Selamat datang di portal digital {infoDesaData?.nama_desa || 'Desa Kami'} — layanan 24/7
          </span>
          <ArrowUpRight className="h-3.5 w-3.5 hidden sm:inline" />
        </div>
      </div>

      {/* ============================================================= */}
      {/* HEADER - Glassmorphism sticky                                   */}
      {/* ============================================================= */}
      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-500",
          scrolled
            ? "glass-strong shadow-[0_8px_32px_-12px_hsl(222_32%_11%/0.12)] border-b border-border/60"
            : "bg-background/60 backdrop-blur-md border-b border-transparent"
        )}
      >
        <div className="container mx-auto px-4">
          <div className={cn("flex items-center justify-between transition-all duration-300", scrolled ? "py-3" : "py-4")}>
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 flex-shrink-0 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                {infoDesaData?.logo_desa ? (
                  <img
                    src={infoDesaData.logo_desa}
                    alt="Logo Desa"
                    className="relative w-11 h-11 object-contain bg-white rounded-2xl p-1.5 ring-1 ring-border shadow-sm"
                  />
                ) : (
                  <div className="relative w-11 h-11 flex items-center justify-center bg-gradient-to-br from-primary to-accent rounded-2xl shadow-sm">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                )}
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base md:text-lg font-display font-bold text-foreground leading-tight">
                  {infoDesaData?.nama_desa || 'Portal Desa'}
                </h1>
                <p className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground font-medium">
                  Sistem Informasi Desa
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:block">
              <NavigationMenu>
                <NavigationMenuList className="gap-1">
                  <NavigationMenuItem>
                    <Link to="/">
                      <NavigationMenuLink className={cn(navigationMenuTriggerStyle(), "font-medium text-sm")}>
                        Beranda
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="font-medium text-sm">Profil Desa</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid gap-3 p-6 md:w-[420px] lg:w-[520px] lg:grid-cols-[.9fr_1fr]">
                        <li className="row-span-3">
                          <NavigationMenuLink asChild>
                            <Link
                              className="relative flex h-full w-full select-none flex-col justify-end rounded-2xl bg-gradient-to-br from-primary via-fuchsia-600 to-accent p-6 no-underline outline-none text-white overflow-hidden group"
                              to="/profil-desa"
                            >
                              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.25),transparent_60%)]" />
                              <Building2 className="h-8 w-8 relative z-10" />
                              <div className="mb-2 mt-4 text-lg font-display font-bold relative z-10">
                                Profil Desa
                              </div>
                              <p className="text-sm leading-snug opacity-90 relative z-10">
                                Informasi lengkap tentang desa, sejarah, dan karakteristik wilayah.
                              </p>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                        <ListItem href="/sejarah" title="Sejarah Desa">Perjalanan dan pembentukan desa</ListItem>
                        <ListItem href="/visi-misi" title="Visi & Misi">Arah dan tujuan pembangunan</ListItem>
                        <ListItem href="/geografis" title="Kondisi Geografis">Letak dan batas wilayah</ListItem>
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="font-medium text-sm">Pemerintahan</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[420px] gap-3 p-4 md:w-[520px] md:grid-cols-2 lg:w-[600px]">
                        <ListItem href="/pemerintahan" title="Struktur Pemerintahan">Susunan organisasi pemerintahan</ListItem>
                        <ListItem href="/perangkat-desa" title="Perangkat Desa">Profil lengkap perangkat desa</ListItem>
                        <ListItem href="/lembaga-desa" title="Lembaga Desa">BPD, LPM, PKK, dan lainnya</ListItem>
                        <ListItem href="/tupoksi" title="Tugas & Fungsi">Tugas pokok perangkat</ListItem>
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="font-medium text-sm">Informasi</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[420px] gap-3 p-4 md:w-[520px] md:grid-cols-2 lg:w-[600px]">
                        <ListItem href="/berita" title="Berita Desa">Berita terkini kegiatan desa</ListItem>
                        <ListItem href="/pengumuman" title="Pengumuman">Pengumuman resmi pemerintah desa</ListItem>
                        <ListItem href="/agenda" title="Agenda Kegiatan">Jadwal kegiatan dan acara</ListItem>
                        <ListItem href="/galeri" title="Galeri Foto">Dokumentasi kegiatan desa</ListItem>
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="font-medium text-sm">Layanan</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[420px] gap-3 p-4 md:w-[520px] md:grid-cols-2 lg:w-[600px]">
                        <ListItem href="/pelayanan" title="Pelayanan Publik">Administrasi desa</ListItem>
                        <ListItem href="/surat-online" title="Surat Online">Permohonan surat keterangan</ListItem>
                        <ListItem href="/persyaratan" title="Persyaratan Surat">Syarat jenis-jenis surat</ListItem>
                        <ListItem href="/kontak" title="Kontak">Lokasi dan kontak kantor</ListItem>
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </div>

            {/* CTA + Mobile menu */}
            <div className="flex items-center gap-2">
              <Link to="/admin" className="hidden md:block">
                <Button className="btn-gradient btn-shine rounded-full h-10 px-5 text-sm font-semibold">
                  Masuk Dashboard
                  <ArrowUpRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>

              <div className="lg:hidden">
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full border-border/70">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[320px] sm:w-[380px] p-0 border-l">
                    <div className="flex flex-col h-full">
                      <div className="p-6 border-b bg-gradient-to-br from-primary/5 via-background to-accent/5">
                        <div className="flex items-center gap-3">
                          {infoDesaData?.logo_desa ? (
                            <img src={infoDesaData.logo_desa} alt="Logo" className="w-10 h-10 object-contain bg-white rounded-xl p-1 ring-1 ring-border" />
                          ) : (
                            <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-primary to-accent rounded-xl">
                              <Building2 className="h-5 w-5 text-white" />
                            </div>
                          )}
                          <div>
                            <h2 className="font-display font-bold text-base">{infoDesaData?.nama_desa || 'Portal Desa'}</h2>
                            <p className="text-xs text-muted-foreground">Menu Navigasi</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto p-4">
                        <nav className="space-y-1">
                          <MobileMenuItem href="/" onClick={() => setIsOpen(false)}>Beranda</MobileMenuItem>

                          <Collapsible open={openSubmenu === 'profil'} onOpenChange={() => toggleSubmenu('profil')}>
                            <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 text-left font-medium hover:bg-primary/5 rounded-xl transition-colors">
                              <span>Profil Desa</span>
                              {openSubmenu === 'profil' ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </CollapsibleTrigger>
                            <CollapsibleContent className="ml-3 mt-1 space-y-1 border-l border-border pl-3">
                              <MobileMenuItem href="/profil-desa" onClick={() => setIsOpen(false)}>Profil Lengkap</MobileMenuItem>
                              <MobileMenuItem href="/sejarah" onClick={() => setIsOpen(false)}>Sejarah Desa</MobileMenuItem>
                              <MobileMenuItem href="/visi-misi" onClick={() => setIsOpen(false)}>Visi & Misi</MobileMenuItem>
                              <MobileMenuItem href="/geografis" onClick={() => setIsOpen(false)}>Kondisi Geografis</MobileMenuItem>
                            </CollapsibleContent>
                          </Collapsible>

                          <Collapsible open={openSubmenu === 'pemerintahan'} onOpenChange={() => toggleSubmenu('pemerintahan')}>
                            <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 text-left font-medium hover:bg-primary/5 rounded-xl transition-colors">
                              <span>Pemerintahan</span>
                              {openSubmenu === 'pemerintahan' ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </CollapsibleTrigger>
                            <CollapsibleContent className="ml-3 mt-1 space-y-1 border-l border-border pl-3">
                              <MobileMenuItem href="/pemerintahan" onClick={() => setIsOpen(false)}>Struktur Pemerintahan</MobileMenuItem>
                              <MobileMenuItem href="/perangkat-desa" onClick={() => setIsOpen(false)}>Perangkat Desa</MobileMenuItem>
                              <MobileMenuItem href="/lembaga-desa" onClick={() => setIsOpen(false)}>Lembaga Desa</MobileMenuItem>
                              <MobileMenuItem href="/tupoksi" onClick={() => setIsOpen(false)}>Tugas & Fungsi</MobileMenuItem>
                            </CollapsibleContent>
                          </Collapsible>

                          <Collapsible open={openSubmenu === 'informasi'} onOpenChange={() => toggleSubmenu('informasi')}>
                            <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 text-left font-medium hover:bg-primary/5 rounded-xl transition-colors">
                              <span>Informasi</span>
                              {openSubmenu === 'informasi' ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </CollapsibleTrigger>
                            <CollapsibleContent className="ml-3 mt-1 space-y-1 border-l border-border pl-3">
                              <MobileMenuItem href="/berita" onClick={() => setIsOpen(false)}>Berita Desa</MobileMenuItem>
                              <MobileMenuItem href="/pengumuman" onClick={() => setIsOpen(false)}>Pengumuman</MobileMenuItem>
                              <MobileMenuItem href="/agenda" onClick={() => setIsOpen(false)}>Agenda Kegiatan</MobileMenuItem>
                              <MobileMenuItem href="/galeri" onClick={() => setIsOpen(false)}>Galeri Foto</MobileMenuItem>
                            </CollapsibleContent>
                          </Collapsible>

                          <Collapsible open={openSubmenu === 'layanan'} onOpenChange={() => toggleSubmenu('layanan')}>
                            <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 text-left font-medium hover:bg-primary/5 rounded-xl transition-colors">
                              <span>Layanan</span>
                              {openSubmenu === 'layanan' ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </CollapsibleTrigger>
                            <CollapsibleContent className="ml-3 mt-1 space-y-1 border-l border-border pl-3">
                              <MobileMenuItem href="/pelayanan" onClick={() => setIsOpen(false)}>Pelayanan Publik</MobileMenuItem>
                              <MobileMenuItem href="/surat-online" onClick={() => setIsOpen(false)}>Surat Online</MobileMenuItem>
                              <MobileMenuItem href="/persyaratan" onClick={() => setIsOpen(false)}>Persyaratan Surat</MobileMenuItem>
                              <MobileMenuItem href="/kontak" onClick={() => setIsOpen(false)}>Kontak</MobileMenuItem>
                            </CollapsibleContent>
                          </Collapsible>
                        </nav>

                        <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-primary to-accent text-white">
                          <p className="text-xs font-medium opacity-90 mb-1">Khusus Admin</p>
                          <p className="text-sm font-semibold mb-3">Masuk ke dashboard untuk mengelola data desa</p>
                          <Link to="/admin" onClick={() => setIsOpen(false)}>
                            <Button variant="secondary" className="w-full rounded-full font-semibold">
                              Masuk Dashboard <ArrowUpRight className="ml-1.5 h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ============================================================= */}
      {/* MAIN                                                            */}
      {/* ============================================================= */}
      <main className="flex-1 w-full overflow-x-hidden">{children}</main>

      {/* ============================================================= */}
      {/* FOOTER - Premium                                                */}
      {/* ============================================================= */}
      <footer className="relative overflow-hidden mt-24 bg-[#0b0b1a] text-white">
        {/* Background gradient mesh */}
        <div className="absolute inset-0 opacity-40 pointer-events-none">
          <div className="absolute top-0 -left-20 h-72 w-72 rounded-full bg-primary/40 blur-3xl animate-blob" />
          <div className="absolute bottom-0 right-10 h-80 w-80 rounded-full bg-accent/30 blur-3xl animate-blob delay-2000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-fuchsia-500/25 blur-3xl animate-blob delay-1000" />
        </div>
        <div className="absolute inset-0 bg-grid opacity-[0.08] pointer-events-none" />

        <div className="container mx-auto px-4 py-16 relative z-10">
          {/* CTA strip */}
          <div className="mb-14 rounded-3xl overflow-hidden relative border border-white/10 bg-gradient-to-r from-white/5 to-white/[0.02] backdrop-blur-xl p-8 md:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(139,92,246,0.18),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(34,211,238,0.18),transparent_60%)]" />
            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-medium text-white/90 mb-3">
                  <Sparkles className="h-3.5 w-3.5" /> Digital Government Platform
                </div>
                <h3 className="text-2xl md:text-3xl font-display font-bold leading-tight">
                  Ada pertanyaan atau butuh layanan?
                </h3>
                <p className="text-white/70 text-sm md:text-base mt-2 max-w-xl">
                  Tim pemerintah desa siap membantu. Hubungi kami atau datang langsung ke kantor desa.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {infoDesaData?.telepon && (
                  <a href={`tel:${infoDesaData.telepon}`}>
                    <Button variant="outline" className="rounded-full border-white/20 bg-white/5 text-white hover:bg-white/15 hover:text-white">
                      <Phone className="h-4 w-4 mr-2" /> {infoDesaData.telepon}
                    </Button>
                  </a>
                )}
                <Link to="/kontak">
                  <Button className="rounded-full bg-white text-[#0b0b1a] hover:bg-white/90 font-semibold">
                    Hubungi Kami <ArrowUpRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-12">
            {/* Brand */}
            <div className="md:col-span-5 space-y-5">
              <div className="flex items-center gap-3">
                {infoDesaData?.logo_desa ? (
                  <img src={infoDesaData.logo_desa} alt="Logo" className="w-12 h-12 object-contain bg-white rounded-xl p-1.5" />
                ) : (
                  <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-primary to-accent rounded-xl">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                )}
                <div>
                  <h3 className="font-display font-bold text-xl">{infoDesaData?.nama_desa || 'Portal Desa'}</h3>
                  <p className="text-white/60 text-xs uppercase tracking-[0.2em]">SIDesa Platform</p>
                </div>
              </div>
              <p className="text-white/70 text-sm leading-relaxed max-w-md">
                Sistem Informasi Desa terpadu yang membantu warga dan pemerintah desa terhubung dalam satu platform modern.
                Transparan, cepat, dan selalu tersedia kapan pun.
              </p>

              <div className="flex items-center gap-2">
                <a href="#" className="h-9 w-9 rounded-full flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/15 transition-colors">
                  <Facebook className="h-4 w-4" />
                </a>
                <a href="#" className="h-9 w-9 rounded-full flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/15 transition-colors">
                  <Instagram className="h-4 w-4" />
                </a>
                <a href="#" className="h-9 w-9 rounded-full flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/15 transition-colors">
                  <Youtube className="h-4 w-4" />
                </a>
                {infoDesaData?.website && (
                  <a href={infoDesaData.website} target="_blank" rel="noreferrer" className="h-9 w-9 rounded-full flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/15 transition-colors">
                    <Globe className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>

            {/* Links */}
            <div className="md:col-span-2">
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-[0.15em] text-white/80">Desa</h4>
              <ul className="space-y-2.5 text-sm text-white/70">
                <li><Link to="/profil-desa" className="hover:text-white transition-colors">Profil Desa</Link></li>
                <li><Link to="/sejarah" className="hover:text-white transition-colors">Sejarah</Link></li>
                <li><Link to="/visi-misi" className="hover:text-white transition-colors">Visi & Misi</Link></li>
                <li><Link to="/pemerintahan" className="hover:text-white transition-colors">Pemerintahan</Link></li>
              </ul>
            </div>

            <div className="md:col-span-2">
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-[0.15em] text-white/80">Info</h4>
              <ul className="space-y-2.5 text-sm text-white/70">
                <li><Link to="/berita" className="hover:text-white transition-colors">Berita</Link></li>
                <li><Link to="/pengumuman" className="hover:text-white transition-colors">Pengumuman</Link></li>
                <li><Link to="/agenda" className="hover:text-white transition-colors">Agenda</Link></li>
                <li><Link to="/galeri" className="hover:text-white transition-colors">Galeri</Link></li>
              </ul>
            </div>

            <div className="md:col-span-3">
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-[0.15em] text-white/80">Kontak</h4>
              <ul className="space-y-3 text-sm text-white/70">
                {infoDesaData?.alamat_kantor && (
                  <li className="flex items-start gap-2.5">
                    <MapPin className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                    <span>{infoDesaData.alamat_kantor}</span>
                  </li>
                )}
                {infoDesaData?.telepon && (
                  <li className="flex items-center gap-2.5">
                    <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>{infoDesaData.telepon}</span>
                  </li>
                )}
                {infoDesaData?.email && (
                  <li className="flex items-center gap-2.5">
                    <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="truncate">{infoDesaData.email}</span>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-white/50 text-center md:text-left">
              &copy; {currentYear} {infoDesaData?.nama_desa || 'Portal Desa'}. Dibangun dengan <Heart className="inline h-3 w-3 text-rose-400 mx-0.5" /> oleh Ihsanul Fikri.
            </p>
            <div className="flex items-center gap-5 text-xs text-white/60">
              <Link to="/privacy-policy" className="hover:text-white transition-colors">Kebijakan Privasi</Link>
              <Link to="/terms-of-service" className="hover:text-white transition-colors">Syarat Layanan</Link>
              <Link to="/admin" className="hover:text-white transition-colors">Admin</Link>
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
            "group block select-none space-y-1 rounded-xl p-3 leading-none no-underline outline-none transition-all hover:bg-primary/5 hover:translate-x-0.5",
            className
          )}
          {...props}
        >
          <div className="text-sm font-semibold leading-none group-hover:text-primary transition-colors flex items-center gap-1.5">
            {title}
            <ArrowUpRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
          </div>
          <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";

export default PublicLayout;
