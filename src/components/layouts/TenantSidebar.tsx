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
  Command,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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

// Main navigation items (including Marketplace)
const mainNavItems = [
  { path: "/tenant", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/tenant/payments", icon: Wallet, label: "Pembayaran" },
  { path: "/tenant/invoices", icon: FileText, label: "Tagihan" },
  { path: "/tenant/contracts", icon: ClipboardList, label: "Kontrak" },
  { path: "/tenant/marketplace", icon: Store, label: "Marketplace" },
];

// Activity items (including Referral)
const activityItems = [
  { path: "/tenant/maintenance", icon: Wrench, label: "Maintenance" },
  { path: "/tenant/orders", icon: ShoppingBag, label: "Pesanan" },
  { path: "/tenant/forum", icon: MessageSquare, label: "Forum" },
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

  const NavItem = ({ item }: { item: { path: string; icon: any; label: string } }) => (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive(item.path)}
        tooltip={item.label}
      >
        <a
          href={item.path}
          onClick={(e) => {
            e.preventDefault();
            navigate(item.path);
          }}
          className={cn(
            isActive(item.path) && "bg-sidebar-accent text-sidebar-accent-foreground"
          )}
        >
          <item.icon />
          <span>{item.label}</span>
        </a>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar variant="inset" collapsible="icon">
      {/* Header - Brand/Logo */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/tenant" onClick={(e) => { e.preventDefault(); navigate("/tenant"); }}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">SiHuni</span>
                  <span className="truncate text-xs">Tenant Portal</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Content - Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Utama</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <NavItem key={item.path} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Aktivitas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {activityItems.map((item) => (
                <NavItem key={item.path} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>

      {/* Footer - User Account */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name || "Tenant"} />
                    <AvatarFallback className="rounded-lg">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{profile?.full_name || "Tenant"}</span>
                    <span className="truncate text-xs">{profile?.email}</span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem onClick={() => navigate("/tenant/profile")}>
                  <User className="mr-2 size-4" />
                  Profil Saya
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/tenant/settings")}>
                  <Settings className="mr-2 size-4" />
                  Pengaturan
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 size-4" />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
