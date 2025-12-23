import { useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Wallet, 
  Wrench, 
  Store, 
  User
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/tenant", icon: LayoutDashboard, label: "Beranda" },
  { path: "/tenant/payments", icon: Wallet, label: "Bayar" },
  { path: "/tenant/maintenance", icon: Wrench, label: "Lapor" },
  { path: "/tenant/marketplace", icon: Store, label: "Market" },
  { path: "/tenant/settings", icon: User, label: "Profil" },
];

export function TenantBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === "/tenant") {
      return location.pathname === "/tenant";
    }
    if (path === "/tenant/settings") {
      return location.pathname.startsWith("/tenant/settings");
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 min-w-[56px]",
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
      </div>
    </nav>
  );
}
