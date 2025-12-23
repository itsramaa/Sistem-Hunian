import { ReactNode } from "react";
import { ArrowLeft, Settings } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { NotificationsDropdown } from "@/components/notifications/NotificationsDropdown";

interface TenantMobileHeaderProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  showBack?: boolean;
}

export function TenantMobileHeader({ 
  title, 
  description, 
  actions,
  showBack 
}: TenantMobileHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Main pages in bottom nav - these don't show back button
  const mainPages = [
    "/tenant",
    "/tenant/payments", 
    "/tenant/forum",
    "/tenant/orders",
    "/tenant/profile"
  ];
  
  // Check if current path is a main page (exact match)
  const isMainPage = mainPages.includes(location.pathname);
  const shouldShowBack = showBack ?? !isMainPage;
  
  // Check if we're on the profile page
  const isProfilePage = location.pathname === '/tenant/profile';

  return (
    <header className="sticky top-0 z-40 bg-background border-b">
      <div className="flex items-center gap-3 h-14 px-4">
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
        
        <div className="flex-1 min-w-0">
          {title && (
            <h1 className="text-base font-semibold truncate leading-tight">{title}</h1>
          )}
          {description && (
            <p className="text-xs text-muted-foreground truncate">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {actions}
          {isProfilePage ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => navigate('/tenant/settings')}
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
