import { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Switch } from "@/shared/components/ui/switch";
import { Label } from "@/shared/components/ui/label";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import { 
  Bell, CreditCard, FileText, Wrench, AlertTriangle, 
  MessageSquare, Gift, Mail, Smartphone, Save
} from "lucide-react";
import { toast } from "sonner";

interface NotificationPreference {
  key: string;
  label: string;
  description: string;
  icon: React.ElementType;
  email: boolean;
  push: boolean;
  inApp: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreference[] = [
  {
    key: 'payment',
    label: 'Pembayaran',
    description: 'Notifikasi tentang pembayaran dan tagihan',
    icon: CreditCard,
    email: true,
    push: true,
    inApp: true,
  },
  {
    key: 'invoice',
    label: 'Invoice',
    description: 'Invoice baru dan reminder pembayaran',
    icon: FileText,
    email: true,
    push: true,
    inApp: true,
  },
  {
    key: 'maintenance',
    label: 'Maintenance',
    description: 'Update permintaan perbaikan',
    icon: Wrench,
    email: false,
    push: true,
    inApp: true,
  },
  {
    key: 'contract',
    label: 'Kontrak',
    description: 'Perubahan dan pembaruan kontrak',
    icon: FileText,
    email: true,
    push: true,
    inApp: true,
  },
  {
    key: 'forum',
    label: 'Forum Komunitas',
    description: 'Balasan dan aktivitas di forum',
    icon: MessageSquare,
    email: false,
    push: false,
    inApp: true,
  },
  {
    key: 'referral',
    label: 'Referral',
    description: 'Update program referral',
    icon: Gift,
    email: true,
    push: true,
    inApp: true,
  },
  {
    key: 'warning',
    label: 'Peringatan',
    description: 'Peringatan penting tentang akun',
    icon: AlertTriangle,
    email: true,
    push: true,
    inApp: true,
  },
];

export function NotificationPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreference[]>(DEFAULT_PREFERENCES);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`notification_prefs_${user?.id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPreferences(prev => prev.map(p => ({
          ...p,
          ...parsed[p.key],
        })));
      } catch (e) {
        console.error('Failed to load preferences:', e);
      }
    }
  }, [user?.id]);

  const updatePreference = (key: string, channel: 'email' | 'push' | 'inApp', value: boolean) => {
    setPreferences(prev => prev.map(p => 
      p.key === key ? { ...p, [channel]: value } : p
    ));
    setHasChanges(true);
  };

  const savePreferences = async () => {
    setIsSaving(true);
    
    try {
      // Save to localStorage (in production, save to database)
      const prefsObject = preferences.reduce((acc, p) => ({
        ...acc,
        [p.key]: { email: p.email, push: p.push, inApp: p.inApp },
      }), {});
      
      localStorage.setItem(`notification_prefs_${user?.id}`, JSON.stringify(prefsObject));
      
      setHasChanges(false);
      toast.success('Preferensi notifikasi disimpan');
    } catch (error) {
      toast.error('Gagal menyimpan preferensi');
    } finally {
      setIsSaving(false);
    }
  };

  const enableAll = () => {
    setPreferences(prev => prev.map(p => ({
      ...p,
      email: true,
      push: true,
      inApp: true,
    })));
    setHasChanges(true);
  };

  const disableAll = () => {
    setPreferences(prev => prev.map(p => ({
      ...p,
      email: false,
      push: false,
      inApp: true, // Keep in-app enabled
    })));
    setHasChanges(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Preferensi Notifikasi
            </CardTitle>
            <CardDescription>
              Atur jenis notifikasi yang ingin Anda terima
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={enableAll}>
              Aktifkan Semua
            </Button>
            <Button variant="outline" size="sm" onClick={disableAll}>
              Nonaktifkan
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Channel Legend */}
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span>Email</span>
          </div>
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            <span>Push</span>
          </div>
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>In-App</span>
          </div>
        </div>

        <Separator />

        {/* Preferences List */}
        <div className="space-y-6">
          {preferences.map((pref) => (
            <div key={pref.key} className="space-y-3">
              <div className="flex items-center gap-3">
                <pref.icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label className="font-medium">{pref.label}</Label>
                  <p className="text-sm text-muted-foreground">{pref.description}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-6 pl-8">
                <div className="flex items-center gap-2">
                  <Switch
                    id={`${pref.key}-email`}
                    checked={pref.email}
                    onCheckedChange={(v) => updatePreference(pref.key, 'email', v)}
                  />
                  <Label htmlFor={`${pref.key}-email`} className="text-sm">
                    Email
                  </Label>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    id={`${pref.key}-push`}
                    checked={pref.push}
                    onCheckedChange={(v) => updatePreference(pref.key, 'push', v)}
                  />
                  <Label htmlFor={`${pref.key}-push`} className="text-sm">
                    Push
                  </Label>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    id={`${pref.key}-inapp`}
                    checked={pref.inApp}
                    onCheckedChange={(v) => updatePreference(pref.key, 'inApp', v)}
                  />
                  <Label htmlFor={`${pref.key}-inapp`} className="text-sm">
                    In-App
                  </Label>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={savePreferences} 
            disabled={!hasChanges || isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Menyimpan...' : 'Simpan Preferensi'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
