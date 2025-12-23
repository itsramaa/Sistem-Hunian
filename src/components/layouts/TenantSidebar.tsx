import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Wallet,
  MessageSquare,
  ShoppingBag,
  Wrench,
  FileText,
  ClipboardList,
  Store,
  Gift,
  Settings,
  LogOut,
  ChevronUp,
  Bell,
  User,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// All navigation items in one flat list
const navItems = [
  { path: "/tenant", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/tenant/payments", icon: Wallet, label: "Pembayaran" },
  { path: "/tenant/invoices", icon: FileText, label: "Tagihan" },
  { path: "/tenant/contracts", icon: ClipboardList, label: "Kontrak" },
  { path: "/tenant/maintenance", icon: Wrench, label: "Maintenance" },
  { path: "/tenant/orders", icon: ShoppingBag, label: "Pesanan" },
  { path: "/tenant/forum", icon: MessageSquare, label: "Forum" },
  { path: "/tenant/marketplace", icon: Store, label: "Marketplace" },
  { path: "/tenant/referrals", icon: Gift, label: "Referral" },
];

export function TenantSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/tenant") {
      return location.pathname === "/tenant";
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "T";

  return (
    <Sidebar collapsible="icon" className="border-r">
      {/* Header - Logo/Brand */}
      <SidebarHeader className="border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
            <LayoutDashboard className="h-4 w-4 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <span className="text-base font-semibold">SiHuni</span>
          )}
        </div>
      </SidebarHeader>

      {/* Content - Navigation Menu */}
      <SidebarContent className="px-2 py-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.path}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.path)}
                tooltip={item.label}
                className="h-9"
              >
                <a
                  href={item.path}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(item.path);
                  }}
                  className={cn(
                    "rounded-lg",
                    isActive(item.path) && "bg-primary/10 text-primary font-medium"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      {/* Footer - User Dropdown */}
      <SidebarFooter className="border-t p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground h-auto py-2"
                >
                  <Avatar className="h-8 w-8 shrink-0 rounded-lg">
                    <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name || "Tenant"} />
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium text-sm">{profile?.full_name || "Tenant"}</span>
                      <span className="truncate text-xs text-muted-foreground">{profile?.email}</span>
                    </div>
                  )}
                  {!isCollapsed && <ChevronUp className="ml-auto h-4 w-4 shrink-0" />}
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 rounded-lg bg-popover"
                side="top"
                align="start"
                sideOffset={8}
              >
                <DropdownMenuItem onClick={() => navigate("/tenant/settings")}>
                  <User className="mr-2 h-4 w-4" />
                  Profil Saya
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/tenant/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Pengaturan
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/tenant/settings")}>
                  <Bell className="mr-2 h-4 w-4" />
                  Notifikasi
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
