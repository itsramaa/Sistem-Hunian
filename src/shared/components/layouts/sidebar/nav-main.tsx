import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";

import { NavGroup, isPathActive } from "@/shared/components/layouts/navigation-config";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "@/shared/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/shared/components/ui/collapsible";
import { cn } from "@/shared/utils/utils";

interface NavMainProps {
  groups: NavGroup[];
  basePath: string;
}

export function NavMain({ groups, basePath }: NavMainProps) {
  const location = useLocation();
  const [lainnyaOpen, setLainnyaOpen] = useState(false);

  return (
    <>
      {groups.map((group) => {
        const isCollapsible = group.label === "Lainnya";

        const content = (
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
        );

        if (isCollapsible) {
          return (
            <SidebarGroup key={group.label}>
              <Collapsible open={lainnyaOpen} onOpenChange={setLainnyaOpen}>
                <CollapsibleTrigger className="w-full">
                  <SidebarGroupLabel className="uppercase text-[10px] tracking-widest font-semibold text-sidebar-foreground/50 cursor-pointer flex items-center justify-between w-full">
                    {group.label}
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", lainnyaOpen && "rotate-180")} />
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>{content}</CollapsibleContent>
              </Collapsible>
            </SidebarGroup>
          );
        }

        return (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="uppercase text-[10px] tracking-widest font-semibold text-sidebar-foreground/50">
              {group.label}
            </SidebarGroupLabel>
            {content}
          </SidebarGroup>
        );
      })}
    </>
  );
}
