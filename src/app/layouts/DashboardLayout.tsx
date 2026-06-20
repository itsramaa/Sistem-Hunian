import { ReactNode, Fragment, useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/shared/components/ui/sidebar";
import { Separator } from "@/shared/components/ui/separator";
import { NotificationsDropdown } from "@/features/notifications/components/NotificationsDropdown";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/shared/components/ui/breadcrumb";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { AppSidebar } from "@/shared/components/sidebar/app-sidebar";
import { MobileLayout } from "@/app/layouts/MobileLayout";
import { UserRole } from "@/shared/components/sidebar/navigation-config";
import { Meta } from "@/shared/components/meta";
import { ThemeToggle } from "@/shared/components/ui/ThemeToggle";
import { generateBreadcrumbs } from "@/shared/utils/breadcrumbUtils";

// Tablet: 640–1023px (sidebar starts collapsed/icon-only)
// Desktop: ≥1024px (sidebar starts expanded)
const TABLET_BREAKPOINT = 1024;

function useIsTablet() {
  const [isTablet, setIsTablet] = useState(false);
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      setIsTablet(w >= 640 && w < TABLET_BREAKPOINT);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isTablet;
}

interface DashboardLayoutProps {
  children: ReactNode;
  role: UserRole;
  title?: string;
  description?: string;
  actions?: ReactNode;
  showBack?: boolean;
}

export function DashboardLayout({
  children,
  role,
  title,
  description,
  actions,
  showBack,
}: DashboardLayoutProps) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const location = useLocation();

  const breadcrumbs = generateBreadcrumbs(role, location.pathname);

  // Mobile (<640px): bottom nav layout
  if (isMobile) {
    return (
      <MobileLayout
        role={role}
        title={title}
        description={description}
        actions={actions}
        showBack={showBack}
      >
        {children}
      </MobileLayout>
    );
  }

  // Tablet (640–1023px): collapsed icon sidebar
  // Desktop (≥1024px): expanded sidebar
  const sidebarOpen = !isTablet;

  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      <Meta noindex />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:p-4 focus:bg-background focus:text-foreground"
      >
        Langsung ke konten utama
      </a>
      <AppSidebar role={role} />
      <SidebarInset>
        {/* Sticky header */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 bg-background/80 backdrop-blur-sm border-b border-border/30 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-3 sm:px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4 hidden sm:block" />
            {/* Breadcrumbs — hidden on tablet to save space */}
            <Breadcrumb className="hidden sm:block">
              <BreadcrumbList>
                {breadcrumbs.map((crumb, index) => (
                  <Fragment key={crumb.path}>
                    <BreadcrumbItem className={index === 0 ? "hidden lg:block" : ""}>
                      {crumb.isCurrent ? (
                        <BreadcrumbPage className="text-sm font-medium">
                          {crumb.label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link to={crumb.path} className="text-sm">
                            {crumb.label}
                          </Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {index < breadcrumbs.length - 1 && (
                      <BreadcrumbSeparator className={index === 0 ? "hidden lg:block" : ""} />
                    )}
                  </Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
            {/* Page title shown on tablet when no breadcrumbs */}
            {title && (
              <span className="sm:hidden text-sm font-semibold text-foreground truncate">
                {title}
              </span>
            )}
          </div>
          <div className="ml-auto flex items-center gap-1 sm:gap-2 px-3 sm:px-4">
            <ThemeToggle />
            {role === "operator" && <NotificationsDropdown />}
          </div>
        </header>

        {/* Main content — tighter padding on tablet */}
        <div
          id="main-content"
          className="flex flex-1 flex-col gap-4 p-3 sm:p-4 lg:p-6"
        >
          {(description || actions) && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
              {actions && (
                <div className="flex items-center gap-2 shrink-0">{actions}</div>
              )}
            </div>
          )}
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
