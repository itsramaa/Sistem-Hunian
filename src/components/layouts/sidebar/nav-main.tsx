"use client";

import { ChevronRight } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { NavGroup, isPathActive } from "../navigation-config";

interface NavMainProps {
  groups: NavGroup[];
  basePath: string;
}

export function NavMain({ groups, basePath }: NavMainProps) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <>
      {groups.map((group) => (
        <SidebarGroup key={group.label}>
          <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          <SidebarMenu>
            {group.items.map((item) => {
              const isActive = isPathActive(item.path, location.pathname, basePath);
              
              return (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    tooltip={item.label}
                    isActive={isActive}
                    onClick={() => navigate(item.path)}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  );
}
