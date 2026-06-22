import { ReactNode } from "react";
import { MobileHeader } from "@/shared/components/MobileHeader";
import { MobileBottomNav } from "@/shared/components/MobileBottomNav";
import { cn } from "@/shared/utils/utils";
import {
  UserRole,
  navigationConfig,
} from "@/shared/components/sidebar/navigation-config";
import { Meta } from "@/shared/components/meta";

interface MobileLayoutProps {
  role: UserRole;
  children: ReactNode;
  title?: string;
  description?: string;
  actions?: ReactNode;
  showBack?: boolean;
}

// Paths that appear in mobile bottom nav — max 5, ordered by priority
const MOBILE_NAV_PATHS = [
  "/dashboard",
  "/dashboard/rooms",
  "/dashboard/payments",
  "/dashboard/confirmations",
  "/dashboard/maintenance",
];

export function MobileLayout({
  role,
  children,
  title,
  description,
  actions,
  showBack,
}: MobileLayoutProps) {
  const config = navigationConfig[role];

  // Show up to 5 items, sorted by MOBILE_NAV_PATHS priority order
  const mobileNavItems = config.mainNav
    .flatMap((g) => g.items)
    .filter((item) => MOBILE_NAV_PATHS.includes(item.path))
    .sort(
      (a, b) =>
        MOBILE_NAV_PATHS.indexOf(a.path) - MOBILE_NAV_PATHS.indexOf(b.path),
    )
    .slice(0, 5);

  const hasBottomNav = mobileNavItems.length > 1;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Meta noindex />
      <a
        href="#mobile-main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:p-4 focus:bg-background focus:text-foreground"
      >
        Langsung ke konten utama
      </a>
      <MobileHeader
        role={role}
        title={title}
        description={description}
        actions={actions}
        showBack={showBack}
      />

      <main
        id="mobile-main-content"
        className={cn(
          "flex-1 px-4 pt-4 overflow-auto",
          hasBottomNav ? "pb-24" : "pb-6",
        )}
      >
        {children}
      </main>

      {hasBottomNav && (
        <MobileBottomNav items={mobileNavItems} basePath="/dashboard" />
      )}
    </div>
  );
}
