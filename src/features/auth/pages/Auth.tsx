import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthForm } from "@/features/auth/components/AuthForm";
import { AuthLoadingSkeleton } from "@/features/auth/components/AuthLoadingSkeleton";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Meta } from "@/shared/components/meta";

const roleDestinations: Record<string, { path: string; name: string }> = {
  operator: { path: "/dashboard", name: "Dashboard Operator" },
  viewer: { path: "/dashboard", name: "Dashboard" },
};

export default function Auth() {
  const { user, role, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user && role) {
      const destination = roleDestinations[role] ?? roleDestinations.operator;
      navigate(destination.path, { replace: true });
    }
  }, [user, role, isLoading, navigate]);

  if (isLoading) return <AuthLoadingSkeleton />;

  if (user && role) {
    const destination = roleDestinations[role] ?? roleDestinations.operator;
    return <AuthLoadingSkeleton destination={destination.name} />;
  }

  return (
    <>
      <Meta noindex title="Masuk" description="Masuk ke akun SiHuni Anda" />
      <AuthForm />
    </>
  );
}
