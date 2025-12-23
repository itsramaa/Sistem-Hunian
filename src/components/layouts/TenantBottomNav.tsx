import { useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Wallet, 
  MessageSquare, 
  ShoppingBag, 
  User
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/tenant", icon: LayoutDashboard, label: "Beranda" },
  { path: "/tenant/payments", icon: Wallet, label: "Bayar" },
  { path: "/tenant/forum", icon: MessageSquare, label: "Forum" },
  { path: "/tenant/orders", icon: ShoppingBag, label: "Pesanan" },
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
                active 
                  ? "text-primary" 
                  : "text-muted-foreground"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5",
                active && "text-primary"
              )} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
