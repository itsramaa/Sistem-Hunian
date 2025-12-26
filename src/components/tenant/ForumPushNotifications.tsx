import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, BellOff, MessageSquare, Heart, AtSign, Megaphone } from "lucide-react";
import { toast } from "sonner";

interface NotificationPreference {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
}

interface ForumPushNotificationsProps {
  onSave?: (preferences: Record<string, boolean>) => Promise<void>;
}

export function ForumPushNotifications({ onSave }: ForumPushNotificationsProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [preferences, setPreferences] = useState<NotificationPreference[]>([
    {
      id: "new_comments",
      label: "Komentar Baru",
      description: "Notifikasi saat ada komentar di post Anda",
      icon: <MessageSquare className="h-4 w-4" />,
      enabled: true,
    },
    {
      id: "likes",
      label: "Like & Reaksi",
      description: "Notifikasi saat post atau komentar Anda di-like",
      icon: <Heart className="h-4 w-4" />,
      enabled: true,
    },
    {
      id: "mentions",
      label: "Mention",
      description: "Notifikasi saat Anda di-mention di forum",
      icon: <AtSign className="h-4 w-4" />,
      enabled: true,
    },
    {
      id: "announcements",
      label: "Pengumuman",
      description: "Notifikasi pengumuman penting dari pengelola",
      icon: <Megaphone className="h-4 w-4" />,
      enabled: true,
    },
  ]);

  useEffect(() => {
    if ("Notification" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) {
      toast.error("Browser Anda tidak mendukung notifikasi push");
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        toast.success("Notifikasi push berhasil diaktifkan!");
        // Show a test notification
        new Notification("Forum Sihuni", {
          body: "Notifikasi push berhasil diaktifkan!",
          icon: "/favicon.ico",
        });
      } else if (result === "denied") {
        toast.error("Izin notifikasi ditolak. Silakan aktifkan di pengaturan browser.");
      }
    } catch (error) {
      toast.error("Gagal meminta izin notifikasi");
    }
  };

  const togglePreference = (id: string) => {
    setPreferences((prev) =>
      prev.map((pref) =>
        pref.id === id ? { ...pref, enabled: !pref.enabled } : pref
      )
    );
  };

  const handleSave = async () => {
    const prefsRecord = preferences.reduce(
      (acc, pref) => ({ ...acc, [pref.id]: pref.enabled }),
      {} as Record<string, boolean>
    );

    if (onSave) {
      await onSave(prefsRecord);
    }
    toast.success("Preferensi notifikasi tersimpan");
  };

  if (!isSupported) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-muted-foreground">
            <BellOff className="h-5 w-5" />
            <p>Browser Anda tidak mendukung notifikasi push.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifikasi Push Forum
        </CardTitle>
        <CardDescription>
          Kelola preferensi notifikasi untuk aktivitas forum
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Permission status */}
        {permission !== "granted" && (
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
            <div className="space-y-1">
              <p className="font-medium">Aktifkan Notifikasi Push</p>
              <p className="text-sm text-muted-foreground">
                {permission === "denied"
                  ? "Notifikasi diblokir. Aktifkan di pengaturan browser."
                  : "Izinkan notifikasi untuk menerima update forum."}
              </p>
            </div>
            <Button
              onClick={requestPermission}
              disabled={permission === "denied"}
            >
              {permission === "denied" ? "Diblokir" : "Aktifkan"}
            </Button>
          </div>
        )}

        {/* Notification preferences */}
        <div className="space-y-4">
          {preferences.map((pref) => (
            <div
              key={pref.id}
              className="flex items-center justify-between py-3 border-b last:border-0"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-muted-foreground">{pref.icon}</div>
                <div className="space-y-1">
                  <Label htmlFor={pref.id} className="font-medium cursor-pointer">
                    {pref.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">{pref.description}</p>
                </div>
              </div>
              <Switch
                id={pref.id}
                checked={pref.enabled}
                onCheckedChange={() => togglePreference(pref.id)}
                disabled={permission !== "granted"}
              />
            </div>
          ))}
        </div>

        {permission === "granted" && (
          <Button onClick={handleSave} className="w-full">
            Simpan Preferensi
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
