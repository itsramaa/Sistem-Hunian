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
  badges?: Record<string, number>;
}

export function NavMain({ groups, basePath, badges }: NavMainProps) {
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
              const badgeCount = item.badgeKey && badges ? badges[item.badgeKey] : 0;
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
                      <div className="relative">
                        <item.icon className={cn(
                          "transition-colors",
                          isActive ? "text-primary" : "text-sidebar-foreground/60"
                        )} />
                        {badgeCount > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground group-data-[collapsible=icon]:flex">
                            {badgeCount > 9 ? "9+" : badgeCount}
                          </span>
                        )}
                      </div>
                      <span className="flex-1">{item.label}</span>
                      {badgeCount > 0 && (
                        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-semibold text-destructive-foreground group-data-[collapsible=icon]:hidden">
                          {badgeCount > 99 ? "99+" : badgeCount}
                        </span>
                      )}
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
