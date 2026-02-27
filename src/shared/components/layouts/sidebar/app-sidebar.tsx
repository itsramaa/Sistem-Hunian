import * as React from "react";
import { LifeBuoy, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
} from "@/shared/components/ui/sidebar";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { UserRole, navigationConfig } from "@/shared/components/layouts/navigation-config";
import { NavMain } from "@/shared/components/layouts/sidebar/nav-main";
import { NavSecondary } from "@/shared/components/layouts/sidebar/nav-secondary";
import { NavUser } from "@/shared/components/layouts/sidebar/nav-user";
import { TeamSwitcher } from "@/shared/components/layouts/sidebar/team-switcher";
import { PropertySwitcher } from "@/shared/components/layouts/sidebar/PropertySwitcher";
import { Separator } from "@/shared/components/ui/separator";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  role: UserRole;
}

export function AppSidebar({ role, ...props }: AppSidebarProps) {
  const navigate = useNavigate();
  const { profile, signOut, merchant, vendor } = useAuth();
  const config = navigationConfig[role];
  const basePath = `/${role}`;

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const entityInfo = role === "merchant" ? merchant : role === "vendor" ? vendor : null;
  const entityName = entityInfo?.business_name;
  const verificationStatus = entityInfo?.verification_status;
  const subscriptionTier = role === "merchant" ? merchant?.merchant_subscriptions?.[0]?.subscription_tiers?.name || "free" : null;

  const secondaryNavItems = [
    {
      title: "Bantuan",
      url: `/${role}/support`,
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: `/${role}/feedback`,
      icon: Send,
    },
  ];

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher team={config.brand} basePath={basePath} />
        {role === 'merchant' && merchant?.id && (
          <SidebarMenu>
            <SidebarMenuItem>
              <PropertySwitcher merchantId={merchant.id} />
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={config.mainNav} basePath={basePath} />
        <Separator className="mx-3 w-auto bg-border/30" />
        <NavSecondary items={secondaryNavItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: entityName || profile?.full_name || "User",
            email: profile?.email || "",
            avatar: profile?.avatar_url || undefined,
          }}
          role={role}
          subscriptionTier={subscriptionTier}
          verificationStatus={verificationStatus}
          onLogout={handleLogout}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
