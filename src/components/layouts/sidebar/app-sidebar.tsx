"use client";

import { LifeBuoy, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { UserRole, navigationConfig } from "../navigation-config";
import { NavMain } from "./nav-main";
import { NavSecondary } from "./nav-secondary";
import { NavUser } from "./nav-user";
import { TeamSwitcher } from "./team-switcher";

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

  // Get entity info based on role
  const entityInfo = role === "merchant" ? merchant : role === "vendor" ? vendor : null;
  const entityName = entityInfo?.business_name;
  const verificationStatus = entityInfo?.verification_status;
  const subscriptionTier = role === "merchant" ? merchant?.subscription_tier : null;

  const secondaryNavItems = [
    {
      title: "Support",
      url: `/${role}/settings`,
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: `mailto:support@sihuni.com`,
      icon: Send,
    },
  ];

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher team={config.brand} basePath={basePath} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={config.mainNav} basePath={basePath} />
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
