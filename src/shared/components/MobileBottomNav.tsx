import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/shared/utils/utils";
import { NavItem } from "@/shared/components/sidebar/navigation-config";

interface MobileBottomNavProps {
  items: NavItem[];
  basePath: string;
}

export function MobileBottomNav({ items, basePath }: MobileBottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === basePath) {
      return location.pathname === basePath;
    }
    if (path.endsWith("/profile")) {
      return location.pathname.startsWith(path);
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t shadow-lg safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {items.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all relative pt-1",
                active
                  ? "text-primary"
                  : "text-muted-foreground/60 hover:text-foreground",
              )}
            >
              {/* Top pill indicator */}
              <div
                className={cn(
                  "absolute top-0 w-8 h-0.5 rounded-full transition-all duration-300",
                  active ? "bg-primary opacity-100" : "opacity-0",
                )}
              />
              {/* Icon with filled background when active */}
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300",
                  active
                    ? "bg-primary/15 dark:bg-primary/25"
                    : "bg-transparent",
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-all duration-300",
                    active
                      ? "text-primary scale-110"
                      : "text-muted-foreground/60",
                  )}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] transition-all duration-300 leading-none",
                  active
                    ? "font-bold text-primary"
                    : "font-normal text-muted-foreground/60",
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
