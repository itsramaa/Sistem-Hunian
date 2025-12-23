import { useLocation, useNavigate } from "react-router-dom";
import { LogOut, Settings, User, ChevronUp } from "lucide-react";
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

  return (
    <Sidebar variant="inset" collapsible="icon">
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
                        className={cn(
                          isPathActive(item.path, location.pathname, basePath) &&
                            "bg-sidebar-accent text-sidebar-accent-foreground"
                        )}
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
        {/* Entity info for merchant/vendor */}
        {entityName && (
          <div className="px-3 py-2 border-b border-sidebar-border mb-2">
            <p className="text-sm font-medium truncate">{entityName}</p>
            {verificationStatus && (
              <Badge
                variant={verificationStatus === "verified" ? "default" : "secondary"}
                className="text-xs mt-1"
              >
                {verificationStatus}
              </Badge>
            )}
          </div>
        )}

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
                      {profile?.full_name || "User"}
                    </span>
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
                <DropdownMenuItem onClick={() => navigate(`/${role}/profile`)}>
                  <User className="mr-2 size-4" />
                  Profil Saya
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(`/${role}/settings`)}>
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
