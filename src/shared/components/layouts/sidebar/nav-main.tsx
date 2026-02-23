import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";

import { NavGroup, isPathActive } from "@/shared/components/layouts/navigation-config";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
} from "@/shared/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/components/ui/collapsible";
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
              // Check if this item has sub-items
              if (item.items && item.items.length > 0) {
                 const isGroupActive = item.items.some(sub => isPathActive(sub.path, location.pathname, basePath));
                 
                 return (
                   <Collapsible
                     key={item.label}
                     asChild
                     defaultOpen={isGroupActive}
                     className="group/collapsible"
                   >
                     <SidebarMenuItem>
                       <CollapsibleTrigger asChild>
                         <SidebarMenuButton
                           tooltip={item.label}
                           className="transition-all duration-150 rounded-lg hover:bg-sidebar-accent/60"
                         >
                           {item.icon && <item.icon className="text-sidebar-foreground/60" />}
                           <span>{item.label}</span>
                           <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                         </SidebarMenuButton>
                       </CollapsibleTrigger>
                       <CollapsibleContent>
                         <SidebarMenuSub>
                           {item.items.map((subItem) => {
                             const isSubActive = isPathActive(subItem.path, location.pathname, basePath);
                             return (
                               <SidebarMenuSubItem key={subItem.path}>
                                 <SidebarMenuSubButton
                                   asChild
                                   isActive={isSubActive}
                                 >
                                   <Link to={subItem.path}>
                                     <span>{subItem.label}</span>
                                   </Link>
                                 </SidebarMenuSubButton>
                               </SidebarMenuSubItem>
                             );
                           })}
                         </SidebarMenuSub>
                       </CollapsibleContent>
                     </SidebarMenuItem>
                   </Collapsible>
                 );
              }

              // Original logic for single items
              const isActive = isPathActive(item.path, location.pathname, basePath);
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
                      {item.icon && <item.icon className={cn(
                        "transition-colors",
                        isActive ? "text-primary" : "text-sidebar-foreground/60"
                      )} />}
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
