import { Fragment } from "react";
import { Link, useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/shared/components/ui/sheet";
import { UserRole, navigationConfig, isPathActive } from "./navigation-config";
import { cn } from "@/shared/utils/utils";

interface MobileSidebarSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: UserRole;
}

export function MobileSidebarSheet({ open, onOpenChange, role }: MobileSidebarSheetProps) {
  const location = useLocation();
  const config = navigationConfig[role];
  const basePath = `/${role}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0 bg-sidebar-background text-sidebar-foreground border-sidebar-border">
        <SheetHeader className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", config.brand.iconBgClass)}>
              <config.brand.icon className="h-5 w-5" />
            </div>
            <div>
              <SheetTitle className="text-sidebar-foreground text-base">{config.brand.name}</SheetTitle>
              <p className="text-xs text-sidebar-foreground/60">{config.brand.subtitle}</p>
            </div>
          </div>
        </SheetHeader>

        <nav className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-80px)]">
          {config.mainNav.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/40 font-semibold px-3 mb-1.5">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isPathActive(item.path, location.pathname, basePath, item.activePatterns);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => onOpenChange(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                        active
                          ? "bg-sidebar-accent text-sidebar-primary"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
