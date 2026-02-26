import { useAuth } from "@/features/auth/hooks/useAuth";
import { useMerchantDashboardStats } from "@/features/dashboard/hooks/useMerchantDashboardStats";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Progress } from "@/shared/components/ui/progress";
import { Button } from "@/shared/components/ui/button";
import { CheckCircle2, Circle, ChevronRight, Rocket, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

interface CheckItem {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  path: string;
}

export function MerchantQuickStartChecklist() {
  const { merchant } = useAuth();
  const { data: stats } = useMerchantDashboardStats();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  // Persist dismissal per merchant
  useEffect(() => {
    if (merchant?.id) {
      const key = `quickstart_dismissed_${merchant.id}`;
      setDismissed(localStorage.getItem(key) === 'true');
    }
  }, [merchant?.id]);

  const handleDismiss = () => {
    if (merchant?.id) {
      localStorage.setItem(`quickstart_dismissed_${merchant.id}`, 'true');
    }
    setDismissed(true);
  };

  const items: CheckItem[] = [
    {
      id: 'profile',
      label: 'Lengkapi profil bisnis',
      description: 'Nama bisnis, alamat, dan info kontak',
      completed: !!merchant?.business_name && merchant.business_name !== 'My Business',
      path: '/merchant/profile',
    },
    {
      id: 'property',
      label: 'Tambah properti pertama',
      description: 'Daftarkan kos/apartemen Anda',
      completed: (stats?.properties.total || 0) > 0,
      path: '/merchant/properties',
    },
    {
      id: 'unit',
      label: 'Buat unit di properti',
      description: 'Tambah kamar/unit yang tersedia',
      completed: (stats?.properties.totalUnits || 0) > 0,
      path: '/merchant/properties',
    },
    {
      id: 'tenant',
      label: 'Tambah penyewa pertama',
      description: 'Undang atau buat kontrak untuk penyewa',
      completed: (stats?.tenants.active || 0) > 0,
      path: '/merchant/tenants',
    },
    {
      id: 'invoice',
      label: 'Buat tagihan pertama',
      description: 'Kirim tagihan sewa ke penyewa',
      completed: (stats?.financials.monthlyRevenue || 0) > 0,
      path: '/merchant/invoices',
    },
  ];

  const completedCount = items.filter(i => i.completed).length;
  const progress = (completedCount / items.length) * 100;
  const allDone = completedCount === items.length;

  // Don't show if dismissed or all completed
  if (dismissed || allDone) return null;

  return (
    <Card className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-success" />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Rocket className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Quick Start</CardTitle>
              <CardDescription>
                {completedCount}/{items.length} langkah selesai
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleDismiss} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <Progress value={progress} className="h-2 mt-2 rounded-full [&>div]:bg-primary" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {items.map(item => (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${
                item.completed 
                  ? 'bg-success/5 hover:bg-success/10' 
                  : 'hover:bg-primary/5 border border-transparent hover:border-border/40'
              }`}
              onClick={() => !item.completed && navigate(item.path)}
            >
              {item.completed ? (
                <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                  {item.label}
                </p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              {!item.completed && (
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
