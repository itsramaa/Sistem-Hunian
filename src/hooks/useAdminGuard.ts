import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface AdminGuardResult {
  isAdmin: boolean;
  isLoading: boolean;
  adminId: string | null;
}

/**
 * Hook to verify admin role using user_roles table.
 * Redirects to /unauthorized if user is not an admin.
 * Uses the has_role database function for security.
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
        // Check admin role using the has_role function
        const { data, error } = await supabase.rpc("has_role", {
          _user_id: user.id,
          _role: "admin",
        });

        if (error) {
          console.error("Error checking admin role:", error);
          toast.error("Failed to verify admin permissions");
          navigate("/unauthorized");
          return;
        }

        if (!data) {
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
        const { data, error } = await supabase.rpc("has_role", {
          _user_id: user.id,
          _role: "admin",
        });

        if (error) {
          console.error("Error checking admin role:", error);
          setIsAdmin(false);
        } else {
          setIsAdmin(!!data);
        }
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
