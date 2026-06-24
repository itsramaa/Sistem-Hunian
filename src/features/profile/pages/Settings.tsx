// @refresh reset
import { useAuth } from "@/features/auth/hooks/useAuth";
import { SectionHeader } from "@/features/profile/components/SectionHeader";
import { UserManagementCard } from "@/features/profile/components/UserManagementCard";
import { WhatsappCard, WAConfigCard } from "@/features/profile/components/SettingsCards";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { cn } from "@/shared/utils/utils";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Switch } from "@/shared/components/ui/switch";
import { ThemeToggle } from "@/shared/components/ui/ThemeToggle";
import {
  Bell,
  Globe,
  Moon,
  Shield,
} from "lucide-react";
import React from "react";

export default function SettingsPage() {
  const { profile } = useAuth();
  const isOperator = profile?.role === "operator";

  return (
    <div className="space-y-4 w-full max-w-6xl">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Konfigurasi tampilan, notifikasi, dan preferensi akun
        </p>
      </div>

      <Tabs defaultValue="tampilan">
        <TabsList
          className={cn(
            "w-full",
            isOperator ? "grid grid-cols-4" : "grid grid-cols-3",
          )}
        >
          <TabsTrigger value="tampilan" className="gap-1.5">
            <Moon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Tampilan</span>
          </TabsTrigger>
          <TabsTrigger value="notifikasi" className="gap-1.5">
            <Bell className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Notifikasi</span>
          </TabsTrigger>
          {isOperator && (
            <TabsTrigger value="whatsapp" className="gap-1.5">
              <span className="hidden sm:inline">WhatsApp</span>
            </TabsTrigger>
          )}
          {isOperator && (
            <TabsTrigger value="pengguna" className="gap-1.5">
              <span className="hidden sm:inline">Pengguna</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Tab: Tampilan */}
        <TabsContent value="tampilan" className="mt-4 space-y-4">
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <SectionHeader
                icon={<Moon className="h-4 w-4 text-primary" />}
                title="Tampilan"
                description="Sesuaikan tema aplikasi sesuai preferensi Anda"
              />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/50">
                <div>
                  <p className="text-sm font-medium text-foreground">Mode Gelap / Terang</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Ubah tema tampilan aplikasi</p>
                </div>
                <ThemeToggle />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <SectionHeader
                icon={<Globe className="h-4 w-4 text-primary" />}
                title="Bahasa & Lokal"
                description="Pengaturan bahasa dan format tampilan"
              />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/50">
                <div>
                  <p className="text-sm font-medium text-foreground">Bahasa</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Indonesia</p>
                </div>
                <Badge variant="outline" className="text-xs">ID</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Notifikasi */}
        <TabsContent value="notifikasi" className="mt-4 space-y-4">
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <SectionHeader
                icon={<Bell className="h-4 w-4 text-primary" />}
                title="Notifikasi"
                description="Kelola preferensi notifikasi Anda"
              />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Notifikasi Pembayaran</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Dapatkan notifikasi saat pembayaran masuk atau terlambat</p>
                  </div>
                  <Switch defaultChecked aria-label="Notifikasi Pembayaran" />
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Notifikasi DP</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Dapatkan notifikasi terkait konfirmasi DP</p>
                  </div>
                  <Switch defaultChecked aria-label="Notifikasi DP" />
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Notifikasi Maintenance</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Dapatkan notifikasi saat ada laporan kerusakan baru</p>
                  </div>
                  <Switch defaultChecked aria-label="Notifikasi Maintenance" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: WhatsApp */}
        {isOperator && (
          <TabsContent value="whatsapp" className="mt-4 space-y-4">
            <WhatsappCard />
            <WAConfigCard />
          </TabsContent>
        )}

        {/* Tab: Pengguna */}
        {isOperator && (
          <TabsContent value="pengguna" className="mt-4 space-y-4">
            <UserManagementCard />

            <Card className="rounded-2xl">
              <CardHeader className="pb-3">
                <SectionHeader
                  icon={<Shield className="h-4 w-4 text-primary" />}
                  title="Role & Permissions"
                  description="Kelola hak akses pengguna"
                />
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/20">
                  <Badge className="bg-primary/10 text-primary rounded-full text-xs">Admin</Badge>
                  <p className="text-sm text-muted-foreground">Akses penuh ke semua fitur</p>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/20">
                  <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-xs">Operator</Badge>
                  <p className="text-sm text-muted-foreground">Kelola data penghuni, pembayaran, dan maintenance</p>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/20">
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs">Manager</Badge>
                  <p className="text-sm text-muted-foreground">Lihat data dan laporan, kelola konfirmasi DP</p>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/20">
                  <Badge variant="outline" className="text-muted-foreground rounded-full text-xs">Viewer</Badge>
                  <p className="text-sm text-muted-foreground">Hanya melihat data dan menyampaikan laporan</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
