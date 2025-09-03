import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nama, setNama] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch village information for logo and name
  const { data: infoDesa } = useQuery({
    queryKey: ['info-desa-auth'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('info_desa')
        .select('nama_desa, logo_desa')
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching village info:', error);
        return { nama_desa: 'Sistem Desa', logo_desa: null };
      }
      
      return data || { nama_desa: 'Sistem Desa', logo_desa: null };
    }
  });

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/admin');
      }
    };
    checkUser();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        toast.success('Login berhasil!');
        navigate('/admin');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Terjadi kesalahan saat login');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Konfirmasi password tidak cocok');
      return;
    }

    if (password.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }

    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/admin`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            nama: nama,
            role: 'user' // Default role for public signup
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        toast.success('Registrasi berhasil! Silakan hubungi admin untuk aktivasi akun.');
        setEmail('');
        setPassword('');
        setNama('');
        setConfirmPassword('');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Terjadi kesalahan saat registrasi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-accent">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <div className="absolute top-20 right-20 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-32 left-16 w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-16 right-12 w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute top-1/2 left-8 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '1.5s' }}></div>
          <div className="absolute top-1/3 right-8 w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '3s' }}></div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-16 w-24 h-24 bg-accent/20 rounded-full blur-lg animate-bounce" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-32 left-20 w-20 h-20 bg-primary-glow/15 rounded-full blur-md animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 right-10 w-28 h-28 bg-white/5 rounded-full blur-2xl animate-bounce" style={{ animationDelay: '0.5s' }}></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          {/* Header Section */}
          <div className="text-center mb-12 animate-fade-in">
            {/* Logo Container */}
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white/10 backdrop-blur-sm rounded-2xl mb-6 border border-white/20 overflow-hidden">
              {infoDesa?.logo_desa ? (
                <img 
                  src={infoDesa.logo_desa} 
                  alt="Logo Desa" 
                  className="w-16 h-16 object-contain"
                />
              ) : (
                <LogIn className="w-12 h-12 text-white" />
              )}
            </div>
            
            <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
              {infoDesa?.nama_desa || 'Sistem Desa'}
            </h1>
            <p className="text-white/80 text-lg font-light mb-2">
              Selamat datang kembali
            </p>
            <p className="text-white/60 text-sm">
              Sistem Informasi Desa Digital
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-white/50 to-transparent mx-auto mt-4"></div>
          </div>

          {/* Login Card */}
          <Card className="glass border-white/20 backdrop-blur-xl shadow-2xl animate-scale-in">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl font-bold text-gradient mb-2">
                Masuk ke Akun Anda
              </CardTitle>
              <CardDescription className="text-muted-foreground/80">
                Gunakan kredensial Anda untuk mengakses sistem
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <form onSubmit={handleSignIn} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="signin-email" className="text-sm font-medium text-foreground/80">
                    Alamat Email
                  </Label>
                  <div className="relative group">
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="nama@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="input-modern h-12 pl-4 pr-4 text-base bg-background/50 border-border/50 focus:border-primary/50 focus:bg-background/70 transition-all duration-300"
                    />
                    <div className="absolute inset-0 rounded-md bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="signin-password" className="text-sm font-medium text-foreground/80">
                    Kata Sandi
                  </Label>
                  <div className="relative group">
                    <Input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Masukkan kata sandi"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="input-modern h-12 pl-4 pr-12 text-base bg-background/50 border-border/50 focus:border-primary/50 focus:bg-background/70 transition-all duration-300"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1 h-10 w-10 hover:bg-muted/50 transition-colors duration-200"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                    <div className="absolute inset-0 rounded-md bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 button-elegant text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5" 
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Memproses...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <LogIn className="w-5 h-5" />
                      <span>Masuk ke Sistem</span>
                    </div>
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/50"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-card px-4 text-muted-foreground/60">atau</span>
                </div>
              </div>

              {/* Additional Options */}
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground/70">
                  Belum memiliki akun?{" "}
                  <span className="text-primary hover:text-primary/80 cursor-pointer font-medium transition-colors">
                    Hubungi Administrator
                  </span>
                </p>
                
                <p className="text-xs text-muted-foreground/60">
                  Dengan masuk, Anda menyetujui{" "}
                  <span className="text-primary hover:text-primary/80 cursor-pointer">
                    Syarat & Ketentuan
                  </span>{" "}
                  kami
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-8 text-white/60 text-sm">
            <p>© 2024 Sistem Informasi Desa. Semua hak dilindungi.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
