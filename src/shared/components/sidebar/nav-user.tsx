import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  LogOut,
  Settings,
  Sparkles,
  User,
  Crown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/shared/components/ui/sidebar";

interface NavUserProps {
  user: { name: string; email: string; avatar?: string };
  role: string;
  subscriptionTier?: string | null;
  verificationStatus?: string | null;
  onLogout: () => void;
}

export function NavUser({ user, role, subscriptionTier, verificationStatus, onLogout }: NavUserProps) {
  const { isMobile } = useSidebar();
  const navigate = useNavigate();

  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || role[0].toUpperCase();

  const tierBadge = subscriptionTier === "enterprise"
    ? <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0 text-[10px] px-1.5 rounded-full"><Crown className="h-3 w-3 mr-0.5" />Enterprise</Badge>
    : subscriptionTier === "pro"
    ? <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0 text-[10px] px-1.5 rounded-full"><Sparkles className="h-3 w-3 mr-0.5" />Pro</Badge>
    : null;

  const verifiedBadge = verificationStatus === "verified"
    ? <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-[10px] px-1.5 rounded-full"><BadgeCheck className="h-3 w-3 mr-0.5" />Verified</Badge>
    : null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-sidebar-accent/60 transition-all duration-150"
            >
              <Avatar className="h-8 w-8 rounded-xl ring-2 ring-primary/20">
                <AvatarImage src={user.avatar || ""} alt={user.name} />
                <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-semibold">{user.name}</span>
                  {tierBadge}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                  {verifiedBadge}
                </div>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-2xl backdrop-blur-xl bg-popover/95 border border-border/40 shadow-xl"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-2 py-2 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-xl ring-2 ring-primary/20">
                  <AvatarImage src={user.avatar || ""} alt={user.name} />
                  <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/30" />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => navigate('/dashboard/notifications')} className="rounded-xl gap-2 cursor-pointer">
                <Bell className="h-4 w-4 text-muted-foreground" />
                Notifikasi
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/dashboard/profile')} className="rounded-xl gap-2 cursor-pointer">
                <User className="h-4 w-4 text-muted-foreground" />
                Profil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/dashboard/settings')} className="rounded-xl gap-2 cursor-pointer">
                <Settings className="h-4 w-4 text-muted-foreground" />
                Pengaturan
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-border/30" />
            <DropdownMenuItem
              onClick={onLogout}
              className="rounded-xl gap-2 text-destructive hover:bg-destructive/10 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
