import { useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { AppRole } from "@/features/auth/types/auth";
import { toast } from "sonner";
import { ContentSkeleton } from "@/shared/components/ui/ContentSkeleton";

const TOKEN_KEY = "sihuni_access_token";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}

function getHomePath(role: AppRole): string {
  const map: Record<AppRole, string> = {
    operator: "/dashboard",
    manager: "/dashboard",
    viewer: "/dashboard",
  };
  return map[role] ?? "/";
}

function getRoleDisplayName(role: AppRole): string {
  const map: Record<AppRole, string> = {
    operator: "Operator",
    manager: "Manajer",
    viewer: "Viewer",
  };
  return map[role] ?? role;
}

export function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, role, isLoading } = useAuth();
  const location = useLocation();
  const hasShownToast = useRef(false);

  // Only show skeleton when loading AND no token exists (truly first visit).
  // If token is present, user is already authenticated — skip skeleton so sidebar never disappears.
  const hasToken =
    typeof window !== "undefined" && !!localStorage.getItem(TOKEN_KEY);
  if (isLoading || (hasToken && !user)) {
    return <ContentSkeleton />;
  }

  // Not authenticated → redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Authenticated but no role assigned yet
  if (!role) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(role)) {
      if (!hasShownToast.current) {
        hasShownToast.current = true;
        const allowed = allowedRoles
          .map((r) => getRoleDisplayName(r))
          .join(", ");
        toast.error("Akses Ditolak", {
          description: `Halaman ini hanya dapat diakses oleh ${allowed}.`,
        });
      }
      return <Navigate to={getHomePath(role)} replace />;
    }
  }

  hasShownToast.current = false;
  return <>{children}</>;
}
