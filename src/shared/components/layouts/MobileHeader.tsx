import { ReactNode, Fragment } from "react";
import { ArrowLeft, Settings, ChevronRight } from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { NotificationsDropdown } from "@/features/notifications/components/NotificationsDropdown";
import { UserRole, navigationConfig } from "@/shared/components/layouts/navigation-config";
import { ThemeToggle } from "@/shared/components/ui/ThemeToggle";
import { generateBreadcrumbs, getRoleDashboardLabel } from "@/shared/utils/breadcrumbUtils";

interface MobileHeaderProps {
  role: UserRole;
  title?: string;
  description?: string;
  actions?: ReactNode;
  showBack?: boolean;
}

export function MobileHeader({
  role,
  title,
  description,
  actions,
  showBack,
}: MobileHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const config = navigationConfig[role];
  const basePath = `/${role}`;
  const isRootPage = location.pathname === basePath || location.pathname === `${basePath}/`;

  // Generate breadcrumbs
  const crumbs = generateBreadcrumbs(role, location.pathname);
  
  // If title is provided, override the last crumb's label
  if (title && crumbs.length > 0) {
    crumbs[crumbs.length - 1].label = title;
  }

  // For tenant with bottom nav, main pages don't show back button
  const bottomNavPaths = config.bottomNav?.map((item) => item.path) || [];
  const isMainPage = bottomNavPaths.includes(location.pathname);
  const shouldShowBack = showBack ?? (config.hasBottomNav ? !isMainPage : !isRootPage);

  // Check if we're on the profile page
  const isProfilePage = location.pathname === `/${role}/profile`;

  return (
    <header className="sticky top-0 z-40 bg-background border-b">
      <div className="flex items-center gap-3 h-14 px-4">
        {/* Back button */}
        {shouldShowBack && (
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
        <div className="flex-1 min-w-0 flex items-center gap-1 overflow-x-auto no-scrollbar mask-linear-fade">
          {crumbs.map((crumb, index) => (
            <Fragment key={crumb.path}>
              {index > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
              {crumb.isCurrent ? (
                <span className="text-sm font-medium whitespace-nowrap">{crumb.label}</span>
              ) : (
                <Link 
                  to={crumb.path} 
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
                >
                  {crumb.label}
                </Link>
              )}
            </Fragment>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <ThemeToggle />
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
