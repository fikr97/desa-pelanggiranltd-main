
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/components/ThemeProvider';
import ProtectedRoute from '@/components/ProtectedRoute';
import Index from "./pages/Index";
import PendudukPage from "./pages/PendudukPage";
import DataKeluargaPage from "./pages/DataKeluargaPage";
import InfoDesaPage from "./pages/InfoDesaPage";
import WilayahPage from "./pages/WilayahPage";
import StatistikPage from "./pages/StatistikPage";
import LaporanPage from "./pages/LaporanPage";
import PengaturanPage from "./pages/PengaturanPage";
import TemplateSuratPage from "./pages/TemplateSuratPage";
import ArsipSuratKeluarPage from "./pages/ArsipSuratKeluarPage";
import FormTugasPage from "./pages/FormTugasPage";
import FormDataEntryPage from "./pages/FormDataEntryPage";
import NotFound from "./pages/NotFound";
import PublicHome from "./pages/PublicHome";
import PublicProfilDesa from "./pages/PublicProfilDesa";
import PublicPemerintahan from "./pages/PublicPemerintahan";
import AuthPage from "./pages/AuthPage";
import AdminContentPage from "./pages/AdminContentPage";
import UserManagementPage from "./pages/UserManagementPage";
import UserProfilePage from "./pages/UserProfilePage";
import SejarahDesa from "./pages/SejarahDesa";
import VisiMisi from "./pages/VisiMisi";
import KondisiGeografis from "./pages/KondisiGeografis";
import BeritaPage from "./pages/BeritaPage";
import BeritaDetailPage from "./pages/BeritaDetailPage";
import GaleriPage from "./pages/GaleriPage";
import PengumumanPage from "./pages/PengumumanPage";
import AgendaPage from "./pages/AgendaPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="desa-ui-theme">
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<PublicHome />} />
            <Route path="/profil-desa" element={<PublicProfilDesa />} />
            <Route path="/pemerintahan" element={<PublicPemerintahan />} />
            <Route path="/sejarah" element={<SejarahDesa />} />
            <Route path="/visi-misi" element={<VisiMisi />} />
            <Route path="/geografis" element={<KondisiGeografis />} />
            <Route path="/berita" element={<BeritaPage />} />
            <Route path="/berita/:slug" element={<BeritaDetailPage />} />
            <Route path="/galeri" element={<GaleriPage />} />
            <Route path="/pengumuman" element={<PengumumanPage />} />
            <Route path="/agenda" element={<AgendaPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            
            {/* Protected admin/dashboard routes */}
            <Route path="/admin" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/penduduk" element={
              <ProtectedRoute>
                <PendudukPage />
              </ProtectedRoute>
            } />
            <Route path="/data-keluarga" element={
              <ProtectedRoute>
                <DataKeluargaPage />
              </ProtectedRoute>
            } />
            <Route path="/wilayah" element={
              <ProtectedRoute requiredRole="admin">
                <WilayahPage />
              </ProtectedRoute>
            } />
            <Route path="/info-desa" element={
              <ProtectedRoute>
                <InfoDesaPage />
              </ProtectedRoute>
            } />
            <Route path="/template-surat" element={
              <ProtectedRoute>
                <TemplateSuratPage />
              </ProtectedRoute>
            } />
            <Route path="/arsip-surat-keluar" element={
              <ProtectedRoute>
                <ArsipSuratKeluarPage />
              </ProtectedRoute>
            } />
            <Route path="/form-tugas" element={
              <ProtectedRoute>
                <FormTugasPage />
              </ProtectedRoute>
            } />
            <Route path="/form-tugas/:formId/data" element={
              <ProtectedRoute>
                <FormDataEntryPage />
              </ProtectedRoute>
            } />
            <Route path="/statistik" element={
              <ProtectedRoute>
                <StatistikPage />
              </ProtectedRoute>
            } />
            <Route path="/laporan" element={
              <ProtectedRoute>
                <LaporanPage />
              </ProtectedRoute>
            } />
            <Route path="/pengaturan" element={
              <ProtectedRoute>
                <PengaturanPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/content" element={
              <ProtectedRoute requiredRole="admin">
                <AdminContentPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute requiredRole="admin">
                <UserManagementPage />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <UserProfilePage />
              </ProtectedRoute>
            } />
            
            {/* Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </ThemeProvider>
</QueryClientProvider>
);

export default App;
