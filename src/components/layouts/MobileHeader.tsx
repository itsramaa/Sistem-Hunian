import { ReactNode } from "react";
import { ArrowLeft, Settings, Menu } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { NotificationsDropdown } from "@/components/notifications/NotificationsDropdown";
import { UserRole, navigationConfig } from "./navigation-config";

interface MobileHeaderProps {
  role: UserRole;
  title?: string;
  description?: string;
  actions?: ReactNode;
  showBack?: boolean;
  onMenuClick?: () => void;
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

        {/* Title area */}
        <div className="flex-1 min-w-0">
          {title && (
            <h1 className="text-base font-semibold truncate leading-tight">{title}</h1>
          )}
          {description && (
            <p className="text-xs text-muted-foreground truncate">{description}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {actions}
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
