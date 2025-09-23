
import React, { useState } from 'react';
import { Settings, User, Shield, Database, Bell, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

const Pengaturan = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    weeklyReport: true,
    monthlyReport: true
  });

  const [security, setSecurity] = useState({
    twoFactorAuth: false,
    sessionTimeout: '30',
    passwordExpiry: '90',
    loginAttempts: '5'
  });

  const handleSaveNotifications = () => {
    console.log('Saving notifications:', notifications);
    toast({
      title: "Notifikasi Disimpan",
      description: "Pengaturan notifikasi berhasil disimpan."
    });
  };

  const handleSaveSecurity = () => {
    console.log('Saving security:', security);
    toast({
      title: "Keamanan Disimpan",
      description: "Pengaturan keamanan berhasil disimpan."
    });
  };

  const handleManageDesaInfo = () => {
    navigate('/info-desa');
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Pengaturan</h1>
        <p className="text-muted-foreground">Kelola pengaturan sistem dan konfigurasi aplikasi</p>
      </div>

      <Tabs defaultValue="keamanan" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="keamanan" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Keamanan</span>
          </TabsTrigger>
          <TabsTrigger value="notifikasi" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Notifikasi</span>
          </TabsTrigger>
          <TabsTrigger value="sistem" className="flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <span>Sistem</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="keamanan">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Pengaturan Keamanan</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Autentikasi Dua Faktor</Label>
                  <p className="text-sm text-muted-foreground">Aktifkan keamanan tambahan untuk login</p>
                </div>
                <Switch
                  checked={security.twoFactorAuth}
                  onCheckedChange={(checked) => setSecurity({...security, twoFactorAuth: checked})}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="sessionTimeout">Timeout Sesi (menit)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={security.sessionTimeout}
                    onChange={(e) => setSecurity({...security, sessionTimeout: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="passwordExpiry">Masa Berlaku Password (hari)</Label>
                  <Input
                    id="passwordExpiry"
                    type="number"
                    value={security.passwordExpiry}
                    onChange={(e) => setSecurity({...security, passwordExpiry: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="loginAttempts">Maksimal Percobaan Login</Label>
                  <Input
                    id="loginAttempts"
                    type="number"
                    value={security.loginAttempts}
                    onChange={(e) => setSecurity({...security, loginAttempts: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleSaveSecurity}>
                  <Settings className="h-4 w-4 mr-2" />
                  Simpan Pengaturan Keamanan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifikasi">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Pengaturan Notifikasi</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notifikasi Email</Label>
                    <p className="text-sm text-muted-foreground">Terima notifikasi melalui email</p>
                  </div>
                  <Switch
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) => setNotifications({...notifications, emailNotifications: checked})}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notifikasi SMS</Label>
                    <p className="text-sm text-muted-foreground">Terima notifikasi melalui SMS</p>
                  </div>
                  <Switch
                    checked={notifications.smsNotifications}
                    onCheckedChange={(checked) => setNotifications({...notifications, smsNotifications: checked})}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Push Notification</Label>
                    <p className="text-sm text-muted-foreground">Terima notifikasi langsung di browser</p>
                  </div>
                  <Switch
                    checked={notifications.pushNotifications}
                    onCheckedChange={(checked) => setNotifications({...notifications, pushNotifications: checked})}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Laporan Mingguan</Label>
                    <p className="text-sm text-muted-foreground">Terima ringkasan mingguan</p>
                  </div>
                  <Switch
                    checked={notifications.weeklyReport}
                    onCheckedChange={(checked) => setNotifications({...notifications, weeklyReport: checked})}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Laporan Bulanan</Label>
                    <p className="text-sm text-muted-foreground">Terima ringkasan bulanan</p>
                  </div>
                  <Switch
                    checked={notifications.monthlyReport}
                    onCheckedChange={(checked) => setNotifications({...notifications, monthlyReport: checked})}
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleSaveNotifications}>
                  <Settings className="h-4 w-4 mr-2" />
                  Simpan Pengaturan Notifikasi
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sistem" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Informasi Desa</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Kelola Informasi Desa</h3>
                <p className="text-muted-foreground mb-4">
                  Untuk mengelola informasi desa seperti nama desa, kepala desa, alamat kantor, email, dan telepon, 
                  silakan kunjungi menu Info Desa.
                </p>
                <Button onClick={handleManageDesaInfo}>
                  <Building2 className="h-4 w-4 mr-2" />
                  Buka Menu Info Desa
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Pengaturan Sistem</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Backup & Restore</h3>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full">
                      <Database className="h-4 w-4 mr-2" />
                      Backup Database
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Database className="h-4 w-4 mr-2" />
                      Restore Database
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Maintenance</h3>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full">
                      <Settings className="h-4 w-4 mr-2" />
                      Clear Cache
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Settings className="h-4 w-4 mr-2" />
                      Optimize Database
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Informasi Sistem</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Versi Aplikasi:</span>
                    <p className="text-muted-foreground">v2.0.1</p>
                  </div>
                  <div>
                    <span className="font-medium">Database:</span>
                    <p className="text-muted-foreground">PostgreSQL 14.2</p>
                  </div>
                  <div>
                    <span className="font-medium">Server:</span>
                    <p className="text-muted-foreground">Supabase Cloud</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Pengaturan;
