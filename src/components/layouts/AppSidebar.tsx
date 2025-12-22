import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
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
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Building2,
  Users,
  Wrench,
  CreditCard,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Home,
  Wallet,
  AlertTriangle,
  Crown,
  Shield,
  ChevronRight,
  Store,
  MessageSquare,
  ShoppingBag,
  Gift,
  UserCheck,
} from "lucide-react";

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
}

const adminNavItems: NavItem[] = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Merchants", url: "/admin/merchants", icon: Building2 },
  { title: "Vendors", url: "/admin/vendors", icon: Wrench },
  { title: "Verifications", url: "/admin/vendor-verifications", icon: UserCheck },
  { title: "Subscriptions", url: "/admin/subscriptions", icon: Crown },
  { title: "Tiers", url: "/admin/subscription-tiers", icon: Crown },
  { title: "Disputes", url: "/admin/disputes", icon: AlertTriangle },
  { title: "Escrow", url: "/admin/escrow", icon: Wallet },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

const merchantNavItems: NavItem[] = [
  { title: "Dashboard", url: "/merchant", icon: LayoutDashboard },
  { title: "Properties", url: "/merchant/properties", icon: Building2 },
  { title: "Units", url: "/merchant/units", icon: Home },
  { title: "Tenants", url: "/merchant/tenants", icon: Users },
  { title: "Maintenance", url: "/merchant/maintenance", icon: Wrench },
  { title: "Payments", url: "/merchant/payments", icon: CreditCard },
  { title: "Invoices", url: "/merchant/invoices", icon: FileText },
  { title: "Escrow", url: "/merchant/escrow", icon: Wallet },
  { title: "Referrals", url: "/merchant/referrals", icon: Gift },
  { title: "Reports", url: "/merchant/reports", icon: BarChart3 },
  { title: "Settings", url: "/merchant/settings", icon: Settings },
];

const tenantNavItems: NavItem[] = [
  { title: "Dashboard", url: "/tenant", icon: LayoutDashboard },
  { title: "My Unit", url: "/tenant/contracts", icon: Home },
  { title: "Payments", url: "/tenant/payments", icon: CreditCard },
  { title: "Invoices", url: "/tenant/invoices", icon: FileText },
  { title: "Maintenance", url: "/tenant/maintenance", icon: Wrench },
  { title: "Marketplace", url: "/tenant/marketplace", icon: Store },
  { title: "My Orders", url: "/tenant/orders", icon: ShoppingBag },
  { title: "Forum", url: "/tenant/forum", icon: MessageSquare },
  { title: "Referrals", url: "/tenant/referrals", icon: Gift },
  { title: "Settings", url: "/tenant/settings", icon: Settings },
];

interface AppSidebarProps {
  role: "admin" | "merchant" | "tenant";
}

export function AppSidebar({ role }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();

  const navItems = role === "admin" 
    ? adminNavItems 
    : role === "merchant" 
      ? merchantNavItems 
      : tenantNavItems;

  const roleLabel = role === "admin" ? "Admin" : role === "merchant" ? "Landlord" : "Tenant";
  const roleColor = role === "admin" ? "bg-destructive" : role === "merchant" ? "bg-primary" : "bg-success";

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <Sidebar collapsible="icon" className="border-r bg-sidebar">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
            S
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sidebar-foreground">SiHuni</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${roleColor} text-white w-fit`}>
                {roleLabel}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">
            {!collapsed && "Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={collapsed ? item.title : undefined}
                  >
                    <button
                      onClick={() => navigate(item.url)}
                      className="flex items-center gap-3 w-full"
                    >
                      <item.icon className="h-5 w-5" />
                      {!collapsed && <span>{item.title}</span>}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="p-3">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
                {profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {profile?.full_name || "User"}
                </p>
                <p className="text-xs text-sidebar-foreground/60 truncate">
                  {profile?.email}
                </p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "default"}
            onClick={handleSignOut}
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Sign Out</span>}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
