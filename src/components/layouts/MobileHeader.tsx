import { ReactNode } from "react";
import { ArrowLeft, Settings, Menu, ChevronRight } from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { NotificationsDropdown } from "@/components/notifications/NotificationsDropdown";
import { UserRole, navigationConfig, getAllNavItems } from "./navigation-config";

interface MobileHeaderProps {
  role: UserRole;
  title?: string;
  description?: string;
  actions?: ReactNode;
  showBack?: boolean;
  onMenuClick?: () => void;
}

// Helper to get current page label from navigation config
function getCurrentPageLabel(role: UserRole, pathname: string): string | null {
  const navItems = getAllNavItems(role);
  const basePath = `/${role}`;
  
  const matchedItem = navItems.find(item => {
    if (item.path === basePath) return pathname === basePath;
    return pathname.startsWith(item.path);
  });
  
  return matchedItem?.label || null;
}

// Helper to get breadcrumb label for role dashboard
function getRoleDashboardLabel(role: UserRole): string {
  switch (role) {
    case "tenant": return "Beranda";
    case "merchant": return "Dashboard";
    case "vendor": return "Dashboard";
    case "admin": return "Dashboard";
    default: return "Dashboard";
  }
}

export function MobileHeader({
  role,
  title,
  description,
  actions,
  showBack,
  onMenuClick,
}: MobileHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const config = navigationConfig[role];
  const basePath = `/${role}`;
  const isRootPage = location.pathname === basePath || location.pathname === `${basePath}/`;

  // Auto-detect page label from navigation config if no title provided
  const pageLabel = title || getCurrentPageLabel(role, location.pathname);

  // For tenant with bottom nav, main pages don't show back button
  const bottomNavPaths = config.bottomNav?.map((item) => item.path) || [];
  const isMainPage = bottomNavPaths.includes(location.pathname);
  const shouldShowBack = showBack ?? (config.hasBottomNav ? !isMainPage : false);

  // Check if we're on the profile page
  const isProfilePage = location.pathname === `/${role}/profile`;

  // Show hamburger menu for roles without bottom nav
  const showHamburger = !config.hasBottomNav && onMenuClick;

  return (
    <header className="sticky top-0 z-40 bg-background border-b">
      <div className="flex items-center gap-3 h-14 px-4">
        {/* Hamburger menu for non-tenant roles */}
        {showHamburger && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        {/* Back button for tenant or sub-pages */}
        {shouldShowBack && !showHamburger && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Breadcrumb-style title */}
        <div className="flex-1 min-w-0 flex items-center gap-1">
          {!isRootPage && (
            <>
              <Link 
                to={basePath} 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {getRoleDashboardLabel(role)}
              </Link>
              <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
            </>
          )}
          {pageLabel && (
            <span className="text-sm font-medium truncate">{pageLabel}</span>
          )}
        </div>

        {/* Actions - only notifications, no action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {isProfilePage ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => navigate(`/${role}/settings`)}
            >
              <Settings className="h-5 w-5" />
            </Button>
          ) : (
            <NotificationsDropdown />
          )}
        </div>
      </div>
    </header>
  );
}
