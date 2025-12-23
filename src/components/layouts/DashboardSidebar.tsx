import { useLocation, useNavigate } from "react-router-dom";
import { LogOut, Settings, User, ChevronUp, CreditCard, BadgeCheck, Crown, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { UserRole, navigationConfig, isPathActive } from "./navigation-config";

interface DashboardSidebarProps {
  role: UserRole;
}

export function DashboardSidebar({ role }: DashboardSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut, merchant, vendor } = useAuth();
  const config = navigationConfig[role];

  const basePath = `/${role}`;

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const initials =
    profile?.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || role[0].toUpperCase();

  // Get entity info based on role
  const entityInfo = role === "merchant" ? merchant : role === "vendor" ? vendor : null;
  const entityName = entityInfo?.business_name;
  const verificationStatus = entityInfo?.verification_status;
  const subscriptionTier = role === "merchant" ? merchant?.subscription_tier : null;

  const getTierBadge = () => {
    if (!subscriptionTier) return null;
    if (subscriptionTier === 'enterprise') {
      return (
        <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0 text-[10px] px-1.5">
          <Crown className="h-3 w-3 mr-0.5" />
          Enterprise
        </Badge>
      );
    }
    if (subscriptionTier === 'pro') {
      return (
        <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0 text-[10px] px-1.5">
          <Sparkles className="h-3 w-3 mr-0.5" />
          Pro
        </Badge>
      );
    }
    if (subscriptionTier === 'basic') {
      return (
        <Badge variant="outline" className="text-[10px] px-1.5">
          Basic
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="text-[10px] px-1.5">
        Free
      </Badge>
    );
  };

  const getVerifiedBadge = () => {
    if (verificationStatus === 'verified') {
      return (
        <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-[10px] px-1.5">
          <BadgeCheck className="h-3 w-3 mr-0.5" />
          Verified
        </Badge>
      );
    }
    return null;
  };

  return (
    <Sidebar collapsible="icon">
      {/* Header - Brand/Logo */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
            >
              <a
                href={basePath}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(basePath);
                }}
              >
                <div
                  className={cn(
                    "flex aspect-square size-8 items-center justify-center rounded-lg",
                    config.brand.iconBgClass
                  )}
                >
                  <config.brand.icon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{config.brand.name}</span>
                  <span className="truncate text-xs">{config.brand.subtitle}</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Content - Navigation */}
      <SidebarContent>
        {config.mainNav.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={isPathActive(item.path, location.pathname, basePath)}
                      tooltip={item.label}
                    >
                      <a
                        href={item.path}
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(item.path);
                        }}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
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
                    <AvatarImage
                      src={profile?.avatar_url || ""}
                      alt={profile?.full_name || "User"}
                    />
                    <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {entityName || profile?.full_name || "User"}
                    </span>
                    <div className="flex items-center gap-1 mt-0.5">
                      {getTierBadge()}
                      {getVerifiedBadge()}
                    </div>
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
                <div className="flex items-center gap-2 px-2 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name || "User"} />
                    <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{profile?.full_name || "User"}</span>
                    <span className="truncate text-xs text-muted-foreground">{profile?.email}</span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(`/${role}/profile`)}>
                  <User className="mr-2 size-4" />
                  Profile
                </DropdownMenuItem>
                {role === "merchant" && (
                  <DropdownMenuItem onClick={() => navigate(`/${role}/billing`)}>
                    <CreditCard className="mr-2 size-4" />
                    Billing
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => navigate(`/${role}/settings`)}>
                  <Settings className="mr-2 size-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 size-4" />
                  Log out
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
