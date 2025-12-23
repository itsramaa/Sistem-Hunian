"use client";

import { ChevronsUpDown, type LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

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
  const navigate = useNavigate();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          onClick={() => navigate(basePath)}
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div
            className={`flex aspect-square size-8 items-center justify-center rounded-lg ${team.iconBgClass}`}
          >
            <team.icon className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">{team.name}</span>
            <span className="truncate text-xs">{team.subtitle}</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
