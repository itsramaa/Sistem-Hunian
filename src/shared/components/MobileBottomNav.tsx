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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t shadow-lg">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {items.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all relative",
                active ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-primary rounded-b-full" />
              )}
              <item.icon className={cn("h-5 w-5 transition-transform", active && "text-primary scale-110")} />
              <span className={cn("text-[10px] transition-all", active && "font-semibold text-primary")}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
