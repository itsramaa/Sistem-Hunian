"use client";

import { LifeBuoy, Send, type LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface NavSecondaryItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

interface NavSecondaryProps {
  items: NavSecondaryItem[];
}

export function NavSecondary({ items }: NavSecondaryProps) {
  const navigate = useNavigate();

  return (
    <SidebarGroup className="mt-auto">
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                size="sm"
                onClick={() => {
                  if (item.url.startsWith("http")) {
                    window.open(item.url, "_blank");
                  } else {
                    navigate(item.url);
                  }
                }}
              >
                <item.icon />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
