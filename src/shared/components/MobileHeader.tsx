import { ReactNode, Fragment } from "react";
import {
  ArrowLeft,
  Settings,
  ChevronRight,
  User,
  LogOut,
  History,
  ClipboardList,
} from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { NotificationsDropdown } from "@/features/notifications/components/NotificationsDropdown";
import {
  UserRole,
  navigationConfig,
} from "@/shared/components/sidebar/navigation-config";
import { ThemeToggle } from "@/shared/components/ui/ThemeToggle";
import { generateBreadcrumbs } from "@/shared/utils/breadcrumbUtils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
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
  const { user, signOut } = useAuth();

  const prefix = location.pathname.startsWith("/admin")
    ? "/admin"
    : "/dashboard";

  // Generate breadcrumbs
  const crumbs = generateBreadcrumbs(role, location.pathname);

  // If title is provided, override the last crumb's label
  if (title && crumbs.length > 0) {
    crumbs[crumbs.length - 1].label = title;
  }

  // Dynamic bottom nav configuration matching MobileLayout.tsx
  const mobileNavPaths = [
    "/dashboard",
    "/dashboard/properties",
    "/dashboard/rooms",
    "/dashboard/tenants",
    "/dashboard/payments",
    "/dashboard/confirmations",
    "/dashboard/maintenance",
    "/dashboard/profile",
  ];

  const mobileNavItems =
    config?.mainNav
      ?.flatMap((g) => g.items)
      ?.filter((item) => mobileNavPaths.includes(item.path))
      ?.slice(0, 5) || [];

  const hasBottomNav = mobileNavItems.length > 1;
  const isMainPage = mobileNavPaths.includes(location.pathname);
  const shouldShowBack =
    showBack ??
    (hasBottomNav ? !isMainPage : location.pathname !== "/dashboard");

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
              {index > 0 && (
                <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
              )}
              {crumb.isCurrent ? (
                <span className="text-sm font-medium whitespace-nowrap">
                  {crumb.label}
                </span>
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
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                    {user?.name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-xl">
              <DropdownMenuItem onClick={() => navigate(`${prefix}/profile`)}>
                <User className="h-4 w-4 mr-2" /> Profil
              </DropdownMenuItem>
              {role === "operator" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => navigate(`${prefix}/viewer-requests`)}
                  >
                    <ClipboardList className="h-4 w-4 mr-2" /> Viewer Requests
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(`${prefix}/audit`)}>
                    <History className="h-4 w-4 mr-2" /> Audit Trail
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => navigate(`${prefix}/settings`)}
                  >
                    <Settings className="h-4 w-4 mr-2" /> Pengaturan
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut()}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" /> Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
