import * as React from "react";
import { LifeBuoy, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/shared/components/ui/sidebar";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { UserRole, navigationConfig } from "@/shared/components/sidebar/navigation-config";
import { NavMain } from "@/shared/components/sidebar/nav-main";
import { NavSecondary } from "@/shared/components/sidebar/nav-secondary";
import { NavUser } from "@/shared/components/sidebar/nav-user";
import { TeamSwitcher } from "@/shared/components/sidebar/team-switcher";
import { Separator } from "@/shared/components/ui/separator";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  role: UserRole;
}

export function AppSidebar({ role, ...props }: AppSidebarProps) {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const config = navigationConfig[role] ?? navigationConfig['operator'];
  const basePath = '/dashboard';

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const secondaryNavItems = [
    { title: "Bantuan", url: `/dashboard/support`, icon: LifeBuoy },
    { title: "Feedback", url: `/dashboard/feedback`, icon: Send },
  ];

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher team={config.brand} basePath={basePath} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={config.mainNav} basePath={basePath} />
        <Separator className="mx-3 w-auto bg-border/30" />
        <NavSecondary items={secondaryNavItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: profile?.nama || "User",
            email: profile?.email || "",
            avatar: undefined,
          }}
          role={role}
          subscriptionTier={null}
          verificationStatus={undefined}
          onLogout={handleLogout}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
