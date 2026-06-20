import { Settings as SettingsIcon, Bell, Moon, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { ThemeToggle } from '@/shared/components/ui/ThemeToggle';

export default function SettingsPage() {
  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Konfigurasi preferensi akun</p>
      </div>

      {/* Appearance */}
      <Card className="rounded-2xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Tampilan</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Mode Gelap / Terang</p>
              <p className="text-xs text-muted-foreground mt-0.5">Ubah tema tampilan aplikasi</p>
            </div>
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="rounded-2xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Notifikasi</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Notifikasi sistem dikirim secara otomatis oleh background worker untuk alert DP, pembayaran jatuh tempo, dan pembayaran terlambat.
          </p>
        </CardContent>
      </Card>

      {/* System info */}
      <Card className="rounded-2xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Sistem</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Aplikasi</span>
            <span className="font-medium">SiHuni v1.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Database</span>
            <span className="font-medium">Neon PostgreSQL</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Storage</span>
            <span className="font-medium">Cloudflare R2</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
