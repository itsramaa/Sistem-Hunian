import { useLocation, useNavigate } from "react-router-dom";
import { LogOut, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { UserRole, navigationConfig, isPathActive } from "./navigation-config";

interface MobileDrawerProps {
  role: UserRole;
  isOpen: boolean;
  onClose: () => void;
}

export function MobileDrawer({ role, isOpen, onClose }: MobileDrawerProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut, merchant, vendor } = useAuth();
  const config = navigationConfig[role];

  const basePath = `/${role}`;

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleNavClick = (path: string) => {
    navigate(path);
    onClose();
  };

  // Get entity info based on role
  const entityInfo = role === "merchant" ? merchant : role === "vendor" ? vendor : null;
  const entityName = entityInfo?.business_name;
  const verificationStatus = entityInfo?.verification_status;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-72 bg-card border-r border-border z-50 transition-transform duration-300 lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                config.brand.iconBgClass
              )}
            >
              <config.brand.icon className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold">{config.brand.name}</span>
              <span className="text-xs text-muted-foreground block">
                {config.brand.subtitle}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Entity Info */}
        {entityName && (
          <div className="p-4 border-b border-border">
            <p className="text-sm font-medium truncate">{entityName}</p>
            {verificationStatus && (
              <Badge
                variant={verificationStatus === "verified" ? "default" : "secondary"}
                className="text-xs mt-1"
              >
                {verificationStatus}
              </Badge>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-200px)]">
          {config.mainNav.flatMap((group) =>
            group.items.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-left transition-colors",
                  isPathActive(item.path, location.pathname, basePath)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))
          )}
        </nav>

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card">
          {profile && (
            <div className="mb-3">
              <p className="text-sm font-medium truncate">
                {profile.full_name || profile.email}
              </p>
              <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
            </div>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Keluar
          </Button>
        </div>
      </aside>
    </>
  );
}
