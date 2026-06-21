import { ReactNode, Fragment, useState } from "react";
import { ArrowLeft, Settings, ChevronRight, Menu, User, LogOut } from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { NotificationsDropdown } from "@/features/notifications/components/NotificationsDropdown";
import { UserRole, navigationConfig } from "@/shared/components/sidebar/navigation-config";
import { ThemeToggle } from "@/shared/components/ui/ThemeToggle";
import { generateBreadcrumbs, getRoleDashboardLabel } from "@/shared/utils/breadcrumbUtils";
import { MobileSidebarSheet } from "./MobileSidebarSheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { useAuth } from "@/features/auth/hooks/useAuth";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const { signOut } = useAuth();

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

  // Show hamburger menu for roles without bottom nav
  const showHamburger = !config.hasBottomNav;

  // Check if we're on the profile page
  const isProfilePage = location.pathname === `/${role}/profile`;

  return (
    <>
      <header className="sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center gap-3 h-14 px-4">
          {/* Hamburger menu for non-bottom-nav roles */}
          {showHamburger && !shouldShowBack && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}

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
            <NotificationsDropdown />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                      {user?.nama?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl">
                <DropdownMenuItem onClick={() => navigate(`/${role}/profile`)}>
                  <User className="h-4 w-4 mr-2" /> Profil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(`/${role}/settings`)}>
                  <Settings className="h-4 w-4 mr-2" /> Pengaturan
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut()} className="text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4 mr-2" /> Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Sheet */}
      {showHamburger && (
        <MobileSidebarSheet open={sidebarOpen} onOpenChange={setSidebarOpen} role={role} />
      )}
    </>
  );
}
