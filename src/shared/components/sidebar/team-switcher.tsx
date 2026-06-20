import { type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared/components/ui/sidebar";

interface TeamSwitcherProps {
  team: {
    name: string;
    subtitle: string;
    icon: LucideIcon;
    iconBgClass: string;
  };
  basePath: string;
}

export function TeamSwitcher({ team, basePath }: TeamSwitcherProps) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          asChild
          className="hover:bg-sidebar-accent/50 transition-all duration-200 group/brand"
        >
          <Link to={basePath}>
            <div className="flex aspect-square size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 group-hover/brand:from-primary/30 group-hover/brand:to-primary/10 transition-all duration-200">
              <team.icon className="size-4 text-primary" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-bold tracking-tight">{team.name}</span>
              <span className="truncate text-[11px] text-sidebar-foreground/50">{team.subtitle}</span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
