import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/lib/axios";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { toast } from "sonner";

interface AdminGuardResult {
  isAdmin: boolean;
  isLoading: boolean;
  adminId: string | null;
}

/**
 * Hook to verify admin role using Go API.
 * Redirects to /unauthorized if user is not an admin.
 */
export function useAdminGuard(): AdminGuardResult {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (authLoading) return;

      if (!user) {
        navigate("/auth");
        return;
      }

      try {
        // TODO: Go endpoint not yet implemented — was: supabase.rpc("has_role", { _user_id, _role })
        // Stub: assume non-admin until endpoint is available
        const hasAdmin = false;

        if (!hasAdmin) {
          toast.error("You don't have permission to access this area");
          navigate("/unauthorized");
          return;
        }

        setIsAdmin(true);
      } catch (err) {
        console.error("Admin guard error:", err);
        navigate("/unauthorized");
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminRole();
  }, [user, authLoading, navigate]);

  return {
    isAdmin,
    isLoading: isLoading || authLoading,
    adminId: user?.id || null,
  };
}

/**
 * Hook variant that doesn't redirect, just returns the check result.
 * Useful for conditional UI rendering.
 */
export function useIsAdmin(): { isAdmin: boolean; isLoading: boolean } {
  const { user, isLoading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (authLoading) {
        return;
      }

      if (!user) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        // TODO: Go endpoint not yet implemented — was: supabase.rpc("has_role", { _user_id, _role })
        // Stub: assume non-admin until endpoint is available
        setIsAdmin(false);
      } catch (err) {
        console.error("Admin check error:", err);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminRole();
  }, [user, authLoading]);

  return { isAdmin, isLoading: isLoading || authLoading };
}
