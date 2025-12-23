import { useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Wallet, 
  Wrench, 
  Store, 
  MoreHorizontal,
  ShoppingBag,
  MessageSquare,
  FileText,
  Gift,
  Settings,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const mainNavItems = [
  { path: "/tenant", icon: LayoutDashboard, label: "Beranda" },
  { path: "/tenant/payments", icon: Wallet, label: "Bayar" },
  { path: "/tenant/maintenance", icon: Wrench, label: "Lapor" },
  { path: "/tenant/marketplace", icon: Store, label: "Market" },
];

const moreNavItems = [
  { path: "/tenant/orders", icon: ShoppingBag, label: "Pesanan" },
  { path: "/tenant/forum", icon: MessageSquare, label: "Forum" },
  { path: "/tenant/contracts", icon: FileText, label: "Kontrak" },
  { path: "/tenant/invoices", icon: FileText, label: "Tagihan" },
  { path: "/tenant/referrals", icon: Gift, label: "Referral" },
  { path: "/tenant/settings", icon: Settings, label: "Pengaturan" },
];

export function TenantBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/tenant") {
      return location.pathname === "/tenant";
    }
    return location.pathname.startsWith(path);
  };

  const isMoreActive = moreNavItems.some(item => isActive(item.path));

  const handleNavigate = (path: string) => {
    navigate(path);
    setSheetOpen(false);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {mainNavItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 min-w-[64px]",
                active 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-xl transition-all duration-200",
                active && "bg-primary/10"
              )}>
                <item.icon className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  active && "scale-110"
                )} />
              </div>
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
            </button>
          );
        })}

        {/* More Button with Sheet */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 min-w-[64px]",
                isMoreActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-xl transition-all duration-200",
                isMoreActive && "bg-primary/10"
              )}>
                <MoreHorizontal className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  isMoreActive && "scale-110"
                )} />
              </div>
              <span className="text-[10px] font-medium leading-tight">Lainnya</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-3xl pb-safe">
            <SheetHeader className="pb-4">
              <SheetTitle className="text-left">Menu Lainnya</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-3 gap-4 pb-6">
              {moreNavItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigate(item.path)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-200",
                      active 
                        ? "bg-primary/10 text-primary" 
                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-6 w-6" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
