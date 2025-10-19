
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/components/ThemeProvider';
import AdminWrapper from '@/components/AdminWrapper';
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
    <ThemeProvider defaultTheme="light" storageKey="desa-ui-theme">
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes - menggunakan ThemeProvider default (light) */}
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
              
              {/* Protected admin/dashboard routes - menggunakan AdminThemeProvider */}
              <Route path="/admin" element={
                <AdminWrapper>
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                </AdminWrapper>
              } />
              <Route path="/dashboard" element={
                <AdminWrapper>
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                </AdminWrapper>
              } />
              <Route path="/penduduk" element={
                <AdminWrapper>
                  <ProtectedRoute>
                    <PendudukPage />
                  </ProtectedRoute>
                </AdminWrapper>
              } />
              <Route path="/data-keluarga" element={
                <AdminWrapper>
                  <ProtectedRoute>
                    <DataKeluargaPage />
                  </ProtectedRoute>
                </AdminWrapper>
              } />
              <Route path="/wilayah" element={
                <AdminWrapper>
                  <ProtectedRoute allowedRoles={['admin', 'kadus']}>
                    <WilayahPage />
                  </ProtectedRoute>
                </AdminWrapper>
              } />
              <Route path="/info-desa" element={
                <AdminWrapper>
                  <ProtectedRoute>
                    <InfoDesaPage />
                  </ProtectedRoute>
                </AdminWrapper>
              } />
              <Route path="/template-surat" element={
                <AdminWrapper>
                  <ProtectedRoute>
                    <TemplateSuratPage />
                  </ProtectedRoute>
                </AdminWrapper>
              } />
              <Route path="/arsip-surat-keluar" element={
                <AdminWrapper>
                  <ProtectedRoute>
                    <ArsipSuratKeluarPage />
                  </ProtectedRoute>
                </AdminWrapper>
              } />
              <Route path="/form-tugas" element={
                <AdminWrapper>
                  <ProtectedRoute>
                    <FormTugasPage />
                  </ProtectedRoute>
                </AdminWrapper>
              } />
              <Route path="/form-tugas/:formId/data" element={
                <AdminWrapper>
                  <ProtectedRoute>
                    <FormDataEntryPage />
                  </ProtectedRoute>
                </AdminWrapper>
              } />
              <Route path="/statistik" element={
                <AdminWrapper>
                  <ProtectedRoute>
                    <StatistikPage />
                  </ProtectedRoute>
                </AdminWrapper>
              } />
              <Route path="/laporan" element={
                <AdminWrapper>
                  <ProtectedRoute>
                    <LaporanPage />
                  </ProtectedRoute>
                </AdminWrapper>
              } />
              <Route path="/pengaturan" element={
                <AdminWrapper>
                  <ProtectedRoute>
                    <PengaturanPage />
                  </ProtectedRoute>
                </AdminWrapper>
              } />
              <Route path="/admin/content" element={
                <AdminWrapper>
                  <ProtectedRoute allowedRoles={['admin', 'kadus']}>
                    <AdminContentPage />
                  </ProtectedRoute>
                </AdminWrapper>
              } />
              <Route path="/admin/users" element={
                <AdminWrapper>
                  <ProtectedRoute requiredRole="admin">
                    <UserManagementPage />
                  </ProtectedRoute>
                </AdminWrapper>
              } />
              <Route path="/profile" element={
                <AdminWrapper>
                  <ProtectedRoute>
                    <UserProfilePage />
                  </ProtectedRoute>
                </AdminWrapper>
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
