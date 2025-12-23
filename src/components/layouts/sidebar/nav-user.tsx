"use client";

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Settings,
  Sparkles,
  User,
  Crown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface NavUserProps {
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
  role: string;
  subscriptionTier?: string | null;
  verificationStatus?: string | null;
  onLogout: () => void;
}

export function NavUser({
  user,
  role,
  subscriptionTier,
  verificationStatus,
  onLogout,
}: NavUserProps) {
  const { isMobile } = useSidebar();
  const navigate = useNavigate();

  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || role[0].toUpperCase();

  const getTierBadge = () => {
    if (!subscriptionTier) return null;
    if (subscriptionTier === "enterprise") {
      return (
        <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0 text-[10px] px-1.5">
          <Crown className="h-3 w-3 mr-0.5" />
          Enterprise
        </Badge>
      );
    }
    if (subscriptionTier === "pro") {
      return (
        <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0 text-[10px] px-1.5">
          <Sparkles className="h-3 w-3 mr-0.5" />
          Pro
        </Badge>
      );
    }
    if (subscriptionTier === "basic") {
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
    if (verificationStatus === "verified") {
      return (
        <Badge
          variant="outline"
          className="bg-success/10 text-success border-success/30 text-[10px] px-1.5"
        >
          <BadgeCheck className="h-3 w-3 mr-0.5" />
          Verified
        </Badge>
      );
    }
    return null;
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar || ""} alt={user.name} />
                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-semibold">{user.name}</span>
                  {getTierBadge()}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                  {getVerifiedBadge()}
                </div>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar || ""} alt={user.name} />
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
              {(getTierBadge() || getVerifiedBadge()) && (
                <div className="flex items-center gap-1 px-3 pb-2">
                  {getTierBadge()}
                  {getVerifiedBadge()}
                </div>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {role === "merchant" && subscriptionTier !== "enterprise" && (
              <>
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => navigate(`/${role}/billing`)}>
                    <Sparkles />
                    Upgrade to Pro
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => navigate(`/${role}/profile`)}>
                <User />
                Profile
              </DropdownMenuItem>
              {role === "merchant" && (
                <DropdownMenuItem onClick={() => navigate(`/${role}/billing`)}>
                  <CreditCard />
                  Billing
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => navigate(`/${role}/settings`)}>
                <Settings />
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
