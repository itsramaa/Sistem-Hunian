import { Link, useLocation } from "react-router-dom";

import { NavGroup, isPathActive } from "@/shared/components/sidebar/navigation-config";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "@/shared/components/ui/sidebar";
import { cn } from "@/shared/utils/utils";

interface NavMainProps {
  groups: NavGroup[];
  basePath: string;
}

export function NavMain({ groups, basePath }: NavMainProps) {
  const location = useLocation();

  return (
    <>
      {groups.map((group) => (
        <SidebarGroup key={group.label}>
          <SidebarGroupLabel className="uppercase text-[10px] tracking-widest font-semibold text-sidebar-foreground/50">
            {group.label}
          </SidebarGroupLabel>
          <SidebarMenu>
            {group.items.map((item) => {
              const isActive = isPathActive(item.path, location.pathname, basePath, item.activePatterns);

              return (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.label}
                    isActive={isActive}
                    className={cn(
                      "transition-all duration-150 rounded-lg",
                      isActive
                        ? "bg-gradient-to-r from-primary/15 to-primary/5 border-l-2 border-primary font-medium"
                        : "hover:bg-sidebar-accent/60"
                    )}
                  >
                    <Link to={item.path}>
                      <item.icon className={cn(
                        "transition-colors",
                        isActive ? "text-primary" : "text-sidebar-foreground/60"
                      )} />
                      <span>{item.label}</span>
                    </Link>
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
