import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ShieldX, ArrowLeft, Home } from "lucide-react";
import { AppRole } from "@/types/auth";

const Unauthorized = () => {
  const navigate = useNavigate();
  const { role } = useAuth();

  const getDashboardPath = (userRole: AppRole | null): string => {
    if (!userRole) return '/auth';
    const rolePathMap: Record<AppRole, string> = {
      admin: '/admin',
      merchant: '/merchant',
      vendor: '/vendor',
      tenant: '/tenant',
    };
    return rolePathMap[userRole] || '/';
  };

  const handleGoToDashboard = () => {
    navigate(getDashboardPath(role));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10">
          <ShieldX className="h-12 w-12 text-destructive" />
        </div>
        <h1 className="mb-2 text-4xl font-bold text-foreground">403</h1>
        <h2 className="mb-4 text-xl font-semibold text-foreground">Akses Ditolak</h2>
        <p className="mb-8 text-muted-foreground">
          Maaf, Anda tidak memiliki izin untuk mengakses halaman ini. 
          Silakan hubungi administrator jika Anda merasa ini adalah kesalahan.
        </p>
        <div className="flex gap-4 justify-center">
          <Button 
            onClick={() => navigate(-1)} 
            variant="outline"
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
          <Button 
            onClick={handleGoToDashboard} 
            variant="default"
            className="gap-2"
          >
            <Home className="h-4 w-4" />
            Ke Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
